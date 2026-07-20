"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { sessionsApi, ttsApi } from "@/lib/api";
import { useAudioMimic } from "@/hooks/useAudioMimic";

interface ModuleItem {
  id: string;
  tamil_word: string;
  transliteration: string;
  english_translation: string;
  image_url?: string;
  phoneme_breakdown?: Record<string, unknown>;
}

interface SessionData {
  id: string;
  items: ModuleItem[];
  child_name: string;
  module_name: string;
}

interface AttemptResult {
  attempt_id: string;
  score?: number;
  transcript?: string;
  mitra_response?: string;
}

type SessionPhase = "ready" | "listening" | "mimic" | "scored" | "complete";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState<SessionPhase>("ready");
  const [lastAttempt, setLastAttempt] = useState<AttemptResult | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { state: micState, startRecording, stopRecording, playMimic, amplitude } = useAudioMimic();

  // Create session on mount
  useEffect(() => {
    const childId = sessionStorage.getItem("active_child_id");
    if (!childId) {
      router.push("/children");
      return;
    }
    initSession(childId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [programId]);

  const initSession = async (childId: string) => {
    try {
      const res = await sessionsApi.create(childId, programId);
      setSession(res.data);
      setLoading(false);
    } catch {
      setError("Failed to start session");
      setLoading(false);
    }
  };

  const currentItem = session?.items[currentIdx];

  // Play TTS for current word
  const playWord = useCallback(() => {
    if (!currentItem) return;
    const audio = new Audio(ttsApi.speak(currentItem.tamil_word));
    audio.play().catch(() => toast.error("TTS playback failed"));
  }, [currentItem]);

  // Handle mic stop — dual track
  const handleStopRecording = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob || !session || !currentItem) return;

    setPhase("mimic");

    // Track A: Instant mimic (fire and forget, does NOT block Track B)
    playMimic(blob);

    // Track B: Upload for Whisper scoring (parallel)
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("module_item_id", currentItem.id);
      formData.append("mimic_played", "true");

      const res = await sessionsApi.submitAttempt(session.id, formData);
      const attemptId = res.data.attempt_id;
      setLastAttempt({ attempt_id: attemptId });

      // Poll for score (Celery task)
      startPolling(session.id, attemptId);
    } catch {
      toast.error("Upload failed");
      setPhase("ready");
    }
  }, [session, currentItem, stopRecording, playMimic]);

  const startPolling = (sessionId: string, attemptId: string) => {
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const res = await sessionsApi.getAttemptStatus(sessionId, attemptId);
        const { scoring_status, similarity_score, asr_transcript, mitra_response_type } = res.data;
        if (scoring_status === "done") {
          clearInterval(pollRef.current!);
          setLastAttempt({ attempt_id: attemptId, score: similarity_score, transcript: asr_transcript, mitra_response: mitra_response_type });
          setScores((s) => [...s, similarity_score ?? 0]);
          setPhase("scored");
        } else if (scoring_status === "failed" || tries > 30) {
          clearInterval(pollRef.current!);
          setPhase("scored");
          setLastAttempt({ attempt_id: attemptId, score: 0, mitra_response: "gentle_correct" });
          setScores((s) => [...s, 0]);
        }
      } catch {
        if (tries > 30) clearInterval(pollRef.current!);
      }
    }, 2000);
  };

  const handleNext = async () => {
    if (!session) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= session.items.length) {
      // Complete session
      await sessionsApi.complete(session.id);
      setPhase("complete");
    } else {
      setCurrentIdx(nextIdx);
      setLastAttempt(null);
      setPhase("ready");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <div className="text-warm-500 text-xl animate-pulse">Starting session... 🤖</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-calm-bg flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-stone-600 text-lg">{error}</p>
        <button onClick={() => router.back()} className="bg-warm-500 text-white px-6 py-3 rounded-2xl">
          Go Back
        </button>
      </div>
    );
  }

  // ── COMPLETE SCREEN ──────────────────────────────────────────────────────
  if (phase === "complete") {
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return (
      <div className="min-h-screen bg-calm-bg flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-7xl animate-celebrate">🎉</div>
        <h1 className="text-3xl font-bold text-warm-700">Great Job!</h1>
        <p className="text-stone-500 text-lg">Session complete!</p>
        <div className="score-ring bg-warm-100 text-warm-700 w-28 h-28 text-3xl">{avg}%</div>
        <p className="text-stone-500">{scores.length} words practiced</p>
        <button
          onClick={() => router.push("/children")}
          className="bg-warm-500 hover:bg-warm-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-warm"
        >
          All Done 🏠
        </button>
      </div>
    );
  }

  if (!currentItem || !session) return null;

  const totalItems = session.items.length;
  const progress = ((currentIdx) / totalItems) * 100;

  return (
    <main className="min-h-screen bg-calm-bg flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 max-w-2xl mx-auto w-full">
        <button onClick={() => router.back()} className="text-stone-400 hover:text-warm-600 text-2xl">
          ←
        </button>
        <div className="flex-1 mx-4">
          <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-warm-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-stone-400 mt-1 text-center">
            {currentIdx + 1} of {totalItems}
          </p>
        </div>
        <div className="text-sm font-medium text-warm-600">{session.module_name}</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 max-w-2xl mx-auto w-full">
        {/* Companion */}
        <div
          className="w-32 h-32 rounded-full bg-warm-100 flex items-center justify-center text-6xl shadow-warm transition-transform"
          style={{ transform: amplitude > 0.3 ? `scale(${1 + amplitude * 0.2})` : "scale(1)" }}
        >
          {phase === "scored" && lastAttempt?.score != null && lastAttempt.score >= 80 ? "😄" :
           phase === "scored" ? "🤔" :
           micState === "recording" ? "👂" :
           "🤖"}
        </div>

        {/* Tamil Word */}
        <div className="text-center">
          <div className="tamil-word-lg mb-2">{currentItem.tamil_word}</div>
          <p className="text-stone-500 text-xl">{currentItem.transliteration}</p>
          <p className="text-stone-400 text-base mt-1">{currentItem.english_translation}</p>
        </div>

        {/* Hear Button */}
        <button
          onClick={playWord}
          className="flex items-center gap-2 bg-white border-2 border-warm-300 hover:border-warm-500 text-warm-600 px-6 py-3 rounded-2xl font-semibold text-base transition-all"
        >
          🔊 Hear it
        </button>

        {/* Mic / Score Zone */}
        {phase === "ready" || phase === "listening" ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-stone-500 text-lg">
              {micState === "recording" ? "Listening... stop when done" : "Tap to speak"}
            </p>
            <button
              onClick={micState === "recording" ? handleStopRecording : startRecording}
              className={`mic-btn ${micState === "recording" ? "mic-btn-recording" : "mic-btn-idle"}`}
            >
              {micState === "recording" ? "⏹" : "🎙"}
            </button>
            {micState === "recording" && (
              <div className="flex gap-1 items-end h-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-warm-400 rounded-full transition-all duration-100"
                    style={{ height: `${8 + amplitude * 80 * (0.5 + Math.sin(i + Date.now() / 200) * 0.5)}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : phase === "mimic" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="text-warm-500 text-lg animate-pulse">Playing back... 🔊</div>
            <div className="text-stone-400 text-sm">Scoring in background...</div>
          </div>
        ) : phase === "scored" && lastAttempt ? (
          <div className="flex flex-col items-center gap-4">
            {lastAttempt.score != null ? (
              <>
                <div
                  className={`score-ring ${
                    lastAttempt.score >= 80
                      ? "bg-green-100 text-green-700"
                      : lastAttempt.score >= 50
                      ? "bg-warm-100 text-warm-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {Math.round(lastAttempt.score)}
                </div>
                <p className="text-stone-500 text-base">
                  {lastAttempt.score >= 80 ? "🌟 Excellent!" : lastAttempt.score >= 50 ? "👍 Good try!" : "💪 Try again!"}
                </p>
                {lastAttempt.transcript && (
                  <p className="text-stone-400 text-sm font-tamil">
                    Heard: &ldquo;{lastAttempt.transcript}&rdquo;
                  </p>
                )}
              </>
            ) : (
              <div className="text-warm-500 animate-pulse text-lg">Scoring... ⏳</div>
            )}
            <button
              onClick={handleNext}
              disabled={lastAttempt.score == null}
              className="bg-warm-500 hover:bg-warm-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-warm"
            >
              {currentIdx + 1 >= totalItems ? "Finish 🎉" : "Next Word →"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
