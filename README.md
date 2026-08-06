# SpeakEasy ASD / MITRA

AI-assisted speech-therapy applications for children with autism spectrum disorder.

## Applications

| Component | Directory | Technology | Purpose |
|---|---|---|---|
| Web | `frontend/` | React 18, Vite, Tailwind CSS | Browser application |
| API | `backend/` | FastAPI, MongoDB | Shared backend for web and Android |
| Android | `SpeakEasyAndroid/` | Kotlin, Jetpack Compose | Native Android application |

```text
frontend/          ── HTTP/WebSocket ──> backend/
SpeakEasyAndroid/  ── HTTP ────────────> backend/
```

## Prerequisites

- Python 3.11+
- MongoDB 6+ or MongoDB Atlas
- Node.js 20+
- Java 17 and Android SDK 34 for Android development

## Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env  # only when .env does not already exist
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Set real MongoDB, JWT, admin, CORS, and Cloudinary values in `backend/.env`.
The API is available at `http://localhost:8000`; Swagger UI is at
`http://localhost:8000/docs`.

### Production API (Render)

`render.yaml` provisions the Docker service, HTTPS health probe, secure cookie
defaults, and secret placeholders. Set the Atlas URI, Cloudinary credentials,
admin credentials, and the exact Vercel origin in Render before the first deploy.
Render's filesystem is temporary; production uploads are sent to Cloudinary.

## Web frontend

Start the backend first, then:

```powershell
cd frontend
npm install
npm run dev
```

The web application runs at `http://localhost:5173`. Vite proxies `/api` and
`/ws` requests to the backend on port 8000.

### Production web (Vercel)

Import the repository with `frontend` as the project root, use `npm run build`
and `dist`, and set `VITE_API_BASE_URL=/api`. `frontend/vercel.json` provides
the SPA fallback, Render API rewrite, and security headers.

## Android

The Android emulator uses `http://10.0.2.2:8000/` to reach the backend running
on the host computer.

```powershell
cd SpeakEasyAndroid
.\gradlew.bat assembleDebug
```

For a physical device, expose the backend with `--host 0.0.0.0` and provide the
computer's LAN address:

```powershell
.\gradlew.bat assembleDebug -PbackendUrl=http://192.168.1.5:8000/
```

## Verification

```powershell
# Backend
cd backend
python -m pytest

# Frontend
cd ..\frontend
npm test
npm run build

# Android
cd ..\SpeakEasyAndroid
.\gradlew.bat assembleDebug
```

GitHub Actions runs the same backend, frontend, and Android checks on pushes and
pull requests.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the exact Render, Vercel,
Atlas, Cloudinary, Android release, and smoke-test steps.

## Repository structure

```text
.
|-- backend/             FastAPI source and tests
|-- frontend/            React/Vite source and public assets
|-- SpeakEasyAndroid/    Kotlin/Compose application
|-- .github/workflows/   Continuous integration
|-- .gitignore
`-- README.md
```

Generated dependencies, virtual environments, build outputs, logs, local
configuration, and runtime uploads are intentionally excluded from Git.
