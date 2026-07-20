# Decisions

---

## ⚠️ SUPERSEDED DECISION — REVERSAL LOCKED (Recorded after full audit)

> **The "greenfield Mitra" approach (`mitra-frontend` / `mitra-backend` / `mitra-flutter`) is ABANDONED.**
> These folders are skeleton stubs — ~10 pages, no assets, no real ML services, no working therapy flow.
> **All future work happens exclusively in `/frontend` (React/Vite) and `/backend` (FastAPI/MongoDB).**
> The `mitra-*` and `mitra-flutter` folders are kept for reference only and must NOT be modified.

### Why `/frontend` + `/backend` wins — full audit results

| Dimension | `/frontend` + `/backend` ✅ | `mitra-*` (abandoned) ❌ |
|---|---|---|
| Frontend pages | **30+ pages** (therapy, games, progress, achievements, etc.) | ~10 skeleton pages |
| Frontend stack | React 18 + Vite + Zustand + Three.js | Next.js 14 TypeScript |
| Real assets | Images (27), pronunciation videos | None |
| 3D scene | Three.js CandleScene + GLTF robot | None |
| Therapy flow | Complete 5-slide flow (Picture→Animation→Eval→Candle→Reward) | None |
| Backend routers | **50+ routers** (gamification, billing, social, streaks, messaging…) | ~10 routers |
| AI/ML services | torch, transformers, mediapipe, librosa, opensmile, DTW aligner, face analyzer, acoustic processor | Tamil TTS/ASR stubs only |
| Database | MongoDB (motor) — already working | PostgreSQL skeleton, never seeded |
| Hooks | Audio recorder, face detection, WebSocket | useAudioMimic stub only |
| Tests | vitest + playwright configured | None |

---

## Decision 0 — Foundational Decisions (REVISED & FINAL)

### 0.1 Evolve the Existing Project
**Decision: EVOLVE `/frontend` + `/backend`** — Build on the existing working SpeakEasy/MITRA codebase.
**Why:** The existing project has 30+ pages, real AI/ML integration (torch, mediapipe, librosa), a complete 5-slide therapy flow, 50+ API routers, real assets, and working audio/face detection. Starting over would discard months of real work. The greenfield approach created empty skeletons that can never catch up in time.

### 0.2 Database
**Decision: MongoDB** via `motor` (async) — already in `/backend`.
**Why:** Already working, already seeded, all 50+ routers use it. No migration needed.

### 0.3 Web Framework
**Decision: React 18 + Vite + Tailwind CSS** — already in `/frontend`.
**Why:** Already has 30+ pages, Three.js, Zustand, hooks, assets. This is the working product.

### 0.4 Tamil ASR Model
**Decision: OpenAI Whisper `medium` (multilingual) as primary; AI4Bharat IndicWhisper as upgrade path**
**Spike results:** Whisper medium has documented strong Tamil support, runs on CPU (slower but works), and is trivially available via `openai-whisper` pip package. IndicConformer requires more setup. For MVP, Whisper medium on Celery worker with a 10-30s latency budget is acceptable since mimicry (Track A) runs client-side and is never blocked.
**Self-hosted** on the backend server (no per-call API costs).

### 0.5 Tamil TTS Model
**Decision: gTTS (Google TTS) with Tamil locale (`ta`) as MVP; upgrade to AI4Bharat Indic-TTS post-MVP**
**Why:** gTTS is available instantly, produces intelligible Tamil speech, zero cost, cached by text-hash in local storage. The upgrade to Indic-TTS produces more natural speech but requires more setup.
**Cache strategy:** SHA-256 hash of text → store in `/uploads/tts_cache/` → serve as static file.

### 0.6 Mobile Strategy
**Decision:** Web-only for MVP. Native Android (`SpeakEasyAndroid/` Kotlin/Compose) is 🟡 stretch. Flutter dropped entirely.

### 0.7 Hosting
**Decision:**
- Backend: **Render** (free tier web service)
- MongoDB: **MongoDB Atlas** (free tier, 512MB)
- Frontend: **Vercel** (free tier)
- Object storage: **Local `/uploads` for MVP; Cloudflare R2 for production**
- Fallback: **Railway** if Render limits are hit

### 0.8 3D Asset
**Decision:** Use the existing `genkub_greeting_robot.gltf` already in the project root. Supplement with Three.js `CandleScene` already in `/frontend/src/components/three/CandleScene.jsx`.

### 0.9 Data Privacy Stance
**Decision:**
- Raw audio deleted after scoring completes (within 24 hours)
- Scores, transcripts, and phoneme_accuracy retained indefinitely per therapist request
- Parent consent captured at child profile creation (checkbox + timestamp stored in DB)
- Written privacy policy included in Phase 9
- No ad tracking, no third-party analytics on children's data
- India DPDP Act 2023 + COPPA-style principles applied

### 0.10 Auth Model
**Decision: CONFIRMED — Role-based accounts (parent / therapist / admin)**
- One login per adult (parent or therapist or admin)
- Parent account holds 1+ child profiles
- Child never logs in independently
- Every session tracks which child profile was active
- JWT-based auth already implemented in `/backend/app/routers/auth.py`

### 0.11 Mobile Stack
**Decision: CONFIRMED — Native Android (Kotlin/Compose in `SpeakEasyAndroid/`) for 🟡 stretch; Flutter dropped**
- `SpeakEasyAndroid/` already has real screens, reuse it
- iOS = out of scope for this cycle

### 0.12 Mimicry Technique
**Decision: `playbackRate`/`detune` (MVP) — Web Audio API AudioBufferSourceNode with detune shifted**
- Shift: detune +600 cents (half-octave up) for the "Talking Tom" chipmunk effect
- Lip-sync: AnalyserNode amplitude → mouth morph target scale
- Upgrade path (post-MVP): soundtouchjs formant-preserving pitch shift
- Fallback: plain unmodified playback if Web Audio API unavailable
- Hook already exists at `/frontend/src/hooks/useAudioRecorder.js`
