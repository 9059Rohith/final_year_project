# Production deployment

The repository is deployable as two services sharing one API:

- Render runs `backend/` from `render.yaml`.
- Vercel runs `frontend/` and rewrites `/api/*` to the Render API.
- Android release builds use the Render HTTPS URL from `BuildConfig.BASE_URL`.

## Render

1. Create a MongoDB Atlas database and allow the Render outbound network access.
2. Create a Cloudinary account for durable audio/avatar uploads.
3. In Render, create a Blueprint from this repository. The Blueprint creates
   `speakeasy-asd-api` and its `/health/live` health check.
4. Set `CORS_ORIGINS` to the exact Vercel production origin, for example
   `https://speakeasy-asd.vercel.app` (comma-separate additional preview origins
   only when needed).
5. Fill the synced MongoDB, admin, and Cloudinary secrets. Do not commit them.
6. Confirm `https://speakeasy-asd-api.onrender.com/health/ready` returns
   `{"status":"ready","database":"ok"}`.

## Vercel

1. Import the repository and set the project root to `frontend`.
2. Framework preset: Vite; build command `npm run build`; output directory `dist`.
3. Set `VITE_API_BASE_URL=/api` for Production, Preview, and Development.
4. Deploy. `frontend/vercel.json` supplies the SPA fallback, API rewrite, and
   browser security headers.

## Android release

```powershell
cd SpeakEasyAndroid
.\gradlew.bat testDebugUnitTest assembleRelease
```

Release builds reject non-HTTPS backend URLs. Use
`-PbackendUrl=https://speakeasy-asd-api.onrender.com/` when testing a different
Render service. Sign the resulting release APK/AAB in the distribution system;
signing keys are intentionally not stored in this repository.

## Smoke test

```powershell
./scripts/smoke-test.ps1 -WebUrl https://speakeasy-asd.vercel.app -ApiUrl https://speakeasy-asd-api.onrender.com
```
