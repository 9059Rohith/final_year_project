<div align="center">

# 🤖 Mitra
### AI Speech Companion for Tamil-Speaking Children with Autism Spectrum Disorder

*A voice mimicry and pronunciation-scoring speech therapy platform, built as a final-year engineering project.*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Whisper](https://img.shields.io/badge/ASR-OpenAI%20Whisper-412991?style=flat&logo=openai&logoColor=white)](https://github.com/openai/whisper)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Academic%20Project-lightgrey)](#license)

[Overview](#-overview) • [Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Tech Stack](#-tech-stack) • [API](#-api-reference) • [Project Structure](#-project-structure)

</div>

---

## 📖 Overview

**Mitra** ("friend" in Tamil/Sanskrit) is a speech-therapy companion for children with Autism Spectrum Disorder (ASD), built around Tamil-language pronunciation practice. A parent sits with their child, picks a word (e.g. **அம்மா** / *amma*), and the child speaks it aloud to a friendly on-screen companion.

The core design insight is that a child's engagement and a therapist's need for objective data are two *different* problems, so Mitra solves them on two independent tracks from the same audio clip:

| Track | What it does | Latency | Purpose |
|---|---|---|---|
| **A — Mimicry** | Instantly plays the child's own voice back, pitch-shifted into a fun character voice (à la *Talking Tom*), with the 3D/on-screen companion reacting in sync | ~100–150 ms, 100% client-side | Keep the child engaged and motivated to keep talking |
| **B — Analysis** | Uploads the same recording to a Tamil ASR model (Whisper), transcribes it, and computes a real 0–100 phoneme-similarity score | Seconds, async via Celery | Give parents/therapists real, objective pronunciation data |

Track A never waits on Track B, and Track B is never faked or skipped — the fun feedback and the clinical feedback are both real, and both happen every time a child records a word.

> Built by **Team 96**, School of Computing, **Amrita Vishwa Vidyapeetham**, Coimbatore — guided by **Dr. Venkataraman D**.

---

## ✨ Features

- 🎙️ **Dual-track speech pipeline** — instant playful mimicry + real Tamil ASR scoring, running in parallel
- 🗣️ **Tamil ASR & TTS** — OpenAI Whisper transcription, gTTS-generated reference audio, cached by content hash
- 📊 **Phoneme-level scoring** — Levenshtein-based similarity over Tamil phoneme approximations, not exact string matching
- 👪 **Parent-supervised sessions** — one parent login, multiple child profiles underneath it (no separate child credentials to manage)
- 🩺 **Therapist tooling** — build Tamil word modules, assign programs to specific children, log session notes
- 📈 **Real progress analytics** — mastery trends, per-word accuracy, streaks, all computed from real session data
- 🎨 **ASD-aware UI** — warm low-stimulation palette, large tap targets, calm motion, always-positive feedback language
- 🔐 **Role-based access** — Parent / Therapist / Admin, enforced via httpOnly JWT cookies
- 🐳 **One-command local stack** — Docker Compose brings up Postgres, Redis, the API, Celery worker/beat, and the web app together

---

## 🏗️ Architecture

```
┌──────────────────┐        HTTP + httpOnly cookie        ┌───────────────────────┐
│   Next.js 14      │ ─────────────────────────────────►  │   FastAPI (uvicorn)   │
│   App Router      │        /api/* rewrite proxy          │   11 routers          │
│   Tailwind CSS     │ ◄─────────────────────────────────  │   SQLAlchemy (async)  │
│   Web Audio API    │                                       │   Alembic migrations │
└──────────────────┘                                       └───────────┬───────────┘
                                                                        │
                                        ┌───────────────────────────────┼───────────────────────────────┐
                                        │                                                                │
                                ┌───────▼────────┐                                             ┌────────▼─────────┐
                                │  PostgreSQL 15 │                                             │  Redis + Celery   │
                                │  (source of    │                                             │  worker + beat    │
                                │   truth)       │                                             │  (Whisper ASR,    │
                                └────────────────┘                                             │  nightly progress │
                                                                                                 │   snapshots)      │
                                                                                                 └───────────────────┘
```

**The two-track speech flow, per practice attempt:**

```
Child taps ● Record → taps ■ Stop
   │
   ├─► Track A (client, instant)         Web Audio API pitch-shift playback
   │     Mitra mimics the child's voice back immediately, no network round-trip
   │
   └─► Track B (server, async)           POST /api/sessions/{id}/attempts
         Audio saved → Celery task → Whisper (Tamil) → transcript
         → phoneme similarity score (0–100) → session_attempts row
         → Mitra celebrates / gently corrects once the real score arrives
```

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/9059Rohith/final_year_project.git
cd final_year_project
docker compose up --build
```

This single command:
- Starts **PostgreSQL 15** and **Redis 7**
- Runs Alembic migrations automatically
- Seeds realistic demo data (users, Tamil word modules, historical sessions)
- Starts the **FastAPI** backend, a **Celery** worker (ASR scoring), and **Celery beat** (nightly progress snapshots)
- Builds and serves the **Next.js** frontend

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

**Demo credentials** (seeded automatically):

| Role | Email | Password |
|---|---|---|
| 👪 Parent | `priya.rajan@gmail.com` | `Parent@123` |
| 🩺 Therapist | `dr.kavitha@mitra.app` | `Therapist@123` |
| 🔧 Admin | `admin@mitra.app` | `Admin@2024` |

### Option B — Local development (no Docker)

<details>
<summary><strong>Backend (FastAPI)</strong></summary>

```bash
cd mitra-backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# with Postgres + Redis running locally:
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000

# in a second terminal — the ASR scoring worker
celery -A app.worker.celery_app worker --loglevel=info
```
</details>

<details>
<summary><strong>Frontend (Next.js)</strong></summary>

```bash
cd mitra-frontend
npm install
npm run dev      # http://localhost:3000
```
</details>

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Web Audio API |
| Backend | FastAPI (Python 3.11), SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 15 |
| Queue / Cache | Redis 7, Celery (worker + beat) |
| Speech-to-Text | OpenAI Whisper (Tamil) |
| Text-to-Speech | gTTS, cached by content hash |
| Scoring | Custom Levenshtein-based phoneme similarity |
| Auth | JWT (access + refresh) in httpOnly cookies, bcrypt password hashing |
| Infra | Docker & Docker Compose |
| Mobile (in progress) | Flutter (`mitra-flutter/`), native Android/Kotlin (`SpeakEasyAndroid/`) |

---

## 📁 Project Structure

```
final_year_project/
├── docker-compose.yml            # Full-stack orchestration
├── implementation_plan.md        # 6-month build plan (phases, features, day-by-day)
│
├── mitra-backend/                # FastAPI application
│   ├── alembic/versions/         # DB schema migrations
│   └── app/
│       ├── main.py               # App entrypoint + health check
│       ├── config.py             # Pydantic settings (env-driven)
│       ├── database.py           # Async SQLAlchemy engine + Redis
│       ├── models/                # users, children, content, sessions, programs...
│       ├── routers/               # auth, children, therapist, parent, content,
│       │                          #   sessions, progress, tts, admin, notifications
│       ├── services/              # Whisper ASR, TTS, phoneme scoring
│       ├── worker/                # Celery app + tasks (scoring, nightly snapshots)
│       └── db/seed.py             # Idempotent demo-data seeder
│
├── mitra-frontend/                # Next.js application
│   ├── middleware.ts              # Route guards (auth + role-based)
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── (auth)/                # Login, register
│   │   ├── (parent)/children/     # Child-profile picker, child detail
│   │   ├── (practice)/session/    # The core practice screen
│   │   ├── therapist/             # Dashboard, content builder
│   │   └── admin/                 # Admin panel
│   ├── hooks/useAudioMimic.ts     # Track-A pitch-shift mimicry hook
│   └── lib/api.ts                 # Typed API client
│
├── mitra-flutter/                 # Mobile client (in progress)
├── SpeakEasyAndroid/               # Native Android/Kotlin client (in progress)
└── backend/, frontend/             # Earlier prototype (SpeakEasy ASD)
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a parent or therapist account |
| `POST` | `/api/auth/login` | Log in (sets httpOnly access + refresh cookies) |
| `GET` | `/api/auth/me` | Current authenticated user |
| `GET`/`POST` | `/api/auth/children` | List / create child profiles |
| `GET` | `/api/content/modules` | List Tamil word modules |
| `POST` | `/api/therapist/assign-program` | Assign a module to a child |
| `POST` | `/api/sessions` | Start a practice session |
| `POST` | `/api/sessions/{id}/attempts` | Submit a recorded attempt for scoring |
| `GET` | `/api/sessions/{id}/attempts/{attempt_id}/status` | Poll the async ASR/score result |
| `GET` | `/api/progress/child/{id}/summary` | A child's progress summary |
| `GET` | `/api/tts/speak?text=அம்மா` | Tamil text-to-speech audio |
| `GET` | `/api/health` | Health check (DB + Redis connectivity) |

Full interactive documentation is available at **`/api/docs`** (Swagger UI) once the backend is running.

---

## 🗣️ Seeded Demo Content

| Module | Sample Words |
|---|---|
| குடும்பம் (Family) | அம்மா, அப்பா, தாத்தா, பாட்டி |
| விலங்குகள் (Animals) | நாய், பூனை, யானை, குதிரை |
| தினசரி செயல்கள் (Daily Actions) | சாப்பிடு, தூங்கு, விளையாடு |

---

## 🗺️ Roadmap

- [x] Parent-supervised auth + child profiles
- [x] Tamil ASR scoring pipeline + Talking-Tom-style mimicry engine
- [x] Therapist content builder + program assignment
- [x] Progress analytics dashboard
- [ ] Real-time messaging between parent and therapist
- [ ] PDF progress export
- [ ] Native mobile app (Flutter / Android) feature parity with web
- [ ] Production deployment

See **[`implementation_plan.md`](./implementation_plan.md)** for the complete phase-by-phase build plan.

---

## 🎓 Academic Context

This project was developed as a final-year engineering project at **Amrita Vishwa Vidyapeetham**, Coimbatore, by **Team 96**, under the guidance of **Dr. Venkataraman D**, School of Computing.

## 📄 License

This repository is provided for academic and educational purposes as part of a university final-year project.

## 🙏 Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) — speech recognition
- [Google Text-to-Speech (gTTS)](https://github.com/pndurette/gTTS) — Tamil audio synthesis
- [FastAPI](https://fastapi.tiangolo.com/) & [Next.js](https://nextjs.org/) — application frameworks

---

<div align="center">

Made with ❤️ for children who deserve patient, encouraging practice — one word at a time.

</div>
