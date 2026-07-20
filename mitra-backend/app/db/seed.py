"""
Seed script: populates the DB with realistic Tamil therapy data.
Run: python -m app.db.seed
"""
import asyncio
import uuid
import json
from datetime import datetime, date, timedelta
import random
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def hash_pw(pw: str) -> str:
    return pwd_context.hash(pw)


ANIMALS_MODULE = {
    "title": "விலங்குகள் (Animals)",
    "description": "Learn the names of common animals in Tamil",
    "difficulty": "beginner",
    "items": [
        {"word": "நாய்", "translit": "naay", "meaning": "Dog", "phonemes": ["n", "aa", "y"], "syllables": ["naay"]},
        {"word": "பூனை", "translit": "poonai", "meaning": "Cat", "phonemes": ["p", "uu", "n", "ai"], "syllables": ["poo", "nai"]},
        {"word": "யானை", "translit": "yaanai", "meaning": "Elephant", "phonemes": ["y", "aa", "n", "ai"], "syllables": ["yaa", "nai"]},
        {"word": "குதிரை", "translit": "kutirai", "meaning": "Horse", "phonemes": ["k", "u", "t", "i", "r", "ai"], "syllables": ["ku", "ti", "rai"]},
        {"word": "மாடு", "translit": "maadu", "meaning": "Cow", "phonemes": ["m", "aa", "d", "u"], "syllables": ["maa", "du"]},
        {"word": "ஆடு", "translit": "aadu", "meaning": "Goat", "phonemes": ["aa", "d", "u"], "syllables": ["aa", "du"]},
        {"word": "கோழி", "translit": "kozhli", "meaning": "Chicken", "phonemes": ["k", "o", "zh", "l", "i"], "syllables": ["ko", "zhli"]},
        {"word": "மீன்", "translit": "meen", "meaning": "Fish", "phonemes": ["m", "ee", "n"], "syllables": ["meen"]},
        {"word": "தவளை", "translit": "thavalai", "meaning": "Frog", "phonemes": ["th", "a", "v", "a", "l", "ai"], "syllables": ["tha", "va", "lai"]},
        {"word": "பாம்பு", "translit": "paambu", "meaning": "Snake", "phonemes": ["p", "aa", "m", "b", "u"], "syllables": ["paam", "bu"]},
        {"word": "காகம்", "translit": "kaagam", "meaning": "Crow", "phonemes": ["k", "aa", "g", "a", "m"], "syllables": ["kaa", "gam"]},
        {"word": "புலி", "translit": "puli", "meaning": "Tiger", "phonemes": ["p", "u", "l", "i"], "syllables": ["pu", "li"]},
        {"word": "சிங்கம்", "translit": "singam", "meaning": "Lion", "phonemes": ["s", "i", "ng", "a", "m"], "syllables": ["sin", "gam"]},
        {"word": "குரங்கு", "translit": "kurangu", "meaning": "Monkey", "phonemes": ["k", "u", "r", "a", "ng", "u"], "syllables": ["ku", "ran", "gu"]},
        {"word": "முயல்", "translit": "muyal", "meaning": "Rabbit", "phonemes": ["m", "u", "y", "a", "l"], "syllables": ["mu", "yal"]},
        {"word": "அணில்", "translit": "anil", "meaning": "Squirrel", "phonemes": ["a", "n", "i", "l"], "syllables": ["a", "nil"]},
        {"word": "தேனீ", "translit": "thaenee", "meaning": "Bee", "phonemes": ["th", "ae", "n", "ee"], "syllables": ["thae", "nee"]},
        {"word": "ஆமை", "translit": "aamai", "meaning": "Tortoise", "phonemes": ["aa", "m", "ai"], "syllables": ["aa", "mai"]},
        {"word": "கழுதை", "translit": "kazhuthai", "meaning": "Donkey", "phonemes": ["k", "a", "zh", "u", "th", "ai"], "syllables": ["ka", "zhu", "thai"]},
        {"word": "குரல்", "translit": "kural", "meaning": "Voice", "phonemes": ["k", "u", "r", "a", "l"], "syllables": ["ku", "ral"]},
    ]
}

