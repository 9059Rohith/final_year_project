"use client";
import { useRef, useState, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "processing";

interface UseAudioMimicResult {
  state: RecordingState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  playMimic: (blob: Blob) => void;
  amplitude: number;
}

/**
 * useAudioMimic — dual-track audio hook
 * Track A: Instant mimic playback with Web Audio API pitch shift (+600 cents = Talking Tom effect)
 * Track B: Returns raw audio Blob for upload to Celery ASR scoring
 */
export function useAudioMimic(): UseAudioMimicResult {
  const [state, setState] = useState<RecordingState>("idle");
  const [amplitude, setAmplitude] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = useCallback(async () => {
    if (state === "recording") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Set up analyser for amplitude visualization
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Amplitude animation loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(avg / 128);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setState("recording");
    } catch (err) {
      console.error("[Mic] Failed to start recording:", err);
      setState("idle");
    }
  }, [state]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      setState("processing");
      cancelAnimationFrame(animFrameRef.current);
      setAmplitude(0);

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        // Stop mic stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        audioCtxRef.current?.close();
        audioCtxRef.current = null;
        setState("idle");
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  /**
   * Track A: Play mimic with pitch shift (+600 cents = ~6 semitones up = Talking Tom effect)
   * Drives mouth open based on analyser amplitude.
   */
  const playMimic = useCallback((blob: Blob) => {
    blob.arrayBuffer().then((arrayBuffer) => {
      const audioCtx = new AudioContext();
      audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Pitch shift: +600 cents = +6 semitones (Talking Tom effect)
        source.detune.value = 600;

        // Analyser for mouth animation
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        source.start(0);

        source.onended = () => {
          audioCtx.close();
        };
      });
    });
  }, []);

  return { state, startRecording, stopRecording, playMimic, amplitude };
}
