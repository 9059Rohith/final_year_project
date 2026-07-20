# Mitra — Implementation Plan (6-Month, Step-by-Step)

**Project:** Mitra — AI Speech Companion for Children with Autism (Tamil speech therapy)
**Owner:** Rohith
**Duration:** ~26 weeks (6 months)
**Working style:** Solo, prompt-by-prompt with a coding agent (Claude Code)
**This file is the single source of truth.** Re-read it at the start of every session. Update the checkboxes as you go.

> ⚠️ Read **Part A (Situation Analysis)** and **Decision 0** before touching any code. They change everything downstream.

---

## HOW TO USE THIS DOCUMENT

1. This plan supersedes the raw 18-prompt list in `PROJECT_PLAN.md`. It keeps the same spirit but **resequences, scopes, and de-risks** it for one person in six months.
2. Work **top to bottom**. Each phase depends on the one before it.
3. Every step has: **Goal · Prerequisites · Build steps · Deliverables · Acceptance criteria · Est. time · Risk**. Do not mark a step "done" until its acceptance criteria pass.
4. The **MVP line** (Part B) is sacred. If you fall behind, cut from *below* the line, never from *above* it.
5. Keep a running `DECISIONS.md` and `PROGRESS.md` alongside this file (templates in the Appendix).
6. When you paste a step into the coding agent, always start with: *"Read `implementation_plan.md` and `DECISIONS.md` first. Do not use mock data. Do not break existing passing tests."*

---

# PART A — SITUATION ANALYSIS

You are **not** starting from zero. There is an existing codebase (**SpeakEasy ASD**) and an ambitious new plan (**Mitra**). Understanding the gap between them is the most important thing in this document.

### A.1 What already exists (SpeakEasy ASD)

| Layer | What's there | Reusable? |
|---|---|---|
| Backend | FastAPI, **MongoDB** (Motor), JWT auth, routers for auth/therapy/evaluation/progress/admin | Concept reusable; DB layer will change (see Decision 0) |
| Speech eval | `speech_evaluator.py` — Wav2Vec2 + MFCC + phoneme fuzzy matching, kid-friendly feedback tiers | **Logic reusable**, but model must change (see A.3) |
| Face/breath | MediaPipe face landmarks, 3D candle breath test (React Three Fiber) | Reusable as a feature/stretch |
| Frontend | **React 18 + Vite**, Tailwind, Zustand, 5-slide therapy flow, 3D candle scene | UX/flow reusable; framework will change if you adopt Next.js |
| Dead code | `dtw_aligner.py`, `accoustic_processor.py`, `edge_storage.py` — merged but **never wired in**, `fastdtw` missing from requirements | Salvage the DTW logic; ignore the rest for now |

### A.2 What the Mitra plan wants (the target)

Next.js 14 web + Flutter (Android/iOS) + FastAPI + **PostgreSQL** + Redis/Celery + AI4Bharat **Tamil** ASR/TTS + 3D companion "Mitra" + real dashboards + messaging + admin + deployment + app-store readiness. Four user roles. Zero mock data.

### A.3 🔴 Critical findings (address these deliberately)

1. **Wrong language model.** The existing evaluator uses `facebook/wav2vec2-base-960h`, an **English** model. Mitra is a **Tamil** app. Using an English model on Tamil audio produces meaningless scores. **You must switch to a Tamil ASR model** (AI4Bharat IndicWhisper / IndicConformer, or Whisper fine-tuned for Tamil). This is non-negotiable and is the single biggest technical risk in the project.
2. **Stack mismatch.** Existing = MongoDB + React+Vite. Plan = PostgreSQL + Next.js. You cannot have both silently. Decide once (Decision 0.1).
3. **Scope vs. time.** The 18 prompts describe roughly 2–4 engineer-quarters of work. Solo in 6 months, you **will not finish all of it** at professional quality. The MVP cut in Part B is what makes this project succeed instead of stall.
4. **Children's voice data = legal weight.** You are recording audio of minors with disabilities. Data retention, consent, and privacy (COPPA-style thinking, India DPDP Act 2023) must be designed in from day one, not bolted on at the end.
5. **🔴 The real auth model is parent-only, not 4-role-with-child-PIN.** The current `backend/app/routers/auth.py` register flow creates a single `role: "user"` account holding `child_name`/`child_age`/`language` directly on the parent's user document — there is **no separate child entity, no PIN, no avatar login** in the running code. This actually matches how you described the real usage: **"initial setup will be set by parents only, autism kids will be attending by parents."** The 4-role (admin/therapist/parent/child-PIN) model from the original Mitra plan is **replaced** in this document by a simpler **parent-supervised model** — see Decision 0.10.
6. **A native Android app already exists — separately from the Flutter plan.** `SpeakEasyAndroid/` is a real, fairly complete Kotlin/Jetpack-Compose app (Login/Register/Onboarding/Home/Lessons/Practice/Progress/Rewards/Candle-game screens, a `VoiceRecorder`, `ApiService`, `AuthViewModel`). This is sunk work in a **different mobile stack** than the plan's Flutter recommendation — see Decision 0.11.
7. **🟠 New core requirement — "Talking Tom" style mimicry, plus a parallel model-scored analysis.** You want Mitra to instantly play back the child's own recorded voice, pitch/voice-shifted into a fun character voice (exactly like the Talking Tom app), as the primary moment-to-moment engagement loop — **decoupled from and running alongside** the Tamil ASR + phoneme scoring pipeline that produces the real 0–100 score for the dashboards. These are two different jobs on the same audio clip: an instant, client-side playful echo (no model, no latency) and a slower, real, model-based analysis (Celery, seconds of latency, feeds real data). See **Decision 0.12** and the full architecture in **PART L**.

---

# PART B — SCOPE: MVP vs STRETCH (the cut line)

This is the most important page. **Build strictly top-down.**

### 🟢 MVP — MUST work for your final demo (the "above the line" project)
This alone is a complete, defensible, impressive final-year project.

1. Monorepo + Docker + Postgres + FastAPI + Next.js boot with a **real** health check.
2. Full Postgres schema + seeded realistic Tamil therapy data.
3. Auth: **parent account only** (email+password), with one or more **child profiles** under it (no separate child login, no PIN — see Decision 0.10). Therapist/admin keep their own real logins.
4. Therapist can create a Tamil word module + assign it to a child profile (real CRUD).
5. **Tamil ASR pipeline (model-based analysis, runs in the background)**: every recorded attempt → real Tamil transcript → real 0–100 pronunciation score stored in DB. This is the clinical signal that feeds the dashboards — it never blocks what the child sees/hears next.
6. **🟠 Talking-Tom-style Mitra mimicry (the core child-facing loop)**: the instant a child stops recording, Mitra plays back the child's own voice pitch-shifted into a fun character voice, with the 3D mouth animating along — client-side, near-zero latency, no dependency on step 5. See Decision 0.12 + PART L.
7. **3D Mitra companion** (web) with idle/listening/mimic-playback/thinking/celebrating/gently-correcting states — mimicry (6) plays first and always; celebrating/correcting is layered in once the real score from (5) arrives.
8. **Tamil TTS**: Mitra can also speak a fixed target word/encouraging phrase (separate from the mimicry — mimicry echoes the *child's own voice*, TTS is Mitra's *own* fixed voice for target words and encouragement).
9. **End-to-end child practice session** wiring 5–8 together (mimic-first, score-driven reaction second), persisted to DB.
10. **Real progress dashboard** for parent/therapist (charts from the real model-analysis scores in step 5, never from the mimicry).
11. Deployed to a live URL (web) with the seeded demo working.

### 🟡 STRETCH — build only if MVP is done and stable (cut first if behind)
- Flutter mobile app (auth + dashboards + practice flow)
- iOS/Android store readiness, TestFlight
- Messaging (parent↔therapist) + notifications + email
- PDF progress export
- Admin panel (full)
- Breath-test candle mini-game (port from SpeakEasy)
- Offline attempt queueing (salvage `edge_storage.py` idea)
- DTW syllable-level scoring (salvage `dtw_aligner.py`) as an *accuracy upgrade* to step 5

> **Rule:** Do not start any 🟡 item until every 🟢 item passes its acceptance criteria and is deployed.

---

# DECISION 0 — FOUNDATIONAL DECISIONS (make these in Week 1)

Record your final answers in `DECISIONS.md`. My recommendation is given for each; change it consciously if you disagree.

### 0.1 Greenfield (Mitra fresh) vs. Evolve (SpeakEasy in place)
- **Recommendation: Greenfield the architecture per the Mitra plan (Next.js + FastAPI + PostgreSQL), but *port the proven logic* from SpeakEasy** — don't rewrite the evaluation logic, therapy-flow UX, or 3D scene from scratch. Copy those files into the new repo and adapt.
- **Why:** The plan's architecture (Postgres + SQLAlchemy + Alembic migrations, TanStack Query, clean role separation) is more defensible in a final-year viva than MongoDB + ad-hoc collections, and CI/migrations force discipline. But rewriting the working Wav2Vec2/MFCC scoring and the 3D companion from zero would waste weeks.
- **Trade-off:** If your time is *very* tight or you're more comfortable in the existing stack, evolving SpeakEasy in place (keep MongoDB + React+Vite, just fix the Tamil model + wire the dead modules) is a legitimate faster path. Pick one and commit — do not straddle.

### 0.2 Database: PostgreSQL vs MongoDB
- **Recommendation: PostgreSQL** (matches the plan; relational integrity for users/sessions/progress is genuinely better here and looks stronger academically). If you choose "evolve SpeakEasy," stay on MongoDB to save time.

### 0.3 Web framework: Next.js 14 vs React+Vite
- **Recommendation: Next.js 14** if greenfield. If evolving, keep React+Vite. Either is fine for a demo; don't migrate an existing React+Vite app to Next.js mid-project — that's wasted weeks.

### 0.4 Tamil ASR model (🔴 decide before Phase 3)
- **Options:** AI4Bharat **IndicConformer** (Tamil) or **IndicWhisper**; or OpenAI **Whisper** (`large-v3`/`medium`) which has usable Tamil; or a hosted inference API.
- **Recommendation: prototype 2 options in Week 8 on 10 real Tamil word samples and pick by accuracy + latency.** Default to Whisper `medium` if self-hosting on CPU is too slow, or an AI4Bharat model if you have a GPU. Document the choice and *why*.
- **Decide: self-hosted (GPU/CPU) vs hosted API.** Self-hosted = free but needs compute; hosted = easy but costs per call and needs internet. For a student demo, self-hosted on your dev machine (or a cheap GPU box for the demo) is usually right.

