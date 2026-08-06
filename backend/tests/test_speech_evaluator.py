import io
import wave

import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import evaluation as evaluation_router
from app.routers.evaluation import validate_lesson_target
from app.services.speech_evaluator import SpeechEvaluator
from app.utils.jwt_handler import get_current_user


def wav_bytes(duration: float, amplitude: float = 0.25, frequency: float = 220.0) -> bytes:
    sample_rate = 16000
    samples = int(sample_rate * duration)
    timeline = np.arange(samples, dtype=np.float32) / sample_rate
    signal = amplitude * np.sin(2 * np.pi * frequency * timeline)
    pcm = (np.clip(signal, -1, 1) * 32767).astype('<i2')
    output = io.BytesIO()
    with wave.open(output, 'wb') as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(sample_rate)
        stream.writeframes(pcm.tobytes())
    return output.getvalue()


def evaluator_without_model() -> SpeechEvaluator:
    evaluator = SpeechEvaluator()
    evaluator._model_attempted = True
    evaluator.model = None
    evaluator.processor = None
    return evaluator


def test_lesson_id_and_phoneme_must_match_the_authored_curriculum():
    assert validate_lesson_target(1, ' A ') == 'a'
    assert validate_lesson_target(6, 'APPA') == 'appa'
    with pytest.raises(ValueError):
        validate_lesson_target(1, 'aa')
    with pytest.raises(ValueError):
        validate_lesson_target(99, 'a')


def test_phoneme_matching_uses_complete_tokens_not_substrings_or_first_letters():
    evaluator = evaluator_without_model()
    assert evaluator._match_phoneme('ah', 'a') is True
    assert evaluator._match_phoneme('aah', 'aa') is True
    assert evaluator._match_phoneme('lah', 'la') is True
    assert evaluator._match_phoneme('tah', 'ta') is True
    assert evaluator._match_phoneme('amma', 'amma') is True
    assert evaluator._match_phoneme('up pah', 'appa') is True
    assert evaluator._match_phoneme('tall', 'ta') is True
    assert evaluator._match_phoneme('அ', 'a') is True
    assert evaluator._match_phoneme('ஆ', 'aa') is True
    assert evaluator._match_phoneme('அம்மா', 'amma') is True
    assert evaluator._match_phoneme('அப்பா', 'appa') is True
    assert evaluator._match_phoneme('cat', 'a') is False
    assert evaluator._match_phoneme('table', 'ta') is False
    assert evaluator._match_phoneme('apple', 'appa') is False


def test_silence_is_rejected_instead_of_receiving_a_passing_fallback_score():
    evaluator = evaluator_without_model()
    result = evaluator.evaluate_pronunciation(wav_bytes(0.8, amplitude=0), 'a')
    assert result['accuracy'] == 0
    assert result['phoneme_match'] is False
    assert result['validation_status'] == 'no_speech'


def test_long_vowel_requires_a_sustained_sound_and_short_targets_require_real_audio():
    evaluator = evaluator_without_model()
    assert evaluator._duration_matches_target('a', 0.3) is True
    assert evaluator._duration_matches_target('aa', 0.3) is False
    assert evaluator._duration_matches_target('aa', 0.45) is True
    assert evaluator._duration_matches_target('aa', 0.8) is True
    assert evaluator._duration_matches_target('amma', 0.3) is False
    assert evaluator._duration_matches_target('amma', 0.8) is True


def test_acoustic_only_fallback_never_claims_a_validated_phoneme():
    evaluator = evaluator_without_model()
    result = evaluator.evaluate_pronunciation(wav_bytes(0.8), 'aa')
    assert result['validation_status'] == 'recognizer_unavailable'
    assert result['phoneme_match'] is False
    assert result['accuracy'] <= 69


def test_browser_recognizer_can_validate_tamil_transcript_only_with_real_audio():
    evaluator = evaluator_without_model()
    result = evaluator.evaluate_pronunciation(
        wav_bytes(0.8),
        'appa',
        browser_transcript='அப்பா',
    )
    assert result['phoneme_match'] is True
    assert result['accuracy'] >= 80
    assert result['validation_status'] == 'validated'
    assert result['validation_source'] == 'browser_speech_recognition'

    silent = evaluator.evaluate_pronunciation(
        wav_bytes(0.8, amplitude=0),
        'appa',
        browser_transcript='அப்பா',
    )
    assert silent['phoneme_match'] is False
    assert silent['validation_status'] == 'no_speech'


def test_speech_route_forwards_transcript_and_canonical_target(monkeypatch):
    calls = []

    class FakeEvaluator:
        def evaluate_pronunciation(self, audio, target, browser_transcript):
            calls.append((audio, target, browser_transcript))
            return {
                'accuracy': 88,
                'phoneme_match': True,
                'validation_status': 'validated',
            }

    monkeypatch.setattr(evaluation_router, 'speech_evaluator', FakeEvaluator())
    app = FastAPI()
    app.include_router(evaluation_router.router)
    app.dependency_overrides[get_current_user] = lambda: {'_id': 'child-1'}
    client = TestClient(app)

    response = client.post(
        '/api/evaluate/speech',
        data={
            'target_phoneme': 'APPA',
            'lesson_id': '6',
            'browser_transcript': 'அப்பா',
        },
        files={'audio': ('recording.wav', b'RIFF-audio', 'audio/wav')},
    )

    assert response.status_code == 200
    assert response.json()['target_phoneme'] == 'appa'
    assert calls == [(b'RIFF-audio', 'appa', 'அப்பா')]
