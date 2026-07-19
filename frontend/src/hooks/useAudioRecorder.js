import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const startTimeRef = useRef(null)
  const recognitionRef = useRef(null)
  const [transcript, setTranscript] = useState('')

  // Web Audio nodes for real-time visualization. Exposed via analyserRef so
  // consumers can run their own requestAnimationFrame loop without re-rendering.
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)

  const teardownAudioGraph = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

  const startRecording = useCallback(async (language = 'en-IN') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      startTimeRef.current = Date.now()

      // ── Real-time analyser for the live waveform / volume meter ──
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioCtx()
        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.7
        source.connect(analyser)
        audioContextRef.current = audioContext
        analyserRef.current = analyser
      } catch (e) {
        console.warn('AnalyserNode unavailable, waveform will idle:', e)
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setDuration(Date.now() - startTimeRef.current)

        // Stop all tracks and release the audio graph
        stream.getTracks().forEach(track => track.stop())
        teardownAudioGraph()
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Initialize Speech Recognition if available
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = true  // live partial transcript
        recognition.lang = language

        recognition.onresult = (event) => {
          // Concatenate all results so the bubble updates live as the child speaks
          let text = ''
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript
          }
          setTranscript(text.trim())
        }

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error)
        }

        recognitionRef.current = recognition
        recognition.start()
      }

      return true
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Could not access microphone')
      return false
    }
  }, [teardownAudioGraph])
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isRecording])
  
  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setTranscript('')
    chunksRef.current = []
    teardownAudioGraph()
  }, [teardownAudioGraph])

  return {
    isRecording,
    audioBlob,
    duration,
    transcript,
    analyserRef,
    startRecording,
    stopRecording,
    resetRecording
  }
}