### 0.5 Tamil TTS model
- **Recommendation:** AI4Bharat **Indic-TTS** or **Coqui TTS** Tamil checkpoint. Cache generated audio by text-hash so you never regenerate the same phrase.

### 0.6 Mobile: build Flutter, continue native Android, or web-only?
- **⚠️ Superseded by Decision 0.11 below** (a real Kotlin Android app already exists in `SpeakEasyAndroid/`). Read 0.11 before acting on this section.
- **Recommendation: Web-only for MVP** regardless of which mobile path you pick later. Treat mobile as 🟡 stretch. A polished web app that fully works beats a half-broken web+mobile pair. Only pick up mobile again (Phase 7) if you hit Week 19 with the MVP deployed and stable.

### 0.7 Hosting
- **Recommendation:** Backend + worker on **Render** or **Railway** (free/cheap tiers, managed Postgres + Redis), frontend on **Vercel**, object storage on **Cloudflare R2** (cheaper than S3, S3-compatible). Confirm budget before Phase 10.

### 0.8 3D Mitra asset
- **Recommendation:** Use a **commercially-licensed rigged GLB** (e.g. from Sketchfab CC/purchased, or generate with a tool) — an original friendly creature, **not** any copyrighted character. Confirm the license permits your use. Modeling from scratch is out of scope.

### 0.9 Data privacy stance (children's audio)
- **Recommendation:** Decide retention now: e.g. "raw audio deleted after scoring, or after 30 days; only scores/transcripts retained." Write an honest privacy policy in Phase 9. Get explicit parent consent at child-profile creation. Do not treat this as an afterthought — it's an ethics/marks issue for an ASD project.
- **This matters even more under the mimicry feature (0.12):** a pitch-shifted mimic clip is still the child's real voice. Apply the exact same retention/consent rules to mimic playback audio as to the raw recording — do not treat it as "throwaway" just because it's played back instantly.