FAMILY_MODULE = {
    "title": "குடும்பம் (Family Words)",
    "description": "Learn family relationship words in Tamil",
    "difficulty": "beginner",
    "items": [
        {"word": "அம்மா", "translit": "amma", "meaning": "Mother", "phonemes": ["a", "m", "m", "aa"], "syllables": ["am", "maa"]},
        {"word": "அப்பா", "translit": "appa", "meaning": "Father", "phonemes": ["a", "p", "p", "aa"], "syllables": ["ap", "paa"]},
        {"word": "அண்ணன்", "translit": "annan", "meaning": "Elder Brother", "phonemes": ["a", "nn", "a", "n"], "syllables": ["an", "nan"]},
        {"word": "அக்கா", "translit": "akka", "meaning": "Elder Sister", "phonemes": ["a", "k", "k", "aa"], "syllables": ["ak", "kaa"]},
        {"word": "தம்பி", "translit": "thambi", "meaning": "Younger Brother", "phonemes": ["th", "a", "m", "b", "i"], "syllables": ["tham", "bi"]},
        {"word": "தங்கை", "translit": "thangai", "meaning": "Younger Sister", "phonemes": ["th", "a", "ng", "a", "i"], "syllables": ["than", "gai"]},
        {"word": "தாத்தா", "translit": "thaatha", "meaning": "Grandfather", "phonemes": ["th", "aa", "th", "th", "aa"], "syllables": ["thaat", "thaa"]},
        {"word": "பாட்டி", "translit": "paatti", "meaning": "Grandmother", "phonemes": ["p", "aa", "tt", "i"], "syllables": ["paat", "ti"]},
        {"word": "மாமா", "translit": "maama", "meaning": "Uncle", "phonemes": ["m", "aa", "m", "aa"], "syllables": ["maa", "maa"]},
        {"word": "அத்தை", "translit": "atthai", "meaning": "Aunt", "phonemes": ["a", "tt", "ai"], "syllables": ["at", "thai"]},
        {"word": "குழந்தை", "translit": "kuzhanthai", "meaning": "Child/Baby", "phonemes": ["k", "u", "zh", "a", "n", "th", "ai"], "syllables": ["ku", "zhan", "thai"]},
        {"word": "நண்பன்", "translit": "nanpan", "meaning": "Friend (male)", "phonemes": ["n", "a", "nn", "p", "a", "n"], "syllables": ["nan", "pan"]},
        {"word": "நண்பி", "translit": "nanpi", "meaning": "Friend (female)", "phonemes": ["n", "a", "nn", "p", "i"], "syllables": ["nan", "pi"]},
        {"word": "ஆசிரியர்", "translit": "aasiriyar", "meaning": "Teacher", "phonemes": ["aa", "s", "i", "r", "i", "y", "a", "r"], "syllables": ["aa", "si", "ri", "yar"]},
        {"word": "குடும்பம்", "translit": "kudumpam", "meaning": "Family", "phonemes": ["k", "u", "d", "u", "m", "p", "a", "m"], "syllables": ["ku", "dum", "pam"]},
        {"word": "இல்லம்", "translit": "illam", "meaning": "Home", "phonemes": ["i", "l", "l", "a", "m"], "syllables": ["il", "lam"]},
        {"word": "அன்பு", "translit": "anbu", "meaning": "Love", "phonemes": ["a", "n", "b", "u"], "syllables": ["an", "bu"]},
        {"word": "மகிழ்ச்சி", "translit": "makizhchi", "meaning": "Happiness", "phonemes": ["m", "a", "k", "i", "zh", "ch", "i"], "syllables": ["ma", "kizh", "chi"]},
        {"word": "நலம்", "translit": "nalam", "meaning": "Wellbeing", "phonemes": ["n", "a", "l", "a", "m"], "syllables": ["na", "lam"]},
        {"word": "வீடு", "translit": "veedu", "meaning": "House", "phonemes": ["v", "ee", "d", "u"], "syllables": ["vee", "du"]},
    ]
}

