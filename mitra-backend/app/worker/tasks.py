"""Celery tasks — Tamil ASR scoring and nightly progress snapshots."""
import os
from datetime import datetime, timezone
from typing import Optional

from .celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def score_attempt_task(
    self,
    attempt_id: str,
    audio_path: str,
    target_word: str,
    phoneme_breakdown: dict,
):
    """
    Track B: Celery task for Whisper Tamil ASR + phoneme scoring.

    Flow:
    1. Transcribe audio with Whisper (Tamil)
    2. Compute phoneme similarity score
    3. Update session_attempts row
    4. Delete audio file
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import sys
    import os as _os

    # Add app root to path for imports
    sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

    try:
        # Synchronous DB access from Celery worker
        from app.config import settings
        from app.models.session import SessionAttempt, MitraResponseType
        from app.services.tamil_asr import transcribe_tamil
        from app.services.scoring import compute_similarity_score, compute_phoneme_accuracy, determine_mitra_response
        from sqlalchemy import create_engine, text
        from sqlalchemy.orm import sessionmaker

        engine = create_engine(settings.SYNC_DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        try:
            # Mark as processing
            attempt = db.query(SessionAttempt).filter(SessionAttempt.id == attempt_id).first()
            if not attempt:
                print(f"[Task] Attempt {attempt_id} not found")
                return {"status": "error", "message": "Attempt not found"}

            attempt.scoring_status = "processing"
            db.commit()

            # Step 1: Transcribe
            asr_result = transcribe_tamil(audio_path)
            transcript = asr_result.get("transcript", "")

            # Step 2: Score
            score = compute_similarity_score(transcript, target_word, phoneme_breakdown)
            phoneme_acc = compute_phoneme_accuracy(transcript, target_word, phoneme_breakdown)
            response_type = determine_mitra_response(score)

            # Step 3: Update DB
            attempt.asr_transcript = transcript
            attempt.similarity_score = score
            attempt.phoneme_accuracy = phoneme_acc
            attempt.scoring_status = "done"
            attempt.mitra_response_type = MitraResponseType(response_type)
            attempt.audio_file_path = None  # Clear path after processing
            db.commit()

            print(f"[Task] Scored attempt {attempt_id}: {score:.1f} ({response_type})")

            # Step 4: Delete audio file
            if audio_path and os.path.exists(audio_path):
                try:
                    os.remove(audio_path)
                except OSError:
                    pass

            return {
                "status": "done",
                "attempt_id": attempt_id,
                "score": score,
                "transcript": transcript,
                "response_type": response_type,
            }

        except Exception as e:
            print(f"[Task] Error scoring attempt {attempt_id}: {e}")
            # Mark as failed
            try:
                attempt = db.query(SessionAttempt).filter(SessionAttempt.id == attempt_id).first()
                if attempt:
                    attempt.scoring_status = "failed"
                    db.commit()
            except Exception:
                pass
            raise self.retry(exc=e)

        finally:
            db.close()
            engine.dispose()

    except Exception as e:
        print(f"[Task] Fatal error: {e}")
        raise


@celery_app.task
def compute_nightly_snapshots():
    """
    Beat task: compute progress snapshots for all children.
    Runs nightly at 1 AM IST.
    """
    import sys
    import os as _os
    sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))))

    try:
        from app.config import settings
        from app.models.child import Child
        from app.models.session import TherapySession, SessionAttempt, ProgressSnapshot
        from app.models.program import AssignedProgram, ProgramStatus
        from sqlalchemy import create_engine, func
        from sqlalchemy.orm import sessionmaker
        from datetime import date, timedelta

        engine = create_engine(settings.SYNC_DATABASE_URL)
        Session = sessionmaker(bind=engine)
        db = Session()

        try:
            children = db.query(Child).all()
            snapshot_date = datetime.now(timezone.utc)
            count = 0

            for child in children:
                # Get all active programs
                programs = db.query(AssignedProgram).filter(
                    AssignedProgram.child_id == child.id,
                    AssignedProgram.status.in_([ProgramStatus.not_started, ProgramStatus.in_progress]),
                ).all()

                for program in programs:
                    module_id = program.module_id

                    # Get attempts for this module in last 30 days
                    thirty_days_ago = datetime.now(timezone.utc).replace(day=max(1, datetime.now().day - 30))
                    attempts = db.query(SessionAttempt).join(
                        TherapySession, SessionAttempt.session_id == TherapySession.id
                    ).filter(
                        SessionAttempt.child_id == child.id,
                        SessionAttempt.scoring_status == "done",
                        TherapySession.assigned_program_id == program.id,
                    ).all()

                    if not attempts:
                        continue

                    scores = [a.similarity_score for a in attempts if a.similarity_score is not None]
                    avg_score = sum(scores) / len(scores) if scores else 0.0
                    mastered = sum(1 for s in scores if s >= 80)

                    # Sessions count
                    session_count = db.query(func.count(TherapySession.id)).filter(
                        TherapySession.child_id == child.id,
                        TherapySession.assigned_program_id == program.id,
                        TherapySession.status == "completed",
                    ).scalar() or 0

                    # Determine trend (compare to previous snapshot)
                    prev_snap = db.query(ProgressSnapshot).filter(
                        ProgressSnapshot.child_id == child.id,
                        ProgressSnapshot.module_id == module_id,
                    ).order_by(ProgressSnapshot.snapshot_date.desc()).first()

                    trend = "stable"
                    if prev_snap:
                        diff = avg_score - prev_snap.mastery_score
                        if diff > 5:
                            trend = "improving"
                        elif diff < -5:
                            trend = "declining"

                    snap = ProgressSnapshot(
                        child_id=child.id,
                        module_id=module_id,
                        snapshot_date=snapshot_date,
                        mastery_score=round(avg_score, 1),
                        trend=trend,
                        items_mastered=mastered,
                        items_in_progress=len(scores) - mastered,
                        total_attempts=len(attempts),
                        average_score=round(avg_score, 1),
                        session_count=session_count,
                    )
                    db.add(snap)
                    count += 1

            db.commit()
            print(f"[Beat] Created {count} progress snapshots")
            return {"snapshots_created": count}

        finally:
            db.close()
            engine.dispose()

    except Exception as e:
        print(f"[Beat] Nightly snapshot error: {e}")
        raise