### 🔴 0.10 Auth model: parent-only account with child profiles (supersedes the 4-role PIN model)
- **Decision: adopt the simpler, real-world-matching model you described.** There is **one login: the parent (or the therapist, on a separate portal)**. A parent account can hold **one or more child profiles** (name, age, avatar, sensory prefs) — a child never logs in independently, never has a PIN, never gets its own JWT. Every practice session runs *inside* the parent's authenticated session, with the parent picking which child profile is active for that session (e.g. via a simple profile-switcher, like Netflix profiles under one account).
- **Why:** (1) it matches how the app is actually used — a parent sits with their autistic child during practice; (2) it removes an entire subsystem (child JWT scoping, PIN UI, avatar grid, "prove child can't reach therapist endpoints" security tests) that added real complexity for a login mode nobody uses; (3) it matches the already-running code (`auth.py` — single `role: "user"`, child fields on the parent's record).
- **What changes vs the original Mitra plan:** `children` table keeps `parent_id`, `therapist_id` (nullable), name/dob/avatar/sensory_prefs — **remove `pin_hash`** and the whole `/api/auth/child-login` endpoint. Sessions are created and driven by the parent's access token; add a `child_id` field on `sessions` to say which child profile this run was for (already in the schema). Therapist/admin logins are unaffected — those remain separate real accounts as before.
- **What stays the same:** the therapist and admin roles, JWT access+refresh for parent/therapist/admin, everything downstream of "which child_id is this session for."
- **Update every reference to "child PIN login" / "child JWT" elsewhere in this document** to mean: *"parent is logged in; parent has selected a child profile to run this session for."*

### 0.11 Mobile stack: native Android (Kotlin/Compose, already started) vs Flutter vs web-only
- **Finding:** `SpeakEasyAndroid/` already has a real Kotlin + Jetpack Compose app: Login/Register/Onboarding/Home/Lessons/Practice/Progress/Rewards/Candle-game screens, `VoiceRecorder`, `ApiService`, `AuthViewModel`, theming. This is genuine sunk work in a stack the original Mitra plan didn't anticipate.
- **Recommendation: keep native Android (Kotlin/Compose), drop Flutter from this plan entirely.** Rewriting working Kotlin screens into Flutter is pure waste. If mobile becomes a 🟡 stretch item you actually pursue (Phase 7), it means **finishing/aligning `SpeakEasyAndroid/`** against the new backend (parent-only auth, new practice-session shape, mimicry+scoring) — not starting a second mobile codebase.
- **iOS:** still undecided and still 🟡/optional. If iOS is required for the demo, that's a new native SwiftUI app or a later Flutter rewrite of the Android app for cross-platform reach — treat as its own decision if/when you get there. Do not start it before the web MVP + Android alignment are both solid.
- **Action:** wherever this plan (and `PROJECT_PLAN.md`) says "Flutter," read it as "native Android (Kotlin/Compose, in `SpeakEasyAndroid/`)" for planning purposes, and treat iOS as out of scope until explicitly revisited.

### 🟠 0.12 Talking-Tom-style Mitra mimicry — client-side, instant, decoupled from scoring
- **Decision: pitch/formant-shift the child's own recording client-side (Web Audio API) and play it back immediately**, while the same recording is uploaded in the background for the real Tamil ASR + phoneme scoring pipeline (Decision 0.4 model). These are two independent consumers of one `Blob`/audio buffer — never make the fun mimicry wait on the model, and never let the mimicry stand in for the real score.
- **Recommended technique (first pass):** `AudioContext` + an `AudioBufferSourceNode` with `playbackRate`/`detune` adjusted up (classic "chipmunk" Talking-Tom effect) — trivial to implement, zero server round-trip, sounds authentically like the reference app. **Upgrade path (if time allows):** a formant-preserving pitch-shift library (e.g. `soundtouchjs` compiled to a Web Audio worklet) so the mimic pitch changes without also speeding up/slowing down the clip — nicer, not required for MVP.
- **Lip-sync (cheap but effective):** drive the 3D Mitra's mouth-open scale in real time from an `AnalyserNode` amplitude envelope of the *mimic playback* — not full phoneme/viseme mapping. Good enough to feel alive; out of scope to do proper viseme animation.
- **Full detail, sequencing, and the exact agent-build prompts are in PART L — read it before building Phase 4.**

---

# PART C — 6-MONTH ROADMAP (phases → weeks → milestones)

| Phase | Weeks | Focus | Tier | Milestone |
|---|---|---|---|---|
| **0. Foundation** | 1–2 | Decisions, scaffold, Docker, DB schema, seed data | 🟢 | Stack boots; health check green; DB seeded |
| **1. Auth** | 3–4 | Parent/therapist/admin auth + child-profile selector (no PIN — Decision 0.10) | 🟢 | Every role can log in; parent can create/select a child profile |
| **2. Core screens + content** | 5–7 | Therapist/parent dashboards, content builder, program assignment | 🟢 | Real data flows to real screens |
| **3. Speech core (HARD)** | 8–11 | Tamil ASR + scoring + Tamil TTS + attempt pipeline | 🟢 | Real Tamil word → real score in DB |
| **4. Mitra + session flow** | 12–14 | 3D companion + end-to-end child practice session | 🟢 | A child can complete a full session |
| **★ MVP MILESTONE** | **15** | Integrate, test, mid-project demo of the web MVP | 🟢 | **Demo-ready web app** |
| **5. Analytics** | 16–17 | Progress engine (Celery), charts, PDF export | 🟢/🟡 | Real trends on dashboards |
| **6. Messaging/notifications** | 18 | Parent↔therapist chat, notifications | 🟡 | Real-time messaging works |
| **7. Native Android** (`SpeakEasyAndroid/`, was "Flutter app") | 19–22 | Align existing Kotlin/Compose app to new backend + mimicry+scoring | 🟡 | Session on phone shows on web dashboard |
| **8. Admin panel** | 23 | User mgmt, content moderation, system health | 🟡 | Admin can manage the system |
| **9. Security/A11y/QA** | 24–25 | Security review, ASD accessibility, test suite | 🟢 | Tests pass; a11y verified |
| **10. Deploy + finalize** | 26 | Production deploy, final audit, demo script | 🟢 | **Live URL; demo script ready** |

> **If you slip:** protect Phases 0–4, 15, and 10. Sacrifice 6, 7, 8 in that order. Phase 5 (analytics) and 9 (QA) stay because they carry academic marks and credibility.

---

# PART D — DETAILED STEP-BY-STEP BUILD

Each step below is a self-contained agent session. Paste the **Agent prompt** into Claude Code. Then verify against **Acceptance criteria** yourself before checking the box.

> Global rule for every step: **No mock data. Every screen reads a real API; every API reads the real DB.** Tell the agent to read `implementation_plan.md` + `DECISIONS.md` first and not to break passing tests.

---

## PHASE 0 — FOUNDATION (Weeks 1–2)

### ☐ Step 0.1 — Lock decisions & repo setup
- **Goal:** Turn Decision 0 into written commitments and an empty, structured repo.
- **Build:** Create `DECISIONS.md` (answers to 0.1–0.9), `PROGRESS.md`, keep this file at repo root. Init git, set up branch protection on `main`.
- **Deliverables:** `DECISIONS.md` filled in; repo initialized.
- **Acceptance:** Every Decision 0 item has a written answer with a one-line rationale.
- **Est:** 0.5 day · **Risk:** Low (but skipping this causes churn later).

### ☐ Step 0.2 — Monorepo scaffolding & infra (Prompt 1)
- **Goal:** `docker compose up` brings up Postgres 15 + Redis + FastAPI (hot reload) + Celery worker, all networked.
- **Prereq:** 0.1.
- **Agent prompt:**
  > Read `implementation_plan.md` and `DECISIONS.md`. Set up a monorepo: `/backend` (FastAPI, Python 3.11, `uv`), `/frontend` (Next.js 14 App Router + TS + Tailwind), `/infra` (`docker-compose.yml`: postgres 15, redis, backend, celery worker). Configure Tailwind with the exact CSS variables from PART A/PROJECT_PLAN.md §2.2 (warm palette). Add `GET /api/health` that really pings DB + Redis and returns their true status. Add a Next.js page that calls `/api/health` and shows live status. Set up SQLAlchemy 2.0 async + Alembic wired to docker Postgres. Add GitHub Actions CI: lint + typecheck (both), and an `alembic upgrade head` job against a throwaway Postgres. Write a root README with one-command local run. No mock UI beyond the health page.
- **Deliverables:** Bootable stack, health page, CI green.
- **Acceptance:** `docker compose up` works; health page shows **real** DB+Redis status; CI passes on a test PR.
- **Est:** 2–3 days · **Risk:** Medium (Docker networking, first CI setup).

### ☐ Step 0.3 — Full database schema + migrations + seed (Prompt 2)
- **Goal:** Every table from PROJECT_PLAN.md §3 exists, migrated, and seeded with realistic Tamil data.
- **Prereq:** 0.2.
- **Agent prompt:**
  > Read PROJECT_PLAN.md §3. Implement all SQLAlchemy models (users, therapist_profiles, parent_profiles, children, therapy_modules, module_items, assigned_programs, sessions, session_attempts, progress_snapshots, therapist_notes, messages, notifications, audit_log) with correct types, FKs, indexes on all FKs + child_id/session_id/created_at, and sensible cascades. Generate + apply the Alembic migration. Write `backend/app/db/seed.py`: 2 therapists, 3 parents, 5 children (linked), 3 modules ("Animals", "Family Words", "Daily Actions") each with 15–20 real Tamil words (Tamil script + transliteration), real royalty-free image URLs, phoneme_breakdown JSON stub, and ~30 historical sessions with realistic attempts spread over 60 days. Run it and prove row counts via SQL output.
- **Deliverables:** Migration file, seed script, populated DB.
- **Acceptance:** `alembic upgrade head` clean; seed runs; SQL row counts printed and correct; dashboards later will not be empty.
- **Est:** 3–4 days · **Risk:** Medium (schema mistakes are expensive later — get FKs/indexes right now).

---

## PHASE 1 — AUTH (Weeks 3–4)

### ☐ Step 1.1 — Backend auth + child profiles (Prompt 3, backend) — 🔁 per Decision 0.10
- **Goal:** Register/login/refresh/logout (parent/therapist/admin) + real child-profile CRUD under a parent account + role guards. **No child PIN login, no child JWT.**
- **Agent prompt:**
  > Implement `/api/auth/register` (parent/therapist/admin), `/api/auth/login` (email+pw → access+refresh JWT), `/api/auth/refresh`, `/api/auth/logout` (refresh revocation via Redis blocklist). Hash with bcrypt/passlib. Return real validation errors. Add `require_role(...)` dependency used to protect endpoints. Add `/api/children` CRUD scoped to `parent_id = current_user.id` (create/list/update a child profile: name, dob, avatar, sensory_prefs — **no `pin_hash` field, no separate login for it**). Every session-related endpoint later takes a `child_id` and must verify that child belongs to the authenticated parent (or is assigned to the authenticated therapist). Write pytest proving a parent cannot read/edit another parent's child profile.
- **Acceptance:** All auth endpoints work; a parent can create/list their own child profiles; cross-parent access is provably blocked; auth tests pass.
- **Est:** 3–4 days · **Risk:** Medium (get the per-parent child-profile scoping right — this replaces the old child-JWT security concern).

### ☐ Step 1.2 — Frontend auth + child-profile selector (Prompt 3, frontend) — 🔁 per Decision 0.10
- **Goal:** Real login/register UI + a simple child-profile picker (Netflix-style, under the logged-in parent) + route guards. No PIN pad, no avatar-login flow.
- **Agent prompt:**
  > Build login/register pages (React Query mutations to the auth API), tokens in httpOnly-cookie-backed session via Next.js route handlers. Build a child-profile picker screen shown right after parent login: real `/api/children` data as big tappable profile tiles (name + avatar) + `Add child` tile that opens a create-profile form (name, DOB, avatar picker). Selecting a tile sets the "active child" for the session (stored in app state, not a separate token) and proceeds to the child home/practice flow. Add middleware/guards redirecting unauthenticated/wrong-role users. Handle error + loading states for real.
- **Acceptance:** Register a parent, log in, create a child profile, select it, land on child home; a therapist/admin logging in never sees this picker (they go to their own dashboard). No hardcoded user or child lists.
- **Est:** 3–4 days · **Risk:** Low–Medium (this is simpler than the PIN flow it replaces).

---

## PHASE 2 — CORE SCREENS + CONTENT (Weeks 5–7)

### ☐ Step 2.1 — Therapist & parent dashboards (Prompt 4)
- **Agent prompt:**
  > Build real endpoints + screens: `/api/therapist/children` (with last-session summary computed from real attempts), therapist child-detail (profile, programs, recent sessions, add note via real POST). `/api/parent/children`, parent child-detail with progress via `/api/children/{id}/progress`. Responsive, design-system styled, graceful empty states (new child = real "no sessions yet", not broken charts).
- **Acceptance:** Log in as seeded therapist + parent; data on screen matches Postgres for that user.
- **Est:** 4–5 days · **Risk:** Low–Medium.

### ☐ Step 2.2 — Content builder + program assignment (Prompt 5)
- **Agent prompt:**
  > Full CRUD for therapy_modules + module_items, incl. image upload via **presigned URLs** to R2/S3 (never base64-in-DB), validation, drag-to-reorder persisted via order_index. Frontend content builder (create module, add items w/ image upload, reorder, set difficulty, publish/unpublish) — all persisted + refetched, no local-state-as-source-of-truth. Add program assignment: therapist assigns a module to their children → real assigned_programs rows with status (not_started/in_progress/completed).
- **Acceptance:** Create a module + items with images; reorder persists across refresh; assign to a child and see the row in DB.
- **Est:** 5–6 days · **Risk:** Medium (file upload/presigned URLs).

---

## PHASE 3 — SPEECH CORE 🔴 (Weeks 8–11) — the hardest, riskiest phase

> Give this phase the most buffer. Start with a spike (3.0) before committing.

### ☐ Step 3.0 — ASR/TTS model spike (decide 0.4 & 0.5 with data)
- **Goal:** Pick the Tamil ASR + TTS models by *measuring*, not guessing.
- **Build:** Record (or TTS-generate) 10 real Tamil word samples. Run 2 ASR candidates; compare transcript accuracy + latency on your target hardware. Run 2 TTS candidates; judge intelligibility. Write results into `DECISIONS.md`.
- **Acceptance:** ASR + TTS models chosen with recorded numbers and rationale.
- **Est:** 3–4 days · **Risk:** 🔴 High (this de-risks the whole phase — do not skip).

### ☐ Step 3.1 — Tamil ASR + scoring pipeline (Prompt 6)
- **Agent prompt:**
  > Implement the chosen **Tamil** ASR (from `DECISIONS.md`) as a Celery task / service that takes audio → real transcript + confidence (no random numbers). **Port and adapt the scoring logic from the existing `speech_evaluator.py`, but replace the English wav2vec2 model with the chosen Tamil model.** Implement phoneme-level similarity (e.g. panphon + Levenshtein on phoneme sequences, or forced alignment) → 0–100 `similarity_score` (not exact string match). Expose `POST /api/sessions/{id}/attempts`: accept audio for a module_item, run pipeline (Celery + polling), store real transcript/score/phoneme_accuracy in session_attempts. Test with 5 real Tamil samples; confirm scores correlate with correctness.
- **Acceptance:** Correct pronunciation scores high, wrong scores low, on real audio. No English model anywhere.
- **Est:** 6–8 days · **Risk:** 🔴 High.

### ☐ Step 3.2 — Tamil TTS (Mitra's voice) (Prompt 7)
- **Agent prompt:**
  > Integrate the chosen Tamil TTS. `POST /api/tts/generate` (text → real audio, cached in R2 by text-hash). Regenerate all seeded module_item reference audio with real files. Build the "Mitra speaks correct pronunciation" flow: after an attempt, backend picks an encouraging template by score band, fills the target word, returns cached TTS URL. Write 8–10 age-appropriate, always-positive Tamil response templates.
- **Acceptance:** Mitra audibly speaks a real Tamil word; identical text is served from cache on repeat.
- **Est:** 4–5 days · **Risk:** Medium.

> **(🟡 optional accuracy upgrade)** Once 3.1 is solid, salvage `dtw_aligner.py`: add `fastdtw` to requirements, wire a DTW "goodness of pronunciation" score as an *additional* signal blended into `similarity_score`. Only do this if ahead of schedule.

---

## PHASE 4 — MITRA + SESSION FLOW (Weeks 12–14) — 🔁 now mimic-first, per PART L

### ☐ Step 4.0 — Talking-Tom mimicry engine (Track A) — 🟠 NEW, do this before 4.1
- **Goal:** The core child-facing loop — instant, client-side, pitch-shifted echo of the child's own voice, exactly like Talking Tom.
- **Agent prompt:** use the **exact prompt in PART L §L.7** verbatim.
- **Acceptance:** See PART L §L.8 in full (instant playback regardless of network, visible mouth-sync, Track B still runs and scores independently, verified with a mocked slow/failing network test).
- **Est:** 3–4 days · **Risk:** Medium (Web Audio API edge cases across browsers; keep the fallback — plain unshifted playback — simple).

### ☐ Step 4.1 — 3D Mitra companion + extended state machine, web (Prompt 8, extended)
- **Agent prompt:**
  > Read PART A + PART L + PROJECT_PLAN.md §1.2/§2.1. Add a licensed original rigged GLB (per `DECISIONS.md` 0.8) as `<MitraCompanion/>` (React Three Fiber + drei) with the full state machine from PART L §L.6: idle (gentle breathing), listening, **mimic-playback** (new — wired to Step 4.0's Track A), thinking (waiting on Track B only if not yet resolved), celebrating (soft bounce, no jump-scare), gently-correcting (calm nod). Wire states to the real mimic-first sequence: idle → listening on mic → **mimic-playback the instant recording stops** → thinking (only if scoring is still pending) → celebrating/correcting from the real score → optional TTS encouragement audio (F12, Mitra's own voice). Respect `children.sensory_prefs` (reduce_motion → crossfades). Lazy-load the 3D bundle; target 60fps mid-range laptop.
- **Acceptance:** Mitra mimics instantly on stop, then visibly reacts to the real score once it arrives; reduce-motion path works; page load isn't blocked by the 3D bundle.
- **Est:** 5–6 days · **Risk:** Medium–High (3D perf, GLB rigging/animation, plus wiring the new mimic-playback state cleanly).

### ☐ Step 4.2 — Child practice session, end-to-end, mimic-first (Prompt 9, extended)
- **Agent prompt:**
  > Wire Steps 4.0–4.1 + F11 (Tamil ASR scoring, Track B) + F12 (TTS) into the child practice screen, per PART L §L.2's sequence: parent is logged in and has selected a child profile (Decision 0.10, no PIN) → sees real assigned programs for that child → picks one → goes through module_items in order. Per item: show image (+ optional text), Mitra speaks target (TTS, Mitra's own voice), child records (big record button + real waveform), on stop: instant mimic playback (Step 4.0) fires while the recording uploads in parallel to the attempt endpoint (Track B), Mitra reacts (celebrating/correcting + optional TTS) once the real score returns, real session_attempts row created (with `mimic_played=true` and the real `similarity_score`), session row updated on finish. End screen shows real stats **refetched from the API** (prove persistence — and that the displayed score is the real model score, not anything derived from the mimicry). Calm progress bar + item counter; configurable session length (8–10 items).