DAILY_ACTIONS_MODULE = {
    "title": "தினசரி செயல்கள் (Daily Actions)",
    "description": "Common daily action words and verbs in Tamil",
    "difficulty": "intermediate",
    "items": [
        {"word": "சாப்பிடு", "translit": "saappidu", "meaning": "Eat", "phonemes": ["s", "aa", "p", "p", "i", "d", "u"], "syllables": ["saap", "pi", "du"]},
        {"word": "குடி", "translit": "kudi", "meaning": "Drink", "phonemes": ["k", "u", "d", "i"], "syllables": ["ku", "di"]},
        {"word": "தூங்கு", "translit": "thoonggu", "meaning": "Sleep", "phonemes": ["th", "uu", "ng", "g", "u"], "syllables": ["thoong", "gu"]},
        {"word": "விளையாடு", "translit": "vilaiyaadu", "meaning": "Play", "phonemes": ["v", "i", "l", "a", "i", "y", "aa", "d", "u"], "syllables": ["vi", "lai", "yaa", "du"]},
        {"word": "படி", "translit": "padi", "meaning": "Study/Read", "phonemes": ["p", "a", "d", "i"], "syllables": ["pa", "di"]},
        {"word": "எழுது", "translit": "ezhuthu", "meaning": "Write", "phonemes": ["e", "zh", "u", "th", "u"], "syllables": ["e", "zhu", "thu"]},
        {"word": "ஓடு", "translit": "oodu", "meaning": "Run", "phonemes": ["o", "o", "d", "u"], "syllables": ["oo", "du"]},
        {"word": "நட", "translit": "nada", "meaning": "Walk", "phonemes": ["n", "a", "d", "a"], "syllables": ["na", "da"]},
        {"word": "பாடு", "translit": "paadu", "meaning": "Sing", "phonemes": ["p", "aa", "d", "u"], "syllables": ["paa", "du"]},
        {"word": "வா", "translit": "vaa", "meaning": "Come", "phonemes": ["v", "aa"], "syllables": ["vaa"]},
        {"word": "போ", "translit": "poo", "meaning": "Go", "phonemes": ["p", "oo"], "syllables": ["poo"]},
        {"word": "பார்", "translit": "paar", "meaning": "See/Look", "phonemes": ["p", "aa", "r"], "syllables": ["paar"]},
        {"word": "கேள்", "translit": "keel", "meaning": "Listen/Ask", "phonemes": ["k", "ee", "l"], "syllables": ["keel"]},
        {"word": "சொல்", "translit": "sol", "meaning": "Say/Tell", "phonemes": ["s", "o", "l"], "syllables": ["sol"]},
        {"word": "சிரி", "translit": "siri", "meaning": "Laugh/Smile", "phonemes": ["s", "i", "r", "i"], "syllables": ["si", "ri"]},
        {"word": "அழு", "translit": "azhu", "meaning": "Cry", "phonemes": ["a", "zh", "u"], "syllables": ["a", "zhu"]},
        {"word": "உட்கார்", "translit": "utkaar", "meaning": "Sit", "phonemes": ["u", "t", "k", "aa", "r"], "syllables": ["ut", "kaar"]},
        {"word": "எழு", "translit": "ezhu", "meaning": "Rise/Get up", "phonemes": ["e", "zh", "u"], "syllables": ["e", "zhu"]},
        {"word": "திற", "translit": "thira", "meaning": "Open", "phonemes": ["th", "i", "r", "a"], "syllables": ["thi", "ra"]},
        {"word": "மூடு", "translit": "moodu", "meaning": "Close", "phonemes": ["m", "uu", "d", "u"], "syllables": ["muu", "du"]},
    ]
}

IMAGE_URLS = {
    "நாய்": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
    "பூனை": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
    "யானை": "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400",
    "குதிரை": "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=400",
    "மாடு": "https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=400",
    "சிங்கம்": "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=400",
    "புலி": "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=400",
    "மீன்": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    "அம்மா": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    "அப்பா": "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400",
    "குழந்தை": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400",
    "இல்லம்": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400",
    "சாப்பிடு": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    "குடி": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
    "தூங்கு": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400",
    "விளையாடு": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400",
    "DEFAULT": "https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?w=400",
}


