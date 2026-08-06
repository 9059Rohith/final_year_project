"""Speech evaluation service using ML models."""
import io
import numpy as np
import re
import threading
from typing import Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("[WARNING] librosa not installed. Speech scoring will use MFCC fallback mode.")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[WARNING] torch not installed. Wav2Vec2 ASR will be skipped.")

try:
    from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor, Wav2Vec2CTCTokenizer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("[WARNING] Transformers not available. Install with: pip install transformers torch")

from ..utils.audio_utils import extract_mfcc, calculate_airflow_score, calculate_audio_similarity
from . import advanced_speech


class SpeechEvaluator:
    """Speech evaluation service using Wav2Vec2 for accurate phoneme recognition."""
    
    def __init__(self):
        """Initialize lightweight metadata; load the ML model on first use."""
        self.model = None
        self.processor = None
        self._model_attempted = False
        self._model_lock = threading.Lock()
        self.reference_mfccs = self._init_reference_mfccs()

    def _ensure_model(self) -> None:
        """Load the optional ASR model once, outside application startup."""
        if self._model_attempted or not TRANSFORMERS_AVAILABLE:
            return
        with self._model_lock:
            if self._model_attempted:
                return
            self._model_attempted = True
            try:
                print("[INFO] Loading Wav2Vec2 model...")
                model_name = "facebook/wav2vec2-base-960h"
                self.processor = Wav2Vec2Processor.from_pretrained(model_name)
                self.model = Wav2Vec2ForCTC.from_pretrained(model_name)
                self.model.eval()
                print(f"[OK] Wav2Vec2 model loaded: {model_name}")
            except Exception as e:
                print(f"[WARN] Could not load Wav2Vec2 model: {e}")
                print("   Using fallback MFCC-based evaluation")
                self.model = None
                self.processor = None

    def warm_up(self) -> None:
        """Load the recognizer in a background worker before the first recording."""
        self._ensure_model()
    
    def _init_reference_mfccs(self) -> Dict[str, np.ndarray]:
        """Initialize reference MFCC templates for each phoneme."""
        # Real-world inspired MFCC patterns for Tamil phonemes
        # Based on typical formant patterns and articulation
        return {
            # Vowel 'a' - open central vowel, low F1 and F2
            "a": np.array([15.2, -8.5, 12.3, -5.6, 3.2, -1.8, 2.1, -0.9, 1.2, -0.6, 0.4, -0.3, 0.2]),
            # Vowel 'aa' - longer open vowel, similar but sustained
            "aa": np.array([16.1, -9.2, 13.1, -6.1, 3.5, -2.0, 2.3, -1.0, 1.3, -0.7, 0.5, -0.3, 0.2]),
            # Consonant 'la' - lateral approximant + vowel
            "la": np.array([14.5, -7.8, 10.5, -4.2, 2.8, -1.5, 1.9, -0.8, 1.0, -0.5, 0.3, -0.2, 0.1]),
            # Consonant 'ta' - dental stop + vowel
            "ta": np.array([13.8, -6.9, 9.8, -3.9, 2.5, -1.3, 1.7, -0.7, 0.9, -0.4, 0.3, -0.2, 0.1]),
            # Word 'amma' - vowel + nasal + vowel
            "amma": np.array([15.5, -8.2, 11.8, -5.1, 3.0, -1.7, 2.0, -0.9, 1.1, -0.6, 0.4, -0.3, 0.2]),
            # Word 'appa' - vowel + plosive + vowel (more energy)
            "appa": np.array([16.3, -9.5, 13.5, -6.5, 3.8, -2.2, 2.5, -1.1, 1.4, -0.8, 0.6, -0.4, 0.3])
        }
    
    def evaluate_pronunciation(
        self,
        audio_bytes: bytes,
        target_phoneme: str,
        browser_transcript: str = "",
    ) -> Dict:
        """
        Evaluate pronunciation of audio against target phoneme.
        
        Args:
            audio_bytes: Raw audio data
            target_phoneme: Target phoneme/word to evaluate against
            
        Returns:
            Dictionary with evaluation metrics
        """
        target_phoneme = str(target_phoneme).strip().lower()
        print(f"\n[EVAL] Evaluating pronunciation for: {target_phoneme}")

        try:
            if target_phoneme not in self.reference_mfccs:
                return self._rejected_result(
                    "invalid_target",
                    "This lesson target is not supported.",
                )

            signal = self._analyze_signal(audio_bytes)
            if not signal["has_speech"]:
                return self._rejected_result(
                    "no_speech",
                    "I could not hear a clear voice. Move closer to the microphone and try again.",
                )

            duration_matches = self._duration_matches_target(
                target_phoneme, signal["active_duration"]
            )
            browser_transcript = str(browser_transcript or "").strip()[:64]
            browser_match = self._match_phoneme(browser_transcript, target_phoneme)

            # Chrome/Edge speech recognition is substantially better at short
            # Tamil words than an English sentence ASR model. A matching browser
            # transcript is still accepted only after real audio and duration
            # checks above, and it is never persisted by this service.
            if not browser_match:
                self._ensure_model()

            # Extract MFCC features
            user_mfcc = extract_mfcc(audio_bytes)
            print(f"[INFO] User MFCC extracted: shape {user_mfcc.shape}")
            
            # Get reference MFCC for target phoneme
            ref_mfcc = self.reference_mfccs.get(
                target_phoneme.lower(),
                self.reference_mfccs["a"]
            )
            print(f"[INFO] Reference MFCC loaded for: {target_phoneme}")
            
            # Calculate MFCC similarity
            mfcc_score = calculate_audio_similarity(user_mfcc, ref_mfcc)
            print(f"[INFO] MFCC Similarity Score: {mfcc_score:.2f}/100")
            
            # Calculate airflow score
            airflow_score = calculate_airflow_score(audio_bytes)
            print(f"[INFO] Airflow Score: {airflow_score:.2f}")
            
            # Phoneme recognition using Wav2Vec2
            phoneme_match = browser_match
            transcription = browser_transcript
            validation_source = "browser_speech_recognition" if browser_match else "none"

            if not browser_match and self.model and self.processor:
                try:
                    transcription = self._transcribe_audio(audio_bytes)
                    phoneme_match = self._match_phoneme(transcription, target_phoneme)
                    if phoneme_match:
                        validation_source = "server_asr"
                    print(f"[INFO] Transcription: '{transcription}' | Match: {phoneme_match}")
                except Exception as e:
                    print(f"[WARN] Transcription error: {e}")
                    phoneme_match = False
            elif not browser_match:
                # Acoustic features can reject silence and poor recordings, but
                # they cannot honestly identify one authored phoneme from another.
                phoneme_match = False
                print("[INFO] Recognizer unavailable; acoustic-only result cannot pass")

            # Real syllable-level GOP via VTLN + DTW forced alignment over the
            # Wav2Vec2 CTC posteriorgram. Reference-free; None if model absent.
            gop_result = None
            if not browser_match and self.model and self.processor:
                try:
                    audio_np = self._load_audio_array(audio_bytes)
                    gop_result = advanced_speech.syllable_gop(
                        audio_np, target_phoneme, self.model, self.processor
                    )
                    if gop_result:
                        print(f"[INFO] GOP: {gop_result['overall_gop']:.2f} "
                              f"weakest='{gop_result['weakest_syllable']}' "
                              f"{gop_result['syllables']}")
                except Exception as e:
                    print(f"[WARN] GOP computation error: {e}")
                    gop_result = None

            # gop_score is the real GOP (0-100) when available, else the MFCC proxy
            if gop_result:
                gop_score = gop_result["overall_gop"] * 100.0
            else:
                gop_score = mfcc_score * 0.9

            if gop_result and gop_result["overall_gop"] >= 0.55:
                phoneme_match = True
                validation_source = "server_gop"
            phoneme_match = bool(phoneme_match and duration_matches)

            # Calculate overall accuracy (GOP, when present, is the strongest signal)
            accuracy = self._calculate_accuracy(
                mfcc_score, airflow_score, phoneme_match,
                gop_score=gop_result["overall_gop"] * 100.0 if gop_result else None,
            )
            if not phoneme_match:
                accuracy = min(accuracy, 69.0)
            else:
                # An exact recognizer match plus verified voice activity is the
                # strongest signal for these isolated curriculum sounds. Keep the
                # displayed score consistent with the validated outcome.
                accuracy = max(accuracy, 82.0)
            if not duration_matches:
                accuracy = min(accuracy, 40.0)
            print(f"[INFO] Final Accuracy: {accuracy:.2f}%")

            # Generate feedback (syllable-aware when GOP is available)
            feedback = (
                self._duration_feedback(target_phoneme)
                if not duration_matches
                else self._generate_feedback(
                    target_phoneme,
                    accuracy,
                    phoneme_match,
                    airflow_score,
                    gop_result=gop_result,
                )
            )

            result = {
                "accuracy": round(accuracy, 2),
                "phoneme_match": phoneme_match,
                "mfcc_score": round(mfcc_score, 2),
                "gop_score": round(gop_score, 2),
                "airflow_score": round(airflow_score, 2),
                "feedback": feedback,
                "transcription": transcription if transcription else "(no speech detected)",
                "syllable_scores": gop_result["syllables"] if gop_result else [],
                "weakest_syllable": gop_result["weakest_syllable"] if gop_result else None,
                "validation_status": (
                    "duration_mismatch"
                    if not duration_matches
                    else "validated"
                    if phoneme_match
                    else "not_matched"
                    if browser_transcript or (self.model and self.processor)
                    else "recognizer_unavailable"
                ),
                "validation_source": validation_source if phoneme_match else "none",
                "active_duration_ms": round(signal["active_duration"] * 1000),
            }
            
            print(f"[OK] Evaluation complete: accuracy={result['accuracy']}\n")
            return result
            
        except Exception as e:
            print(f"[ERROR] Error in evaluate_pronunciation: {e}")
            import traceback
            traceback.print_exc()
            return {
                "accuracy": 50.0,
                "phoneme_match": False,
                "mfcc_score": 50.0,
                "gop_score": 45.0,
                "airflow_score": 0.5,
                "feedback": "Could not process audio properly. Please ensure you're speaking clearly.",
                "transcription": "(error processing audio)",
                "validation_status": "processing_error",
                "validation_source": "none",
            }

    @staticmethod
    def _rejected_result(validation_status: str, feedback: str) -> Dict:
        return {
            "accuracy": 0.0,
            "phoneme_match": False,
            "mfcc_score": 0.0,
            "gop_score": 0.0,
            "airflow_score": 0.0,
            "feedback": feedback,
            "transcription": "",
            "syllable_scores": [],
            "weakest_syllable": None,
            "validation_status": validation_status,
            "validation_source": "none",
            "active_duration_ms": 0,
        }

    @staticmethod
    def _duration_matches_target(target: str, active_duration: float) -> bool:
        minimum_duration = {
            "a": 0.18,
            "aa": 0.40,
            "la": 0.25,
            "ta": 0.18,
            "amma": 0.45,
            "appa": 0.45,
        }
        return active_duration >= minimum_duration.get(target, float("inf"))

    @staticmethod
    def _analyze_signal(audio_bytes: bytes) -> Dict:
        audio_io = io.BytesIO(audio_bytes)
        audio, sample_rate = librosa.load(audio_io, sr=16000, mono=True)
        if audio.size == 0 or not np.all(np.isfinite(audio)):
            return {"has_speech": False, "active_duration": 0.0}
        peak = float(np.max(np.abs(audio)))
        rms = float(np.sqrt(np.mean(np.square(audio))))
        trimmed, _ = librosa.effects.trim(audio, top_db=25)
        active_duration = float(len(trimmed) / sample_rate) if sample_rate else 0.0
        has_speech = peak >= 0.015 and rms >= 0.005 and active_duration >= 0.12
        return {
            "has_speech": has_speech,
            "active_duration": active_duration,
            "peak": peak,
            "rms": rms,
        }
    
    def _load_audio_array(self, audio_bytes: bytes) -> np.ndarray:
        """Load audio bytes into a normalized, trimmed 16 kHz mono waveform."""
        audio_io = io.BytesIO(audio_bytes)
        audio, _ = librosa.load(audio_io, sr=16000, mono=True)
        audio = audio / (np.max(np.abs(audio)) + 1e-8)
        audio, _ = librosa.effects.trim(audio, top_db=20)
        return audio

    def _transcribe_audio(self, audio_bytes: bytes) -> str:
        """Transcribe audio using Wav2Vec2 with improved preprocessing."""
        try:
            # Load audio with proper resampling
            audio_io = io.BytesIO(audio_bytes)
            audio, sr = librosa.load(audio_io, sr=16000, mono=True)
            
            # Normalize audio
            audio = audio / (np.max(np.abs(audio)) + 1e-8)
            
            # Apply some preprocessing
            # Remove silence from beginning and end
            audio, _ = librosa.effects.trim(audio, top_db=20)
            
            # Process audio through Wav2Vec2
            input_values = self.processor(
                audio,
                sampling_rate=16000,
                return_tensors="pt",
                padding=True
            ).input_values
            
            # Get logits from model
            with torch.no_grad():
                logits = self.model(input_values).logits
            
            # Decode to text
            predicted_ids = torch.argmax(logits, dim=-1)
            transcription = self.processor.batch_decode(predicted_ids)[0]
            
            # Clean up transcription
            transcription = transcription.lower().strip()
            
            print(f"   [INFO] Raw transcription: '{transcription}'")
            
            return transcription
            
        except Exception as e:
            print(f"   [ERROR] Transcription error: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    def _match_phoneme(self, transcription: str, target: str) -> bool:
        """
        Improved phoneme matching with fuzzy matching.
        Handles variations and common mispronunciations.
        """
        if not transcription:
            return False
            
        target = target.lower().strip()
        compact_transcript = re.sub(r"[\s\-_.!,?'\"]+", "", transcription.lower())
        tamil_variants = {
            "a": {"அ"},
            "aa": {"ஆ"},
            "la": {"ல", "லா"},
            "ta": {"த", "தா"},
            "amma": {"அம்மா"},
            "appa": {"அப்பா"},
        }
        if compact_transcript in tamil_variants.get(target, set()):
            return True
        tokens = re.findall(r"[a-z]+", transcription.lower())
        if not tokens:
            return False
        compact = "".join(tokens)

        phoneme_map = {
            "a": {"a", "ah", "uh"},
            "aa": {"a", "aa", "ah", "aah", "ahh", "aaa"},
            "la": {"la", "lah", "lla"},
            "ta": {"ta", "tah", "tha", "da", "tall"},
            "amma": {"amma", "ama", "ema", "emma", "ummah", "mom", "mother"},
            "appa": {"appa", "apa", "uppah", "upah", "upper", "papa", "dad", "father"},
        }
        variants = phoneme_map.get(target, set())
        matched = any(token in variants for token in tokens) or compact in variants
        if matched:
            print(f"   [OK] Complete phoneme token matched in '{transcription}'")
        return matched

    @staticmethod
    def _duration_feedback(target_phoneme: str) -> str:
        if target_phoneme == "aa":
            return "I heard the sound. Hold 'AA' a little longer, then try again."
        return f"I heard you. Say the whole '{target_phoneme}' sound once more."
    
    def _calculate_accuracy(
        self,
        mfcc_score: float,
        airflow_score: float,
        phoneme_match: bool,
        gop_score: float = None
    ) -> float:
        """
        Calculate overall accuracy score with improved precision.

        Uses a more accurate scoring system for reliable speech evaluation.
        MFCC score is 0-100, airflow is 0-1. When a real GOP score (0-100) is
        provided it is the most principled signal, so the acoustic base score is
        a 60/40 blend of GOP and MFCC similarity.
        """
        # Blend in the real GOP when available: it directly measures whether the
        # intended phones were produced, so weight it heavily over raw spectral
        # similarity. Falls back to MFCC-only when GOP is unavailable.
        if gop_score is not None:
            mfcc_score = 0.6 * gop_score + 0.4 * mfcc_score

        # Base score from acoustic similarity (0-100) with improved mapping
        # More realistic scoring based on actual pronunciation quality
        if mfcc_score >= 85:
            base_score = 90 + (mfcc_score - 85) * 0.67  # 90-100 for excellent
        elif mfcc_score >= 75:
            base_score = 80 + (mfcc_score - 75)  # 80-90 for very good
        elif mfcc_score >= 65:
            base_score = 70 + (mfcc_score - 65)  # 70-80 for good
        elif mfcc_score >= 55:
            base_score = 60 + (mfcc_score - 55)  # 60-70 for fair
        elif mfcc_score >= 40:
            base_score = 45 + (mfcc_score - 40)  # 45-60 for needs practice
        else:
            base_score = mfcc_score * 1.125  # 0-45 for poor
        
        # Airflow contribution (convert 0-1 to bonus points)
        # Good airflow control adds up to 5 points
        airflow_bonus = min(5, airflow_score * 5)
        
        # Phoneme match bonus (strong weight for ML detection)
        # If the ML model correctly identifies the phoneme, it's a strong signal
        phoneme_bonus = 10 if phoneme_match else 0
        
        # Calculate final accuracy
        accuracy = base_score + airflow_bonus + phoneme_bonus
        
        # Clamp to 0-100
        # Don't artificially inflate scores - give honest feedback
        accuracy = max(0, min(100, accuracy))
        
        return accuracy
    
    def _generate_feedback(
        self,
        target_phoneme: str,
        accuracy: float,
        phoneme_match: bool,
        airflow_score: float,
        gop_result: dict = None
    ) -> str:
        """Generate constructive, child-friendly feedback based on performance."""
        phoneme_lower = target_phoneme.lower()

        # When the GOP pinpoints a weak syllable in a multi-syllable word and the
        # attempt wasn't already excellent, target that exact syllable.
        if (
            gop_result
            and accuracy < 90
            and len(gop_result.get("syllables", [])) > 1
            and gop_result.get("weakest_syllable")
        ):
            weak = gop_result["weakest_syllable"]
            return (
                f"Good effort! The '{weak}' part of '{target_phoneme}' needs a "
                f"little more practice. Say it slowly: "
                f"{'-'.join(s['syllable'] for s in gop_result['syllables'])}, "
                f"and focus on '{weak}'."
            )

        if accuracy >= 90:
            feedbacks = [
                f"🎉 Excellent! You pronounced '{target_phoneme}' perfectly!",
                f"⭐ Outstanding! That's exactly how '{target_phoneme}' should sound!",
                f"🌟 Amazing work! Your '{target_phoneme}' is spot on!"
            ]
            return feedbacks[int(accuracy) % len(feedbacks)]
        
        elif accuracy >= 75:
            feedbacks = [
                f"Great job! Your '{target_phoneme}' is very good. Almost perfect!",
                f"Well done! That's a really good '{target_phoneme}'. Keep it up!",
                f"Nice! Your pronunciation of '{target_phoneme}' is excellent!"
            ]
            return feedbacks[int(accuracy) % len(feedbacks)]
        
        elif accuracy >= 60:
            if phoneme_lower in ["a", "aa"]:
                return "Good effort! Try opening your mouth a bit wider, like when the doctor checks your throat. Say 'AHH'!"
            elif phoneme_lower == "la":
                return "You're on the right track! Touch the tip of your tongue to the roof of your mouth, just behind your teeth."
            elif phoneme_lower == "ta":
                return "Nice try! Make a quick tap with your tongue behind your top teeth for the 'T' sound."
            elif phoneme_lower == "amma":
                if airflow_score > 0.6:
                    return "Good attempt! Try using less air. Press your lips together gently for the 'MM' sound."
                else:
                    return "You're getting there! Say it slowly: AH...MM...MAH. Notice how your lips touch for 'MM'."
            elif phoneme_lower == "appa":
                if airflow_score < 0.4:
                    return "Good try! Blow more air when you say 'PP'. It should feel like blowing out a candle!"
                else:
                    return "Nice effort! Say AH...PP...PAH. Make the 'PP' sound strong and clear!"
            else:
                return f"Good attempt! Listen carefully to '{target_phoneme}' and try to match the sound exactly."
        
        elif accuracy >= 40:
            if phoneme_lower in ["a", "aa"]:
                return "Let's practice! Make your mouth round like 'O', then open wide and say 'AHH'. Watch in a mirror!"
            elif phoneme_lower == "la":
                return "Let's work on this! Put your tongue up high in your mouth and let the sound flow around it."
            elif phoneme_lower == "ta":
                return "Let's try again! Touch your tongue to the bumpy part behind your top teeth, then let it drop quickly."
            elif "amma" in phoneme_lower or "appa" in phoneme_lower:
                return f"Let's break it down! Say each sound slowly: {'-'.join(list(target_phoneme))}. Then speed it up!"
            else:
                return f"Keep trying! Play the example '{target_phoneme}' sound again and copy it carefully."
        
        else:
            return f"Let's practice together! Listen to the '{target_phoneme}' sound, watch the video, and try again. You can do it!"


# Global instance
speech_evaluator = SpeechEvaluator()