- **Acceptance:** Complete a full session; mimicry is instant every time; therapist/parent dashboards immediately reflect the new session with the real (non-mimicry) score.
- **Est:** 5–6 days · **Risk:** Medium.

---

## ★ Week 15 — MVP MILESTONE

- **Goal:** Freeze features. Integrate, fix, and rehearse a demo of the **web MVP** (🟢 items 1–9).
- **Do:** End-to-end run as therapist → child → parent. Fix the top bugs. Record a backup screen capture in case live demo fails.
- **Acceptance:** You can demo, on one machine, the full loop: assign module → child practices with Mitra (real Tamil ASR + TTS + 3D) → parent/therapist sees real progress. **If this works, you already have a passing final-year project.**

---

## PHASE 5 — ANALYTICS (Weeks 16–17)

### ☐ Step 5.1 — Progress engine + charts + PDF (Prompt 10)
- **Agent prompt:**
  > Celery beat nightly job (also on-demand for demos) computing progress_snapshots per child/module from real attempts: mastery_score, trend, items_mastered vs in_progress. Endpoints: `/api/children/{id}/progress/timeseries`, `/progress/by-module`, `/api/therapist/analytics/overview`. Frontend charts (recharts) using only these real endpoints. PDF export (WeasyPrint or headless-Chrome) pulling live data for a date range.
- **Acceptance:** Trends match real seeded+new data; PDF contains real numbers.
- **Est:** 5–6 days · **Risk:** Medium (Celery beat scheduling; PDF rendering).

---

## PHASE 6 🟡 — MESSAGING & NOTIFICATIONS (Week 18)