async def seed(session: AsyncSession) -> None:
    # Idempotency guard — this is called on every container start (docker-compose
    # command) AND from the admin "Seed Demo" button, both of which can run more
    # than once against a persistent volume. Without this check every re-run
    # duplicates every demo user/child/module/session indefinitely.
    existing = await session.execute(text("SELECT COUNT(*) FROM users"))
    if existing.scalar():
        print("\n🌱 Database already seeded — skipping (found existing users).")
        return

    print("\n🌱 Starting Mitra seed...")

    # 1. Admin
    admin_id = uuid.uuid4()
    await session.execute(text("""
        INSERT INTO users (id, email, full_name, password_hash, role, is_active, email_verified, created_at, updated_at)
        VALUES (:id, :email, :name, :pw, 'admin', true, true, now(), now())
        ON CONFLICT (email) DO NOTHING
    """), {"id": admin_id, "email": "admin@mitra.app", "name": "Mitra Admin", "pw": hash_pw("Admin@2024")})
    await session.commit()

    # 2. Therapists
    therapist_ids = []
    therapists_data = [
        {"email": "dr.kavitha@mitra.app", "name": "Dr. Kavitha Sundaram", "spec": "Speech-Language Pathology", "lic": "SLP-TN-2019-0042"},
        {"email": "dr.ramesh@mitra.app",  "name": "Dr. Ramesh Krishnan",  "spec": "Autism Spectrum Disorders",   "lic": "ASD-TN-2017-0118"},
    ]
    for t in therapists_data:
        tid = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO users (id, email, full_name, password_hash, role, is_active, email_verified, created_at, updated_at)
            VALUES (:id, :email, :name, :pw, 'therapist', true, true, now(), now())
            ON CONFLICT (email) DO NOTHING
        """), {"id": tid, "email": t["email"], "name": t["name"], "pw": hash_pw("Therapist@123")})
        await session.commit()
        row = await session.execute(text("SELECT id FROM users WHERE email = :e"), {"e": t["email"]})
        real_tid = uuid.UUID(str(row.scalar()))
        therapist_ids.append(real_tid)
        prof_id = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO therapist_profiles (id, user_id, license_number, specialization, years_of_experience, created_at, updated_at)
            VALUES (:id, :uid, :lic, :spec, 5, now(), now())
            ON CONFLICT DO NOTHING
        """), {"id": prof_id, "uid": real_tid, "lic": t["lic"], "spec": t["spec"]})
        await session.commit()

    # 3. Parents
    parent_ids = []
    parents_data = [
        {"email": "priya.rajan@gmail.com", "name": "Priya Rajan"},
        {"email": "suresh.kumar@gmail.com", "name": "Suresh Kumar"},
        {"email": "meena.iyer@gmail.com",   "name": "Meena Iyer"},
    ]
    for p in parents_data:
        pid = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO users (id, email, full_name, password_hash, role, is_active, email_verified, created_at, updated_at)
            VALUES (:id, :email, :name, :pw, 'parent', true, true, now(), now())
            ON CONFLICT (email) DO NOTHING
        """), {"id": pid, "email": p["email"], "name": p["name"], "pw": hash_pw("Parent@123")})
        await session.commit()
        row = await session.execute(text("SELECT id FROM users WHERE email = :e"), {"e": p["email"]})
        real_pid = uuid.UUID(str(row.scalar()))
        parent_ids.append(real_pid)
        pp_id = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO parent_profiles (id, user_id, preferred_language, created_at, updated_at)
            VALUES (:id, :uid, 'ta', now(), now())
            ON CONFLICT DO NOTHING
        """), {"id": pp_id, "uid": real_pid})
        await session.commit()

    # 4. Children
    child_ids = []
    children_data = [
        {"name": "Arjun Rajan",  "dob": date(2018, 3, 15),  "avatar": "avatar1", "p": 0, "t": 0},
        {"name": "Kavya Rajan",  "dob": date(2020, 7, 22),  "avatar": "avatar2", "p": 0, "t": 0},
        {"name": "Rohit Kumar",  "dob": date(2017, 11, 3),  "avatar": "avatar3", "p": 1, "t": 1},
        {"name": "Divya Kumar",  "dob": date(2019, 5, 18),  "avatar": "avatar4", "p": 1, "t": 0},
        {"name": "Ananya Iyer",  "dob": date(2018, 9, 30),  "avatar": "avatar5", "p": 2, "t": 1},
    ]
    for c in children_data:
        cid = uuid.uuid4()
        child_ids.append(cid)
        prefs = json.dumps({"reduce_motion": False, "mute_sudden_sounds": False, "font_size": "medium"})
        await session.execute(text("""
            INSERT INTO children (id, parent_id, therapist_id, name, date_of_birth, avatar, language,
                                  sensory_prefs, parent_consent_given, consent_timestamp, is_active, created_at, updated_at)
            VALUES (:id, :pid, :tid, :name, :dob, :avatar, 'ta',
                    cast(:prefs as json), true, now(), true, now(), now())
        """), {
            "id": cid, "pid": parent_ids[c["p"]], "tid": therapist_ids[c["t"]],
            "name": c["name"], "dob": c["dob"], "avatar": c["avatar"], "prefs": prefs,
        })
    await session.commit()

    # 5. Modules + Items
    module_ids = []
    for mod_data, t_idx in [(ANIMALS_MODULE, 0), (FAMILY_MODULE, 0), (DAILY_ACTIONS_MODULE, 1)]:
        mid = uuid.uuid4()
        module_ids.append(mid)
        await session.execute(text("""
            INSERT INTO therapy_modules (id, created_by_id, title, description, difficulty, language,
                                         is_published, target_age_min, target_age_max, created_at, updated_at)
            VALUES (:id, :tid, :title, :desc, :diff, 'ta', true, 3, 12, now(), now())
        """), {
            "id": mid, "tid": therapist_ids[t_idx],
            "title": mod_data["title"], "desc": mod_data["description"], "diff": mod_data["difficulty"],
        })
        for idx, item in enumerate(mod_data["items"]):
            iid = uuid.uuid4()
            img = IMAGE_URLS.get(item["word"], IMAGE_URLS["DEFAULT"])
            pb = json.dumps({"phonemes": item["phonemes"], "syllables": item["syllables"], "ipa": item["translit"]})
            await session.execute(text("""
                INSERT INTO module_items (id, module_id, order_index, target_word, transliteration,
                                          meaning, image_url, phoneme_breakdown, difficulty_weight, is_active, created_at, updated_at)
                VALUES (:id, :mid, :order, :word, :translit, :meaning, :img, cast(:pb as json), 1.0, true, now(), now())
            """), {
                "id": iid, "mid": mid, "order": idx,
                "word": item["word"], "translit": item["translit"], "meaning": item["meaning"],
                "img": img, "pb": pb,
            })
    await session.commit()

    # 6. Assigned Programs
    program_ids = []
    assignments = [
        (0, 0, 0, "in_progress"),
        (0, 1, 0, "not_started"),
        (1, 1, 0, "in_progress"),
        (2, 2, 1, "in_progress"),
        (2, 0, 1, "completed"),
        (3, 0, 0, "in_progress"),
        (4, 1, 1, "in_progress"),
        (4, 2, 1, "not_started"),
    ]
    for child_idx, mod_idx, therapist_idx, status in assignments:
        apid = uuid.uuid4()
        program_ids.append((child_idx, mod_idx, apid))
        await session.execute(text("""
            INSERT INTO assigned_programs (id, child_id, module_id, assigned_by_id, status, start_date, created_at, updated_at)
            VALUES (:id, :cid, :mid, :tid, :status, :start, now(), now())
        """), {
            "id": apid, "cid": child_ids[child_idx], "mid": module_ids[mod_idx],
            "tid": therapist_ids[therapist_idx], "status": status,
            "start": date.today() - timedelta(days=random.randint(10, 60)),
        })
    await session.commit()

    # 7. Historical sessions + attempts
    score_profiles = {
        0: {"base": 55, "spread": 20, "trend": 5},
        1: {"base": 70, "spread": 15, "trend": 2},
        2: {"base": 45, "spread": 25, "trend": 8},
        3: {"base": 80, "spread": 10, "trend": 1},
        4: {"base": 60, "spread": 20, "trend": 4},
    }

    for session_idx in range(32):
        child_idx = session_idx % 5
        days_ago = max(0, 60 - session_idx * 2)
        session_date = datetime.utcnow() - timedelta(days=days_ago)

        child_programs = [(ci, mi, apid) for ci, mi, apid in program_ids if ci == child_idx]
        if not child_programs:
            continue
        _, mod_idx, apid = random.choice(child_programs)

        items_rows = await session.execute(text(
            "SELECT id, target_word FROM module_items WHERE module_id = :mid ORDER BY order_index LIMIT 10"
        ), {"mid": module_ids[mod_idx]})
        items = items_rows.fetchall()
        if not items:
            continue

        num_items = min(len(items), random.randint(5, 10))
        profile = score_profiles[child_idx]
        session_num = session_idx // 5
        avg_score = min(100.0, profile["base"] + profile["trend"] * session_num + random.uniform(-profile["spread"], profile["spread"]))

        sid = uuid.uuid4()
        await session.execute(text("""
            INSERT INTO therapy_sessions (id, child_id, assigned_program_id, started_by_parent_id,
                status, total_items, completed_items, average_score, session_duration_seconds,
                completed_at, created_at, updated_at)
            VALUES (:id, :cid, :apid, :pid, 'completed', :total, :completed, :avg, :dur,
                    :cat, :cat, :cat)
        """), {
            "id": sid, "cid": child_ids[child_idx], "apid": apid,
            "pid": parent_ids[min(child_idx, len(parent_ids) - 1)],
            "total": num_items, "completed": num_items,
            "avg": round(avg_score, 1), "dur": random.randint(300, 900),
            "cat": session_date,
        })

        best_score = 0.0
        best_word = None
        selected_items = random.sample(items, num_items)
        for item_row in selected_items:
            item_id, item_word = item_row
            score = min(100.0, avg_score + random.uniform(-15, 15))
            if score > best_score:
                best_score = score
                best_word = item_word
            mitra_resp = "celebrate" if score >= 70 else "gentle_correct"
            pa = json.dumps({"score": round(score / 100, 2), "phonemes": [], "weakest": None})
            aid = uuid.uuid4()
            await session.execute(text("""
                INSERT INTO session_attempts (id, session_id, module_item_id, child_id,
                    attempt_number, mimic_played, asr_transcript, similarity_score,
                    phoneme_accuracy, scoring_status, mitra_response_type, created_at, updated_at)
                VALUES (:id, :sid, :iid, :cid, 1, true, :transcript, :score,
                        cast(:pa as json), 'done', :resp, :cat, :cat)
            """), {
                "id": aid, "sid": sid, "iid": item_id, "cid": child_ids[child_idx],
                "transcript": item_word, "score": round(score, 1),
                "pa": pa, "resp": mitra_resp, "cat": session_date,
            })

        # Update session best_word
        if best_word:
            await session.execute(text(
                "UPDATE therapy_sessions SET best_word = :bw WHERE id = :sid"
            ), {"bw": best_word, "sid": sid})
        await session.commit()

    # 8. Progress snapshots (last 7 days)
    for child_idx in range(5):
        child_prog = [(ci, mi, apid) for ci, mi, apid in program_ids if ci == child_idx]
        if not child_prog:
            continue
        _, mod_idx, _ = child_prog[0]
        profile = score_profiles[child_idx]
        for days_back in range(7):
            snap_date = datetime.utcnow() - timedelta(days=days_back)
            mastery = min(100.0, profile["base"] + profile["trend"] * (7 - days_back) + random.uniform(-5, 5))
            snap_id = uuid.uuid4()
            await session.execute(text("""
                INSERT INTO progress_snapshots (id, child_id, module_id, snapshot_date,
                    mastery_score, trend, items_mastered, items_in_progress, total_attempts,
                    average_score, session_count, created_at, updated_at)
                VALUES (:id, :cid, :mid, :snap_date,
                    :mastery, 'improving', :mastered, :in_prog, :attempts,
                    :avg, :sessions, now(), now())
            """), {
                "id": snap_id, "cid": child_ids[child_idx], "mid": module_ids[mod_idx],
                "snap_date": snap_date, "mastery": round(mastery, 1),
                "mastered": random.randint(3, 12), "in_prog": random.randint(3, 8),
                "attempts": random.randint(10, 40), "avg": round(mastery, 1),
                "sessions": random.randint(1, 4),
            })
        await session.commit()

    # 9. Print row counts
    tables = ["users", "therapist_profiles", "parent_profiles", "children",
              "therapy_modules", "module_items", "assigned_programs",
              "therapy_sessions", "session_attempts", "progress_snapshots"]
    print("\n📊 Seed complete — row counts:")
    for t in tables:
        row = await session.execute(text(f"SELECT COUNT(*) FROM {t}"))
        print(f"   {t:30s}: {row.scalar()}")
    print()


async def main() -> None:
    async with SessionLocal() as session:
        await seed(session)


if __name__ == "__main__":
    asyncio.run(main())
