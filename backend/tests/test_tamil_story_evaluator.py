import pytest

from app.services.tamil_story_evaluator import (
    STORY_TARGETS,
    TamilStoryEvaluator,
    normalize_tamil,
    score_tamil_transcript,
)


def test_story_targets_have_the_required_tamil_learning_order():
    assert [(target["id"], target["text"]) for target in STORY_TARGETS] == [
        ("a", "அ"),
        ("ii", "ஈ"),
        ("amma", "அம்மா"),
        ("kavi_vaa", "கவி வா"),
        ("kavi_bridge", "கவி பாலத்தைக் கடக்கலாம்"),
    ]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("  அம்மா!  ", "அம்மா"),
        ("கவி,   வா...", "கவி வா"),
        ("கவி\nபாலத்தைக்  கடக்கலாம்?", "கவி பாலத்தைக் கடக்கலாம்"),
    ],
)
def test_normalize_tamil_removes_punctuation_and_collapses_spaces(raw, expected):
    assert normalize_tamil(raw) == expected


def test_transcript_scoring_rewards_exact_word_phrase_and_sentence():
    for target_id in ("amma", "kavi_vaa", "kavi_bridge"):
        result = score_tamil_transcript(
            target_id,
            next(target["text"] for target in STORY_TARGETS if target["id"] == target_id),
        )
        assert result["accuracy"] == 100.0
        assert result["matched"] is True
        assert result["feedback_key"] == "wonderful"


def test_transcript_scoring_keeps_partial_sentence_bounded_and_supportive():
    result = score_tamil_transcript("kavi_bridge", "கவி கடக்கலாம்")

    assert 0.0 < result["accuracy"] < 100.0
    assert result["matched"] is False
    assert result["feedback_key"] in {"almost", "try_together"}


def test_unknown_target_is_rejected_instead_of_falling_back_to_a():
    with pytest.raises(ValueError, match="Unknown Tamil story target"):
        score_tamil_transcript("unknown", "அ")

    with pytest.raises(ValueError, match="Unknown Tamil story target"):
        TamilStoryEvaluator().evaluate(b"audio", "unknown")


def test_vowels_use_target_specific_acoustic_routing():
    calls = []

    def acoustic_analyzer(audio_bytes, target_id):
        calls.append((audio_bytes, target_id))
        return 88.0 if target_id == "a" else 91.0

    evaluator = TamilStoryEvaluator(acoustic_analyzer=acoustic_analyzer)

    a_result = evaluator.evaluate(b"a-audio", "a")
    ii_result = evaluator.evaluate(b"ii-audio", "ii")

    assert calls == [(b"a-audio", "a"), (b"ii-audio", "ii")]
    assert a_result["method"] == "acoustic_vowel"
    assert ii_result["method"] == "acoustic_vowel"
    assert a_result["matched"] is True
    assert ii_result["accuracy"] == 91.0


def test_words_use_lazy_tamil_asr_and_do_not_expose_transcript_by_default():
    loads = []

    def transcriber_factory():
        loads.append("loaded")
        return lambda _audio: "அம்மா"

    evaluator = TamilStoryEvaluator(transcriber_factory=transcriber_factory)

    first = evaluator.evaluate(b"word-audio", "amma")
    second = evaluator.evaluate(b"word-audio", "amma")

    assert loads == ["loaded"]
    assert first["accuracy"] == 100.0
    assert first["method"] == "tamil_asr"
    assert first["transcript"] == "அம்மா"
    assert second["capability"] == "available"


def test_model_unavailable_is_explicit_and_never_fabricates_a_score():
    def unavailable_factory():
        raise RuntimeError("model is offline")

    result = TamilStoryEvaluator(
        transcriber_factory=unavailable_factory,
    ).evaluate(b"word-audio", "amma")

    assert result == {
        "accuracy": None,
        "matched": None,
        "method": "tamil_asr",
        "transcript": "",
        "feedback_key": "model_unavailable",
        "capability": "model_unavailable",
    }