### ☐ Step 6.1 — Messaging + notifications (Prompt 11)
- **Agent prompt:**
  > WebSocket messaging (parent ↔ child's therapist) backed by messages/threads, REST fallback for history. Notifications table + endpoints + bell UI with real unread counts, triggered by real events (session completed, new note, new message). Email via a real provider sandbox (Resend/SendGrid test mode), per-user configurable.
- **Acceptance:** Two browsers, real-time message; bell count updates on real events.
- **Est:** 5 days · **Risk:** Medium. **Cut this first if behind.**

---

## PHASE 7 🟡 — FLUTTER APP (Weeks 19–22)

> Only start if the MVP is deployed and stable. This is 4 weeks; it's the easiest thing to cut.

### ☐ Step 7.1 — Flutter foundation (Prompt 12)
- **Agent prompt:**
  > Scaffold `/mobile` (flutter_riverpod, go_router, flutter_secure_storage, dio) against the same backend. Rebuild auth (adult + child PIN) and therapist/parent dashboards natively; confirm data parity with web on the same seeded account. Decide 3D-on-mobile approach by real device testing (three_dart / WebView WebGL / flutter_unity_widget); fall back to Lottie/prerendered animation states driven by real backend state if perf is poor — document why. Add Flutter CI.
- **Acceptance:** Same seeded account shows identical data on web and mobile.
- **Est:** 6–7 days · **Risk:** Medium.

### ☐ Step 7.2 — Flutter practice flow + audio (Prompt 13)
- **Agent prompt:**
  > Full child practice flow on Flutter (record pkg → same attempt endpoint → Mitra reaction → just_audio TTS → real summary). Handle mic permissions (calm prompt), poor-connectivity attempt queueing + retry (never drop a child's recording), iOS audio session handling. Confirm a mobile session appears live on the web therapist dashboard.
- **Acceptance:** A phone session shows up in real time on web.
- **Est:** 6–7 days · **Risk:** Medium–High.

> **(🟡 iOS/store readiness, Prompt 14)** App icons, launch screens, AVAudioSession, honest children's-data privacy policy, store metadata drafts, TestFlight/internal track. Only if genuinely ahead.

---

## PHASE 8 🟡 — ADMIN PANEL (Week 23)

### ☐ Step 8.1 — Admin panel (Prompt 15)
- **Agent prompt:**
  > Admin web panel: user management (search/filter/deactivate), content moderation, system-health dashboard (real DB size, active sessions today, error rate from logs), audit_log viewer. All behind admin-only protected endpoints.
- **Acceptance:** Admin can deactivate a user + view audit log with real data.
- **Est:** 4–5 days · **Risk:** Low.

---

## PHASE 9 — SECURITY, ACCESSIBILITY & QA (Weeks 24–25) 🟢 keep this

### ☐ Step 9.1 — Security + a11y + test suite (Prompt 16)
- **Agent prompt:**
  > Security: rate-limit auth endpoints, validate/sanitize all uploads, **prove child JWTs cannot reach therapist/admin endpoints with automated tests**, least-privilege bucket policies, HTTPS-only cookie flags, CSRF on state-changing routes. Accessibility (ASD-specific): keyboard nav, screen-reader labels, contrast check vs the palette, verified reduce-motion end-to-end. Tests: backend pytest (auth, scoring pipeline, session flow — real business logic coverage), frontend integration (Playwright/Cypress) for main flows, Flutter widget/integration tests (if Phase 7 done). Fix everything found; do not disable failing tests.
- **Acceptance:** Test suite green; security tests prove scoping; a11y verified (not just declared).
- **Est:** 6–8 days · **Risk:** Medium (things always surface here — that's the point).

---

## PHASE 10 — DEPLOY + FINALIZE (Week 26) 🟢

### ☐ Step 10.1 — Production deploy (Prompt 17)
- **Agent prompt:**
  > Deploy per `DECISIONS.md` 0.7: backend + worker (Render/Railway/Fly), managed Postgres + Redis, R2/S3 with correct CORS, frontend on Vercel, secrets management, separate staging vs prod DBs. Real deploy docs + rollback procedure. Confirm the seeded demo works end-to-end on the live URL. (If Phase 7 done: TestFlight/internal build.)
- **Acceptance:** Live URL runs the full seeded demo.
- **Est:** 3–4 days · **Risk:** Medium (prod config, CORS, secrets).

### ☐ Step 10.2 — Final audit + demo script (Prompt 18)
- **Agent prompt:**
  > Audit the live system against PART B (MVP items) + PROJECT_PLAN.md §4. List anything incomplete or still using placeholder data and fix it — no known mock data anywhere. Write a demo script: (1) therapist assigns a program, (2) child completes a real Mitra session, (3) parent sees it live, (4) therapist note reaches parent as a real notification.
- **Acceptance:** Clean demo script; zero known mock data; you can present confidently.
- **Est:** 2–3 days · **Risk:** Low.

---

# PART E — CROSS-CUTTING CONCERNS (apply throughout, don't defer)

### E.1 Testing
- Write tests **as you build each phase**, not only in Phase 9. Minimum: auth, scoring pipeline, session flow.
- CI must run tests on every push. A red CI blocks merge.

### E.2 Security (children's data)
- Child JWTs are the highest-risk surface — scope them tightly from Step 1.1 and test the scoping.
- Sanitize/validate every file upload. Presigned URLs, least-privilege buckets.
- HTTPS-only cookies, CSRF protection, rate-limited auth.

### E.3 Data privacy & ethics (marks + real responsibility)
- Parental consent captured at child-profile creation.
- Written retention policy (e.g. delete raw audio after scoring / 30 days).
- Honest privacy policy (India DPDP Act 2023 + COPPA-style thinking). No ad tracking.

### E.4 ASD-specific accessibility (this is the *point* of the app)
- Warm, low-stimulation palette (PART A / §2.2). No sudden motion or loud sounds.
- Predictable layouts, minimal motion by default, `reduce_motion` honored everywhere.
- Positive-only language — never "wrong," always "let's try together."
- Short, configurable sessions with clear visual timers.

### E.5 No mock data — ever
- Every screen reads a real API; every API reads the real seeded DB. Enforce this in code review of each step.

---

# PART F — RISK REGISTER

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Tamil ASR accuracy poor / slow | High | 🔴 Critical | Model spike (3.0) before committing; have a fallback (Whisper medium); allow full latency budget via Celery |
| R2 | Scope too big for solo/6mo | High | 🔴 Critical | Strict MVP line (Part B); cut 🟡 first; protect Phases 0–4, 15, 10 |
| R3 | 3D Mitra performance on target devices | Medium | High | Lazy-load; low-poly asset; Lottie/prerender fallback on mobile |
| R4 | Stack indecision / straddling two stacks | Medium | High | Lock Decision 0.1–0.3 in Week 1; do not straddle |
| R5 | Deployment/config surprises at the end | Medium | Medium | Deploy a thin slice early (health page) in Phase 0; keep prod parity |
| R6 | Children's-data privacy handled late | Medium | High (marks/ethics) | Consent + retention designed from Step 1.1; policy in Phase 9 |
| R7 | Losing time to the coding agent going off-plan | Medium | Medium | Start every session with "read implementation_plan.md + DECISIONS.md; no mock data; don't break tests" |
| R8 | Flutter eats the schedule | Medium | Medium | Gate it behind a stable MVP; cut without guilt |

---

# PART G — WORKING WITH THE CODING AGENT (do this every session)

1. **Prime it:** "Read `implementation_plan.md` and `DECISIONS.md`. We're on Step X.Y. Do not use mock data. Do not break passing tests. Read the existing code before writing new code."
2. **One step per session.** Don't let it run ahead into the next phase.
3. **Verify yourself.** Run the acceptance criteria manually. The agent saying "done" is not "done."
4. **Commit per step** with a clear message; keep `main` green.
5. **Update `PROGRESS.md`** after each step (what's done, what broke, what's next).
6. **When stuck on a hard step (Phase 3/4),** ask the agent for 2–3 approaches with trade-offs before it writes code.
7. **Model choice:** use a strong model (e.g. Opus/Sonnet at high effort) for Phases 3, 4, 9; a cheaper/faster model is fine for boilerplate (Phase 0 scaffolding, simple CRUD screens).

---

# PART H — DEFINITION OF DONE

**MVP done** = 🟢 items 1–11 in Part B pass acceptance (including the Talking-Tom mimicry loop and the real Tamil model scoring running in parallel, per PART L) + deployed to a live URL + demo script written + zero known mock data.

**Project "A-grade" done** = MVP + Phase 5 analytics + Phase 9 QA green + honest privacy handling + at least one 🟡 stretch item (whichever you finished cleanly).

---

# APPENDIX

### A1 — `DECISIONS.md` template
```
# Decisions
0.1 Greenfield vs Evolve: ___ (why: ___)
0.2 DB: ___
0.3 Web framework: ___
0.4 Tamil ASR model: ___ (spike results: ___)
0.5 Tamil TTS model: ___
0.6 Mobile this cycle (native Android alignment)? ___
0.7 Hosting: ___
0.8 3D asset + license: ___
0.9 Privacy/retention stance: ___
0.10 Auth model: parent-only + child profiles, confirmed? ___ (removes pin_hash/child-login)
0.11 Mobile stack: native Android (SpeakEasyAndroid/) confirmed, Flutter dropped? ___
0.12 Mimicry technique: playbackRate/detune (MVP) or formant-preserving lib (stretch)? ___
```

### A2 — `PROGRESS.md` template
```
# Progress log
YYYY-MM-DD | Step X.Y | status | notes / blockers / next
```

### A3 — Salvage list from existing SpeakEasy code
- `speech_evaluator.py` → **port scoring logic**, swap English model for Tamil (Step 3.1).
- `dtw_aligner.py` → 🟡 blend DTW score as accuracy upgrade (post-3.1); add `fastdtw` to deps.
- Candle breath test / `CandleScene.jsx` → 🟡 optional mini-game feature.
- `accoustic_processor.py`, `edge_storage.py` → ignore for MVP; `edge_storage` idea → 🟡 offline queueing (Step 7.2).

### A4 — Glossary
- **ASR** = Automatic Speech Recognition (speech → text). **TTS** = Text-to-Speech.
- **Phoneme** = smallest unit of sound; phoneme-level scoring is more forgiving/accurate than exact-string match.
- **DTW** = Dynamic Time Warping; aligns two audio sequences of different lengths for similarity scoring.
- **GoP** = Goodness of Pronunciation, a standard pronunciation-scoring metric.

---

*End of Part 1. Parts I–K below give feature-by-feature, screen-by-screen (button-level), and day-by-day detail.*

---

# PART I — MASTER FEATURE TABLE

Every feature, the **exact detailed prompt** to paste into the coding agent, and **what must exist** when it's done (down to buttons/endpoints). Tier: 🟢 MVP · 🟡 Stretch. Do features top-to-bottom within each phase.

| # | Feature | Tier | Detailed prompt to give the agent | What must be done (buttons / elements / endpoints / acceptance) |
|---|---|---|---|---|
| F1 | Monorepo + Docker infra | 🟢 | "Read `implementation_plan.md`. Create `/backend` (FastAPI, py3.11, uv), `/frontend` (Next.js 14 App Router, TS, Tailwind), `/infra` (docker-compose: postgres15, redis, backend hot-reload, celery worker). Wire Tailwind to the warm palette in §2.2. Add `GET /api/health` that truly pings DB+Redis. Add a Next.js `/health` page showing live status. SQLAlchemy 2.0 async + Alembic. GitHub Actions CI: lint, typecheck, `alembic upgrade head` on throwaway PG. Root README, one-command run. No mock UI." | `docker compose up` boots all 4 services · `/api/health` returns real DB+Redis status · `/health` page renders it live · CI green on a PR · README run command works |
| F2 | Database schema + seed | 🟢 | "Implement all SQLAlchemy models from PROJECT_PLAN §3 with FKs, indexes (child_id, session_id, created_at), cascades. Alembic migration + apply. `seed.py`: 2 therapists, 3 parents, 5 children, 3 Tamil modules ×15–20 items (Tamil script + transliteration + real image URLs + phoneme stub), ~30 historical sessions over 60 days. Print SQL row counts." | 14 tables migrated · seed runs · row counts printed · dashboards will never be empty |
| F3 | Adult auth (register/login/refresh/logout) | 🟢 | "Implement `/api/auth/register` (admin/therapist/parent), `/login` (email+pw→access+refresh JWT), `/refresh`, `/logout` (Redis refresh blocklist). bcrypt hashing. Real validation errors. `require_role()` dependency. pytest for each path." | Endpoints work · refresh + revoke work · role guard blocks wrong role · tests pass |
| F4 | Child profile picker (no PIN — Decision 0.10) | 🟢 | "Add `/api/children` CRUD scoped to the authenticated parent (create/list/update — no `pin_hash`, no separate login). Frontend: profile-picker screen (Netflix-style tiles) shown after parent login, `Add child` tile → create-profile form. Selecting a tile sets the active child in app state (not a new token) and proceeds to child home. Test that a parent cannot read another parent's children." | Profile tiles (real data) · "Add child" tile + form (name/DOB/avatar) · tapping a tile sets active child · cross-parent access blocked (test) |
| F5 | Auth UI + route guards | 🟢 | "Build login/register pages (React Query mutations), tokens in httpOnly cookies via Next route handlers. Middleware redirects unauthenticated/wrong-role. Loading + error states real." | Login form (email, password, show/hide, submit, "forgot?") · register form (role select, name, email, pw, confirm) · guards redirect correctly |
| F6 | Therapist dashboard | 🟢 | "Build `/api/therapist/children` (with last-session summary computed from real attempts) + therapist home screen: children cards, quick stats, recent activity. Empty state for no children." | Children cards (name, avatar, last session, mastery %) · "Add child" button · search/filter · "View" per card · real empty state |
| F7 | Therapist child-detail + notes | 🟢 | "Child detail page: profile, assigned programs, recent sessions list, add-note form (real POST to therapist_notes). `/api/children/{id}` + `/api/children/{id}/notes`." | Profile header · programs list · sessions table (date, score, items) · note textarea + "Save note" · notes history |
| F8 | Parent dashboard + child progress | 🟢 | "Build `/api/parent/children` + parent home + child-detail with progress charts fed by `/api/children/{id}/progress`. Graceful empty states." | Child cards · "View progress" · charts (accuracy over time, mastery by module) · "Start home practice" button |
| F9 | Content builder (modules) | 🟢 | "Full CRUD for therapy_modules + module_items. Image upload via presigned R2/S3 URLs (no base64). Drag-reorder persisted via order_index. Publish/unpublish." | Module list · "New module" · title/desc/difficulty/language fields · item rows (word, transliteration, image, audio) · "Add item", drag handle, delete, "Publish" toggle |
| F10 | Program assignment | 🟢 | "Therapist assigns a module to ≥1 of their children → real assigned_programs rows with status (not_started/in_progress/completed)." | "Assign" button · child multi-select · start-date picker · status badge · appears on child's practice list |
| F11 | Tamil ASR + scoring | 🟢 | "Implement chosen Tamil ASR (from DECISIONS.md) as Celery task → real transcript + confidence. Port scoring from existing `speech_evaluator.py` but REPLACE English wav2vec2 with the Tamil model. Phoneme similarity (panphon+Levenshtein or forced alignment) → 0–100. `POST /api/sessions/{id}/attempts` stores real transcript/score/phoneme_accuracy. Test 5 real Tamil samples." | Endpoint accepts audio · returns real score · correct→high, wrong→low · NO English model · Celery + polling works |
| F12 | Tamil TTS (Mitra's own voice — target words + encouragement) | 🟢 | "Integrate chosen Tamil TTS. `POST /api/tts/generate` (text→audio, cached in R2 by text-hash). Regenerate seeded reference audio. Score-band → encouraging Tamil template → TTS URL. Write 8–10 positive Tamil templates. **Note: this is Mitra's own fixed voice — distinct from the Track-A mimicry (F13.5), which echoes the CHILD's own voice.**" | Mitra speaks real Tamil in its own voice · cache hit on repeat · templates are always-positive |
| F13 | 3D Mitra companion (extended state machine) | 🟢 | "Add licensed original rigged GLB as `<MitraCompanion/>` (R3F + drei) with states idle/listening/**mimic-playback**/thinking/celebrating/gently-correcting driven by PART L's sequence. Respect `sensory_prefs.reduce_motion` (crossfade fallback). Lazy-load; 60fps target." | Mitra renders + animates per state incl. the new mimic-playback state · reduce-motion path · lazy bundle doesn't block load |
| F13.5 | 🟠 Talking-Tom mimicry engine (PART L, the core loop) | 🟢 | See PART L §L.7 for the full exact prompt: client-side Web Audio pitch-shift playback of the child's own recording, fired instantly on stop, with amplitude-driven lip-sync, running fully in parallel with (never blocking, never blocked by) the Track-B ASR/scoring upload. | Mimic plays within ~150ms of stop, regardless of network · Mitra mouth animates with it · Track B (F11) still runs and populates real scores independently — verify both in one test |
| F14 | Child practice session (end-to-end, mimic-first) | 🟢 | "Wire F13.5 (mimicry, fires first/instant) + F11 (scoring, async) + F13 (state machine) + F12 (TTS encouragement) into the child practice screen: parent logs in → picks child profile → picks program → items in order. Per item: image + optional text, `Hear it` (TTS of target), big record button + waveform, on stop: instant mimic playback (F13.5) + parallel upload to attempt endpoint (F11), Mitra reacts on the real score once it arrives, persist attempt + update session. End screen shows real stats refetched from API. Progress bar + item counter; 8–10 items configurable." | Full loop works, mimic-first then score-driven reaction · session persists · dashboards reflect the real (non-mimicry) score immediately |
| F15 | Session summary + rewards | 🟢 | "End-of-session screen: real stats (words tried, avg score, best word), gentle celebration (stars/confetti, no jump-scare), 'Play again' + 'Done' buttons. Refetch from API." | Stats cards · star/confetti (respects reduce-motion) · "Play again" / "Done" buttons |
| F16 | Progress analytics engine | 🟢 | "Celery beat nightly (+ on-demand) computing progress_snapshots per child/module from real attempts (mastery, trend, items_mastered vs in_progress). Endpoints: `/progress/timeseries`, `/progress/by-module`, `/therapist/analytics/overview`. Recharts on dashboards using ONLY real endpoints." | Nightly job runs · charts show real trends · overview aggregates all a therapist's children |
| F17 | PDF progress export | 🟡 | "PDF export (WeasyPrint or headless-Chrome) pulling live data for a chosen date range." | "Export PDF" button · date-range picker · PDF has real numbers |
| F18 | Messaging (parent↔therapist) | 🟡 | "WebSocket messaging backed by messages/threads, REST fallback for history. Bell UI with real unread counts." | Thread list · message input + "Send" · real-time delivery · unread badge |
| F19 | Notifications + email | 🟡 | "Notifications table + endpoints + bell UI, triggered by real events (session done, new note, new message). Email via Resend/SendGrid sandbox, per-user configurable." | Bell icon + dropdown · unread count · "mark read" · email toggle in settings |
| F20 | Settings (account/accessibility/notifications) | 🟢 | "Settings screens per role: account (name, email, password change), accessibility (reduce motion, mute sudden sounds, font size), notification prefs. Persist to DB (children.sensory_prefs for child)." | Tabs: Account / Accessibility / Notifications · toggles + "Save" · child sensory prefs actually affect the session |
| F21 | Flutter foundation | 🟡 | "Scaffold `/mobile` (riverpod, go_router, secure_storage, dio) against same backend. Rebuild auth + dashboards natively. Decide mobile-3D approach by device testing; Lottie fallback if slow. Flutter CI." | Same seeded account shows identical data on web + mobile |
| F22 | Flutter practice flow | 🟡 | "Full child practice on Flutter (record→same endpoint→Mitra→just_audio TTS→summary). Mic permission (calm), offline attempt queue+retry, iOS audio session. Confirm mobile session shows on web dashboard." | Mobile session appears live on web |
| F23 | Admin panel | 🟡 | "Admin web: user mgmt (search/filter/deactivate), content moderation, system health (real DB size, active sessions today, error rate), audit_log viewer. Admin-only endpoints." | User table + deactivate · module moderation · health cards · audit log table |
| F24 | Security + a11y + tests | 🟢 | "Rate-limit auth, sanitize uploads, PROVE child JWT can't reach therapist/admin (tests), least-privilege buckets, HTTPS cookies, CSRF. A11y: keyboard nav, SR labels, contrast, reduce-motion verified. pytest + Playwright + Flutter tests. Fix all; don't disable failing tests." | Green test suite · security tests pass · a11y verified |
| F25 | Deploy + finalize | 🟢 | "Deploy per DECISIONS 0.7 (backend+worker+managed PG+Redis+R2, Vercel frontend, secrets, staging vs prod). Deploy docs + rollback. Confirm seeded demo on live URL. Final audit vs Part B; remove all mock data. Write demo script." | Live URL runs full demo · no mock data · demo script written |
| F26 | 🟡 DTW syllable scoring (salvage) | 🟡 | "Add `fastdtw` to deps. Wire `dtw_aligner.py` GoP score as an extra signal blended into similarity_score. Only after F11 is solid." | DTW score blended · accuracy improves on test set |
| F27 | 🟡 Breath-test candle mini-game (salvage) | 🟡 | "Port `CandleScene.jsx` + MediaPipe breath test as an optional calm mini-game between practice items." | Candle scene renders · blow detection works · optional/skippable |

---

# PART J — SCREEN-BY-SCREEN UI SPEC (button-level)

Every screen, every element, every state. Build to this spec. All screens use the warm palette (§2.2), calm/low-stimulation styling, and honor `reduce_motion`.

### J1 — Landing page 🟢
- **Elements:** logo/wordmark "Mitra", one-line tagline, hero image/illustration, "For therapists & parents" short blurb.
- **Buttons:** `Log in` (top-right), `Get started / Register` (primary), `Learn more` (scrolls to about section).
- **States:** static; responsive mobile/desktop.

### J2 — Register 🟢
- **Fields:** Role select (Therapist / Parent), Full name, Email, Password (with show/hide), Confirm password. Therapist also: license no. (optional), specialization.
- **Buttons:** `Create account` (primary, disabled until valid), `Already have an account? Log in` (link).
- **States:** inline validation errors, loading spinner on submit, success → redirect to dashboard.

### J3 — Login (adult) 🟢
- **Fields:** Email, Password (show/hide).
- **Buttons:** `Log in` (primary), `Forgot password?` (link, 🟡 can stub for MVP), `Register` (link), `Child login` (switches to J4).
- **States:** error banner on bad creds, loading, redirect by role.

### J4 — Child profile picker (no PIN — Decision 0.10) 🟢
- **Elements:** shown immediately after a **parent** logs in (never for therapist/admin). Grid of child-profile tiles (real data: avatar + name), an `+ Add child` tile.
- **Buttons:** profile tiles (tap → sets active child, proceeds to child home) · `+ Add child` (opens create form: name, DOB, avatar picker, `Save`) · per-tile `Edit` (parent-only, small pencil icon) · `Log out`.
- **States:** empty state for a brand-new parent ("Let's add your first child"), no PIN/password step of any kind here — the parent's own login already authenticated the session.

### J5 — Therapist dashboard (home) 🟢
- **Elements:** greeting header, summary stat tiles (total children, sessions this week, avg mastery), recent-activity feed.
- **Buttons:** `Add child` (primary), search box, filter dropdown (by module/status), per-child card `View`, top nav (Dashboard / Content / Analytics / Messages / Settings), notification bell, profile menu (`Log out`).
- **States:** empty state ("No children yet — add your first"), loading skeletons.

### J6 — Therapist child detail 🟢
- **Elements:** profile header (name, avatar, DOB, sensory prefs summary), assigned-programs list, recent-sessions table (date, module, items, avg score), notes panel.
- **Buttons:** `Assign program` · `Edit child` · per-session `View details` · note textarea + `Save note` · `Message parent`.
- **States:** empty programs / empty sessions handled gracefully.

### J7 — Content builder: module list 🟢
- **Elements:** table/grid of modules (title, difficulty, #items, published toggle).
- **Buttons:** `New module` (primary), per-row `Edit` / `Duplicate` / `Delete` (confirm dialog), `Publish/Unpublish` toggle, search/filter.

### J8 — Module editor 🟢
- **Fields:** Title, Description, Difficulty (dropdown), Language (Tamil default).
- **Item rows:** target word (Tamil), transliteration, image (upload/preview), reference audio (auto-generated by TTS, `Regenerate` button), phoneme breakdown.
- **Buttons:** `Add item`, drag-handle to reorder (persists), per-item `Delete` (confirm), `Save` / `Save & publish`.
- **States:** upload progress, reorder persists across refresh.

### J9 — Assign program modal 🟢
- **Elements:** module summary, child multi-select (checkbox list of this therapist's children), start-date picker.
- **Buttons:** `Assign` (primary), `Cancel`.
- **States:** success toast, prevents double-assign of same module to same child.

### J10 — Parent dashboard 🟢
- **Elements:** child cards (name, avatar, last session, mastery %), weekly summary.
- **Buttons:** per-child `View progress`, `Start home practice` (→ child session), `Message therapist`, notification bell, `Settings`, `Log out`.

### J11 — Progress / analytics screen 🟢
- **Elements:** accuracy-over-time line chart, mastery-by-module bar chart, words-mastered vs in-progress, session count, date-range selector.
- **Buttons:** date-range picker, module filter, `Export PDF` (🟡).
- **States:** real empty state for brand-new child, all charts from real endpoints only.

### J12 — Child home / program select 🟢
- **Elements:** big friendly Mitra greeting, list of assigned programs as large picture cards.
- **Buttons:** large program tiles (`Start`), `Settings`/`Back` (parent-gated), calm visuals only.

### J13 — Child practice session (the core screen — mimic-first, per PART L) 🟢
- **Elements:** 3D Mitra (center/side), target image, optional target word text, progress bar + "item X of N", waveform visual during recording, a small "Mitra is mimicking you!" indicator during mimic playback, score feedback (visual, positive-only, appears only after Track B resolves).
- **Buttons:** `▶ Hear it` (Mitra speaks target via TTS — Mitra's own voice, F12) · big `● Record` / `■ Stop` (toggles) · `↻ Try again` · `→ Next` (appears after Track B settles) · `Pause`/exit (parent-gated, since a parent is expected to be present per Decision 0.10).
- **Flow/states (per PART L §L.2):** idle → `Hear it` (Mitra speaks target) → `Record` (waveform + Mitra listening) → tap `Stop` → **instantly**: Mitra enters `mimic-playback` (plays back the child's own pitch-shifted voice, mouth animating) **while, in parallel and invisibly to the child, the recording uploads for real Tamil-ASR scoring** → Mitra drops to a gentle `thinking` idle loop only if scoring hasn't finished yet → once the real score arrives, Mitra transitions to `celebrating`/`gently-correcting` (+ optional TTS encouragement) → `Try again` or `Next`. The mimicry step never waits on the network; the score step never fakes or skips the model. Honors reduce_motion + mute-sudden-sounds throughout.

### J14 — Session summary / rewards 🟢
- **Elements:** stats (words tried, avg score, best word), gentle star/confetti reward (reduce-motion aware), Mitra congratulating.
- **Buttons:** `Play again`, `Done` (→ child home). Stats refetched from API.

### J15 — Settings (all roles) 🟢
- **Tabs:** Account (name, email, `Change password`), Accessibility (Reduce motion, Mute sudden sounds, Font size — for child stored in sensory_prefs), Notifications (toggles, email on/off).
- **Buttons:** `Save` per tab, `Log out`.
- **Acceptance:** child accessibility settings actually change the practice session behavior.

### J16 — Messaging 🟡
- **Elements:** thread list (left), message pane (right), message bubbles with timestamps.
- **Buttons:** thread select, message input + `Send`, new-message indicator. Real-time via WebSocket.

### J17 — Notifications 🟡
- **Elements:** bell icon + unread badge, dropdown list (type, text, time).
- **Buttons:** notification item (→ deep link), `Mark all read`.

### J18 — Admin panel 🟡
- **Screens/elements:** Users table (search/filter, `Deactivate`/`Activate`), content moderation (module review, `Approve`/`Hide`), system health cards (DB size, active sessions today, error rate), audit-log table (actor, action, entity, time).
- **All behind admin-only guard.**

---

# PART K — DAY-BY-DAY PLAN (26 weeks, ~5 working days/week)

Adjust to your real calendar. Each day = one focused block. "Verify" always means: run the acceptance criteria yourself, not just trust the agent. Commit at the end of each day.

### Week 1 — Decisions & scaffolding
- **D1:** Fill `DECISIONS.md` (0.1–0.9). Create `PROGRESS.md`. Init git + branch protection.
- **D2:** F1 — scaffold monorepo + Docker (backend, frontend, infra).
- **D3:** F1 — health endpoint (real DB+Redis ping) + `/health` page; verify `docker compose up`.
- **D4:** F1 — SQLAlchemy async + Alembic wiring; first empty migration.
- **D5:** F1 — GitHub Actions CI (lint, typecheck, migration job); README; verify CI green on a PR.

### Week 2 — Database & seed
- **D6:** F2 — models for users + all profile tables + children.
- **D7:** F2 — models for modules, module_items, assigned_programs.
- **D8:** F2 — models for sessions, session_attempts, progress_snapshots, notes, messages, notifications, audit_log; FKs + indexes.
- **D9:** F2 — generate + apply Alembic migration; fix schema issues.
- **D10:** F2 — `seed.py` (users, children, 3 Tamil modules ×items, ~30 sessions); run + verify row counts via SQL.

### Week 3 — Auth backend
- **D11:** F3 — register + password hashing + validation.
- **D12:** F3 — login (access+refresh JWT).
- **D13:** F3 — refresh + logout (Redis blocklist).
- **D14:** F3 — `require_role()` + protect a test endpoint; auth pytest.
- **D15:** F4 — `/api/children` CRUD scoped to parent; test a parent can't read another parent's children.

### Week 4 — Auth frontend
- **D16:** F5 — login page + React Query + cookie handling.
- **D17:** F5 — register page + validation + role select.
- **D18:** F5 — route guards/middleware by role.
- **D19:** F4 — child profile-picker UI (real data tiles) + `Add child` form.
- **D20:** F4/F5 — end-to-end: therapist login → dashboard; parent login → profile picker → select child; verify; polish error/loading states.

### Week 5 — Therapist screens
- **D21:** F6 — `/api/therapist/children` with computed last-session summary.
- **D22:** F6 — therapist dashboard UI (cards, stats, nav, bell).
- **D23:** F7 — child-detail endpoint + page (profile, programs, sessions).
- **D24:** F7 — notes (POST + history panel).
- **D25:** Buffer/verify Phase 2 therapist side; fix bugs; commit milestone.

### Week 6 — Parent screens + content backend
- **D26:** F8 — `/api/parent/children` + parent dashboard UI.
- **D27:** F8 — child progress endpoint + basic chart wiring (placeholder-free, real data).
- **D28:** F9 — modules CRUD backend.
- **D29:** F9 — module_items CRUD + order_index.
- **D30:** F9 — presigned upload (R2/S3) for item images.

### Week 7 — Content builder UI + assignment
- **D31:** F9 — module list UI (list, new, edit, publish toggle).
- **D32:** F9 — module editor UI (item rows, image upload/preview).
- **D33:** F9 — drag-reorder persisted; verify across refresh.
- **D34:** F10 — assign-program backend + status.
- **D35:** F10 — assign modal UI; verify assignment appears for child; Phase 2 done.

### Week 8 — ASR/TTS spike (🔴)
- **D36:** F11/3.0 — record/generate 10 real Tamil samples; set up eval harness.
- **D37:** 3.0 — run ASR candidate A (e.g. IndicConformer/IndicWhisper); measure accuracy+latency.
- **D38:** 3.0 — run ASR candidate B (e.g. Whisper medium); compare; pick + document.
- **D39:** 3.0 — run TTS candidates; pick + document in DECISIONS.md.
- **D40:** Buffer — resolve compute/GPU/hosting for chosen models.

### Week 9 — ASR pipeline
- **D41:** F11 — Celery task running chosen Tamil ASR → real transcript.
- **D42:** F11 — port scoring logic from `speech_evaluator.py`, swap in Tamil model.
- **D43:** F11 — phoneme similarity scoring (panphon+Levenshtein or alignment).
- **D44:** F11 — `POST /api/sessions/{id}/attempts` (upload → Celery → poll → store).
- **D45:** F11 — test 5 real samples; confirm correct→high / wrong→low; verify no English model.

### Week 10 — Scoring hardening + TTS
- **D46:** F11 — tune scoring bands + edge cases (silence, noise, empty).
- **D47:** F12 — `/api/tts/generate` + R2 cache by text-hash.
- **D48:** F12 — regenerate seeded reference audio with real TTS.
- **D49:** F12 — score-band → encouraging Tamil template → TTS URL.
- **D50:** F12 — write + review 8–10 positive Tamil templates; verify cache hits.

### Week 11 — Speech-core integration buffer
- **D51:** Integrate ASR+TTS behind the attempt flow; smoke test.
- **D52:** Latency/UX pass (polling, spinners, timeouts).
- **D53:** Write pytest for scoring + TTS caching.
- **D54:** Bug-fix from real-audio testing.
- **D55:** Phase 3 sign-off; commit; update PROGRESS.md.

### Week 12 — 🟠 Talking-Tom mimicry engine + 3D Mitra
- **D56:** F13.5/Step 4.0 — capture buffer + Web Audio pitch-shift playback (playbackRate/detune); verify it sounds right and fires with no network dependency.
- **D57:** F13.5/Step 4.0 — amplitude-driven lip-sync (AnalyserNode → mouth scale); wire the mimic playback to fire the Track-B upload in parallel (not sequentially).
- **D58:** F13 — source/import licensed rigged GLB; render in R3F; states idle + listening.
- **D59:** F13 — add the new `mimic-playback` state + thinking + celebrating + gently-correcting; wire full state machine per PART L §L.6.
- **D60:** F13/F13.5 — reduce_motion fallback; lazy-load bundle; 60fps check; test with a mocked slow/failing network (mimicry still instant, scoring still eventually resolves or gracefully falls back).

### Week 13 — Child practice flow (mimic-first)
- **D61:** F14 — child home + program select (real assigned programs for the selected child profile).
- **D62:** F14 — practice screen layout (image, Mitra, progress bar, buttons, "Mitra is mimicking you!" indicator).
- **D63:** F14 — `Hear it` (TTS) + `Record`/`Stop` + waveform.
- **D64:** F14 — on stop: fire mimic playback (instant) + attempt upload (parallel, real Tamil ASR scoring) — verify neither blocks the other.
- **D65:** F14 — Mitra reacts on real score arrival (celebrate/correct + TTS); persist attempt (incl. `mimic_played`) + update session; `Try again`/`Next`.

### Week 14 — Session summary + integration
- **D66:** F15 — summary screen (real stats, refetched).
- **D67:** F15 — rewards (stars/confetti, reduce-motion aware) + `Play again`/`Done`.
- **D68:** F20 — settings (accessibility) affecting the session; sensory_prefs wired.
- **D69:** Integration: full loop therapist→child→parent; fix top bugs.
- **D70:** Verify dashboards reflect new real sessions instantly.

### Week 15 — ★ MVP MILESTONE
- **D71:** Feature freeze; end-to-end rehearsal run #1.
- **D72:** Fix highest-priority bugs from rehearsal.
- **D73:** Record backup demo screen capture.
- **D74:** Rehearsal run #2; polish calm-UI details.
- **D75:** Mid-project demo; write down feedback; **MVP demo-ready**.

### Week 16 — Analytics engine
- **D76:** F16 — progress_snapshots computation logic.
- **D77:** F16 — Celery beat nightly + on-demand trigger.
- **D78:** F16 — timeseries + by-module endpoints.
- **D79:** F16 — therapist analytics overview endpoint.
- **D80:** F16 — recharts wired to real endpoints (both dashboards).

### Week 17 — Charts polish + PDF
- **D81:** F16 — chart empty states + date filters.
- **D82:** F17 — PDF export backend (WeasyPrint/headless-Chrome).
- **D83:** F17 — `Export PDF` button + date range; verify real numbers.
- **D84:** Analytics verification vs raw DB.
- **D85:** Buffer/bug-fix; Phase 5 sign-off.

### Week 18 — 🟡 Messaging & notifications (cut first if behind)
- **D86:** F18 — messages/threads backend + WebSocket.
- **D87:** F18 — messaging UI (threads, bubbles, send).
- **D88:** F19 — notifications table + endpoints + triggers.
- **D89:** F19 — bell UI + unread counts + mark-read.
- **D90:** F19 — email (Resend/SendGrid sandbox) + settings toggle; verify.

### Weeks 19–22 — 🟡 Flutter (only if MVP deployed & stable)
- **D91–95 (Wk19):** F21 — scaffold Flutter; auth (adult + child PIN); secure storage; dio.
- **D96–100 (Wk20):** F21 — therapist + parent dashboards native; verify data parity with web.
- **D101–105 (Wk21):** F22 — practice flow (record, upload, Mitra, TTS); mobile-3D decision + fallback.
- **D106–110 (Wk22):** F22 — mic permissions, offline queue+retry, iOS audio session; verify mobile session on web; Flutter CI.

### Week 23 — 🟡 Admin panel
- **D111:** F23 — admin endpoints (users, moderation, health, audit).
- **D112:** F23 — user management UI (search/filter/deactivate).
- **D113:** F23 — content moderation UI.
- **D114:** F23 — system-health cards (real metrics).
- **D115:** F23 — audit-log viewer; verify admin-only guard.

### Week 24 — Security + accessibility
- **D116:** F24 — rate-limit auth; sanitize uploads; CSRF; HTTPS cookies.
- **D117:** F24 — automated tests proving child JWT scoping; bucket least-privilege.
- **D118:** F24 — a11y: keyboard nav + screen-reader labels.
- **D119:** F24 — contrast check + reduce-motion verified end-to-end.
- **D120:** Privacy: consent flow at child creation + written retention policy.

### Week 25 — QA / test suite
- **D121:** F24 — backend pytest (auth, scoring, session flow).
- **D122:** F24 — frontend integration (Playwright/Cypress) main flows.
- **D123:** F24 — Flutter tests (if Phase 7 done).
- **D124:** Fix everything found; do not disable failing tests.
- **D125:** Full regression pass; CI fully green.

### Week 26 — Deploy & finalize
- **D126:** F25 — provision prod (backend+worker+managed PG+Redis+R2); secrets; staging vs prod.
- **D127:** F25 — deploy frontend (Vercel); CORS; confirm seeded demo on live URL.
- **D128:** F25 — deploy docs + rollback procedure; (TestFlight/internal build if Flutter done).
- **D129:** F25 — final audit vs Part B; remove ALL mock data; write demo script.
- **D130:** Final rehearsal on live URL; backup capture; **project done**.

> **Slip protocol:** if any phase runs long, absorb from that phase's buffer day first; if still behind, cut the next 🟡 feature (order: Flutter → Admin → Messaging → PDF). Never cut Phases 0–4, Week 15, Phase 9, or Week 26.

---

---

# PART L — CORE FEATURE DEEP DIVE: TALKING-TOM MIRRORING + PARALLEL MODEL SCORING

**Read this whole part before starting Phase 3 or Phase 4.** This is the "main thing" you asked for — Mitra behaves like Talking Tom (instant, playful voice mimicry) *and* every attempt is still properly analyzed and scored by the Tamil ASR model for the real dashboards. These are two separate systems sharing one audio clip. Do not merge them into one pipeline — that's the mistake that would make the app either laggy (if mimicry waits for the model) or clinically useless (if the score is faked/skipped).

### L.1 Why two tracks, not one

| | Track A — Mimicry (engagement) | Track B — Model analysis (clinical signal) |
|---|---|---|
| **Purpose** | Make the child want to keep talking to Mitra — instant, funny, rewarding, exactly like Talking Tom | Produce the real 0–100 pronunciation score that therapists/parents rely on |
| **Where it runs** | 100% client-side (browser) | Server-side: Celery task + the chosen Tamil ASR model (Decision 0.4) |
| **Latency budget** | Must feel instant — under ~150ms from "stop recording" to "Mitra starts mimicking" | Seconds are fine — it's happening in the background while the child is still delighted by the mimicry |
| **Input** | The raw recorded audio buffer (in-browser, before upload even finishes) | The uploaded audio file, via `POST /api/sessions/{id}/attempts` |
| **Output** | A pitch-shifted playback of the child's own voice + a lip-sync animation | `asr_transcript`, `similarity_score`, `phoneme_accuracy` stored in `session_attempts` |
| **Failure mode if skipped/faked** | App feels flat/boring — defeats the point of an autism-engagement companion | Dashboards, progress, and the whole academic/clinical value of the project break |
| **Never let one block the other.** | Mimicry does not wait for the network. | Scoring is never derived from or replaced by the mimicry playback. |

### L.2 Sequence of events on one practice item

```
Child taps ● Record
   │
   ├─ Mic captures audio into an in-memory buffer (MediaRecorder / AudioContext)
   │
Child taps ■ Stop
   │
   ├──────────────► TRACK A (client, instant, ~0-150ms)
   │                 1. Decode the just-recorded buffer with Web Audio API
   │                 2. Play it back through an AudioBufferSourceNode with
   │                    playbackRate/detune shifted up (Talking-Tom voice)
   │                 3. Drive Mitra's mouth-scale from an AnalyserNode reading
   │                    of *that same playback* in real time (cheap lip-sync)
   │                 4. Mitra state: "mimic-playback" (a new explicit state,
   │                    distinct from "celebrating"/"correcting")
   │
   └──────────────► TRACK B (server, async, ~1-5s depending on model)
                     1. Upload the same recorded audio to
                        POST /api/sessions/{id}/attempts
                     2. Celery task: Tamil ASR → transcript + confidence
                     3. Phoneme similarity vs target_word → 0-100 score
                     4. Store in session_attempts; frontend polls or gets
                        a WebSocket push when ready
   │
   ├─ While Track A plays (and shortly after, if Track B is still running),
   │  Mitra is in a gentle "thinking" idle loop — NOT blocking anything,
   │  just visually "considering" while Track B finishes.
   │
   └─ When Track B resolves: Mitra transitions to celebrating (high score)
      or gently-correcting (low score), optionally speaking a fixed TTS
      encouragement phrase (this is Mitra's OWN voice — separate from the
      Track-A mimicry, which is always the CHILD's own voice, pitch-shifted).
```

**Key rule:** if Track B is slow or fails, Track A has *already* given the child a satisfying, instant reaction. The session is never "waiting on the model" from the child's point of view — worst case, the celebrating/correcting step is simply delayed or (on a hard failure) quietly skipped with a neutral "nice try!" default, logged for the therapist to see later, never surfaced as an error to the child.

### L.3 Technical approach — Track A (mimicry)

- **Capture:** use the existing `MediaRecorder`/`useAudioRecorder` hook (already present in the salvaged SpeakEasy frontend) to get a `Blob`; also decode it into an `AudioBuffer` via `AudioContext.decodeAudioData()` for playback manipulation.
- **Pitch/voice shift (MVP, first pass):** create an `AudioBufferSourceNode`, set `.playbackRate.value` (and/or `.detune`) higher than 1.0 (e.g. 1.3–1.6x) for the classic Talking-Tom "helium" effect. This is trivial, has zero dependencies, and is a faithful recreation of the reference app's effect.
- **Pitch shift (upgrade, if ahead of schedule):** integrate a formant-preserving pitch shifter (e.g. `soundtouchjs`, run as an `AudioWorkletProcessor`) so pitch changes independent of speed — sounds more natural/less "chipmunk," still playful. Not required for MVP; do not spend time here until the MVP milestone (Week 15) is done.
- **Lip-sync:** attach an `AnalyserNode` to the mimic-playback chain, read `getByteFrequencyData`/amplitude on an animation-frame loop, map the amplitude to Mitra's mouth-open morph target / scale. This is *amplitude-driven*, not phoneme-driven — good enough for a friendly, alive-feeling reaction, and far simpler than real viseme mapping.
- **No server round-trip for Track A at all.** If the browser can't do Web Audio API pitch-shifting for some reason (very old browser), fall back to plain unmodified playback rather than skipping the mimicry — the child should always hear *something* echoed back.

### L.4 Technical approach — Track B (model analysis, unchanged from Phase 3)

This is exactly Steps 3.0/3.1 from Part D / Feature F11 already in this plan — the Tamil ASR + phoneme-similarity scoring pipeline. **Nothing about Track B changes because of the mimicry feature.** The only new requirement: the attempt-upload call (`POST /api/sessions/{id}/attempts`) must be fired **immediately when recording stops, in parallel with Track A starting playback** — not after Track A finishes. Do this with a simple `fetch()`/mutation kicked off alongside (not awaited before) the mimicry playback call.

### L.5 New/changed data model fields

- `session_attempts.mimic_played` (boolean, default true once Track A completes) — lets you prove in a demo/report that the mimicry ran even if scoring is still catching up.
- No new table needed. `similarity_score`, `asr_transcript`, `phoneme_accuracy` continue to be Track B's real output, exactly as in the original schema (PROJECT_PLAN.md §3 / this plan's Part A).
- `mitra_response_type` (already in schema) now has a richer set of values: `mimic` (Track A, always fires), then one of `celebrate` / `gentle_correct` / `neutral_fallback` (Track B outcome, fires after).

### L.6 Updated Mitra animation state machine (replaces the simple 5-state list elsewhere in this plan)

`idle → listening (recording) → mimic-playback (Track A, instant) → thinking (waiting on Track B, if not yet done) → celebrating | gently-correcting | neutral-fallback (Track B result)`

The **only new state** is `mimic-playback` — a distinct, energetic "Mitra is mimicking you" animation (e.g. mouth moving in sync with the amplitude envelope, playful bounce), separate from the calmer "listening" state that plays while the mic is actively recording.

### L.7 Exact agent prompt — build this as its own step (insert as Step 4.0, before Step 4.1 in Part D)

> Read `implementation_plan.md` PART L in full before writing any code. Implement the Track-A Talking-Tom mimicry pipeline client-side: on recording stop, decode the recorded audio buffer with the Web Audio API, play it back through an `AudioBufferSourceNode` with `playbackRate`/`detune` shifted up for a Talking-Tom-style voice effect, and drive `<MitraCompanion/>`'s mouth-open scale from an `AnalyserNode` reading of that playback in real time. Add a new explicit Mitra animation state `mimic-playback` distinct from `listening`/`celebrating`/`gently-correcting`. Simultaneously (not sequentially) fire the existing attempt-upload call so Track B (Tamil ASR + scoring) starts in parallel — do not await Track A before starting the Track-B upload. Add a `thinking` idle loop that plays if Track B hasn't resolved by the time Track A's playback finishes. When Track B resolves, transition to `celebrating`/`gently-correcting` per the real score (or a `neutral_fallback` state, logged but not shown as an error, if Track B fails). Add `mimic_played` to `session_attempts`. Write a test confirming Track A completes and plays without waiting on the network, using a mocked slow/failing Track-B response.

### L.8 Acceptance criteria for this feature

- Stopping a recording produces an audible, pitch-shifted echo of the child's own voice **within ~150ms**, regardless of network speed.
- The 3D Mitra's mouth visibly moves in time with the mimic playback.
- The real Tamil ASR + scoring pipeline (Track B) still runs on every attempt and still populates `session_attempts`/dashboards correctly — verify by checking the DB row after a session, independent of what the child heard.
- Killing/throttling the network does not delay or break the mimicry; it only delays (or gracefully skips, with a neutral fallback) the celebrating/correcting reaction.
- A parent/therapist reviewing a session afterward can see the real score — the mimicry was never a substitute for actual analysis.

---

*End of plan. Re-read Part B (the MVP cut line), Part I (feature table), and PART L (mimicry + scoring) before every session.*
