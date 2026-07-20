# 🤖 Mitra — Tamil AI Speech Companion

AI-powered speech therapy companion for Tamil-speaking children with ASD.

## Quick Start (Docker)

```bash
# 1. Clone and enter project
cd final_year_project

# 2. Start everything
docker compose up --build

# 3. Access
#   Frontend:  http://localhost:3000
#   Backend:   http://localhost:8000
#   API Docs:  http://localhost:8000/docs
```

That's it. Docker will:
- Start PostgreSQL 15 + Redis 7
- Run Alembic migrations automatically
- Seed all demo data (users, Tamil modules, sessions)
- Start FastAPI backend on port 8000
- Start Celery worker (Whisper ASR scoring)
- Start Celery beat (nightly progress snapshots)
- Build and start Next.js frontend on port 3000

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👪 Parent | priya.rajan@gmail.com | Parent@123 |
| 👨‍⚕️ Therapist | dr.kavitha@mitra.app | Therapist@123 |
| 🔧 Admin | admin@mitra.app | Admin@2024 |

---

## User Flow

```
Parent logs in
  → Picks child profile (Netflix-style)
  → Views progress + assigned programs
  → Taps "▶ Start" on a program
  → Practice session begins:
      1. See Tamil word (e.g., அம்மா / amma)
      2. Tap 🔊 to hear it (gTTS)
      3. Tap 🎙 to record speech
      4. Tap ⏹ to stop
         ├── Track A: INSTANT mimic playback (+600 cents pitch shift)
         └── Track B: Upload → Whisper ASR → phoneme score (async)
      5. Score arrives → celebrate (≥80%) or gentle correct (<50%)
      6. Next word or Finish
```

---

## Architecture

```
┌─────────────────┐     HTTP/Cookie     ┌──────────────────────┐
│  Next.js 14     │ ──────────────────► │  FastAPI + uvicorn   │
│  (Port 3000)    │                     │  (Port 8000)         │
│                 │     API rewrites     │                      │
│  App Router     │ ◄────────────────── │  11 routers          │
│  Tailwind CSS   │                     │  SQLAlchemy async    │
│  Web Audio API  │                     │  Alembic migrations  │
└─────────────────┘                     └──────────┬───────────┘
                                                   │
                    ┌──────────────────────────────┤
                    │                              │
              ┌─────▼─────┐              ┌────────▼────────┐
              │ PostgreSQL│              │  Redis + Celery  │
              │  (Port    │              │  Worker + Beat   │
              │   5432)   │              │  (Whisper ASR)   │
              └───────────┘              └──────────────────┘
```

---

## Key Features

- **Tamil ASR**: Whisper `medium` model transcribes child speech
- **Phoneme Scoring**: Levenshtein-based similarity (0–100)
- **Talking Tom Mimicry**: Web Audio API, `detune: +600 cents`, instant
- **Dual-Track**: Track A (mimic) fires immediately; Track B (scoring) runs in background via Celery
- **Progress Analytics**: Per-child mastery trends, streaks, timeseries charts
- **Role-Based**: Admin / Therapist / Parent — httpOnly JWT cookies
- **ASD-Friendly UI**: Large tap targets, warm orange palette, no overload

---

## Development (local, no Docker)

### Backend
```bash
cd mitra-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start PostgreSQL + Redis locally, then:
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload --port 8000

# In a second terminal (Celery):
celery -A app.worker.celery_app worker --loglevel=info
```

### Frontend
```bash
cd mitra-frontend
npm install
npm run dev  # http://localhost:3000
```

---

## Environment Variables

### Backend (`mitra-backend/.env`)
```
DATABASE_URL=postgresql+asyncpg://mitra:mitra@localhost:5432/mitra
SYNC_DATABASE_URL=postgresql://mitra:mitra@localhost:5432/mitra
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
WHISPER_MODEL=medium
```

### Frontend (`mitra-frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## File Structure

```
final_year_project/
├── docker-compose.yml          # Full stack orchestration
├── mitra-backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/               # DB migrations
│   └── app/
│       ├── main.py            # FastAPI app + health endpoint
│       ├── config.py          # Pydantic settings
│       ├── database.py        # Async SQLAlchemy + Redis
│       ├── models/            # 14 SQLAlchemy models
│       ├── routers/           # 11 API routers
│       ├── services/          # Whisper ASR, gTTS, scoring
│       ├── worker/            # Celery app + tasks
│       ├── utils/             # JWT handler
│       └── db/seed.py         # Demo data seeder
└── mitra-frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── middleware.ts           # Auth route guards
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx           # Landing page
    │   ├── (auth)/            # Login, Register
    │   ├── (parent)/          # Children picker, child detail
    │   ├── (practice)/        # Session page (CORE SCREEN)
    │   ├── (therapist)/       # Dashboard, content builder
    │   └── (admin)/           # Admin panel
    ├── hooks/
    │   └── useAudioMimic.ts   # Web Audio API dual-track hook
    └── lib/
        └── api.ts             # Axios client + all API calls
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (sets httpOnly cookie) |
| POST | `/api/auth/register` | Register parent/therapist |
| GET | `/api/auth/me` | Current user |
| GET/POST | `/api/auth/children` | Child profiles |
| GET | `/api/content/modules` | List Tamil modules |
| POST | `/api/sessions` | Start practice session |
| POST | `/api/sessions/{id}/attempts` | Submit audio recording |
| GET | `/api/sessions/{id}/attempts/{aid}/status` | Poll ASR score |
| GET | `/api/progress/child/{id}/summary` | Progress summary |
| GET | `/api/tts/speak?text=அம்மா` | Tamil TTS audio |
| GET | `/api/health` | Health check (DB + Redis) |

Full docs at `http://localhost:8000/docs` (Swagger UI).

---

## Tamil Demo Modules (seeded)

| Module | Sample Words |
|--------|-------------|
| Family Words | அம்மா, அப்பா, தாத்தா, பாட்டி |
| Animals | நாய், பூனை, யானை, குதிரை |
| Daily Actions | சாப்பிடு, தூங்கு, விளையாடு |
