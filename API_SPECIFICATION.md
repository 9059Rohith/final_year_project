# SpeakEasy — Complete API Specification

Auto-generated from the live FastAPI app. **Total endpoints: 300** across **54 modules**.

Base URL: `/api` · Auth: JWT Bearer · DB: MongoDB · Admin (super): rajuchaswik@gmail.com

| # | Module | Method | Endpoint | Purpose | Backend | Web (api.js) | Android |
|---|--------|--------|----------|---------|---------|--------------|---------|
| 1 | activity | GET | `/api/activity` | Unified activity feed for the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 2 | activity | GET | `/api/activity/{user_id}` | Activity feed for a specific user (self, or admin/therapist). | ✅ Done | ✅ Wired | ⬜ Pending |
| 3 | activity | GET | `/api/activity/summary/today` | Counts of today's activity by type. | ✅ Done | ✅ Wired | ⬜ Pending |
| 4 | admin | GET | `/api/admin/users` | Get paginated list of users. | ✅ Done | ✅ Wired | ⬜ Pending |
| 5 | admin | GET | `/api/admin/users/{user_id}` | Get detailed user information. | ✅ Done | ✅ Wired | ⬜ Pending |
| 6 | admin | DELETE | `/api/admin/users/{user_id}` | Delete a user and all their data. | ✅ Done | ✅ Wired | ⬜ Pending |
| 7 | admin | GET | `/api/admin/stats` | Get overall platform statistics. | ✅ Done | ✅ Wired | ⬜ Pending |
| 8 | admin | GET | `/api/admin/export/csv` | Export all user data as CSV. | ✅ Done | ✅ Wired | ⬜ Pending |
| 9 | admin-ext | GET | `/api/admin/dashboard` | One-call rollup powering the admin dashboard tiles + charts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 10 | admin-ext | GET | `/api/admin/metrics/engagement` | DAU/WAU-style engagement, content counts and gamification totals. | ✅ Done | ✅ Wired | ⬜ Pending |
| 11 | admin-ext | GET | `/api/admin/all-users` | List users of any role (base admin router only lists role=user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 12 | admin-ext | POST | `/api/admin/users` | Admin: create a user/therapist/admin account. | ✅ Done | ✅ Wired | ⬜ Pending |
| 13 | admin-ext | PATCH | `/api/admin/users/{user_id}/edit` | Admin: edit a user's profile fields. | ✅ Done | ✅ Wired | ⬜ Pending |
| 14 | admin-ext | PATCH | `/api/admin/users/{user_id}/role` | Admin: change a user's role. | ✅ Done | ✅ Wired | ⬜ Pending |
| 15 | admin-ext | POST | `/api/admin/users/{user_id}/block` | Admin: block a user (blocks login). | ✅ Done | ✅ Wired | ⬜ Pending |
| 16 | admin-ext | POST | `/api/admin/users/{user_id}/unblock` | Admin: unblock a user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 17 | admin-ext | POST | `/api/admin/users/{user_id}/reset-password` | Admin: force-set a user's password. | ✅ Done | ✅ Wired | ⬜ Pending |
| 18 | admin-ext | GET | `/api/admin/audit` | Filtered, paginated audit log. | ✅ Done | ✅ Wired | ⬜ Pending |
| 19 | admin-ext | GET | `/api/admin/audit/actions` | Distinct action names for the audit filter dropdown. | ✅ Done | ✅ Wired | ⬜ Pending |
| 20 | admin-ext | GET | `/api/admin/audit/export` | Export the audit log as CSV. | ✅ Done | ✅ Wired | ⬜ Pending |
| 21 | admin-ext | GET | `/api/admin/collections` | List browsable collections with document counts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 22 | admin-ext | GET | `/api/admin/collections/{name}` | Browse documents of a whitelisted collection. | ✅ Done | ✅ Wired | ⬜ Pending |
| 23 | admin-ext | DELETE | `/api/admin/collections/{name}/{doc_id}` | Delete one document from a whitelisted collection. | ✅ Done | ✅ Wired | ⬜ Pending |
| 24 | admin-ext | GET | `/api/admin/system/health` | DB ping + collection sizes for an admin system panel. | ✅ Done | ✅ Wired | ⬜ Pending |
| 25 | analysis | GET | `/api/analysis/{user_id}` | Return speech analytics for a user, computed from stored evaluations. | ✅ Done | ✅ Wired | ⬜ Pending |
| 26 | analysis-ext | GET | `/api/analysis/phoneme/{user_id}/{phoneme}` | Trend + averages for a single phoneme. | ✅ Done | ✅ Wired | ⬜ Pending |
| 27 | analysis-ext | GET | `/api/analysis/recommendations/{user_id}` | Rank phonemes by weakness and suggest what to practise next. | ✅ Done | ✅ Wired | ⬜ Pending |
| 28 | analysis-ext | GET | `/api/analysis/consistency/{user_id}` | Practice consistency over the last 30 days (active days, gaps). | ✅ Done | ✅ Wired | ⬜ Pending |
| 29 | analysis-ext | GET | `/api/analysis/skill-radar/{user_id}` | Radar-chart data: average of each sub-metric (clarity, match, airflow). | ✅ Done | ✅ Wired | ⬜ Pending |
| 30 | announcements | GET | `/api/announcements` | Public (authenticated) feed of published announcements, pinned first. | ✅ Done | ✅ Wired | ⬜ Pending |
| 31 | announcements | GET | `/api/announcements/banner` | Return the single most relevant pinned/live announcement for a banner. | ✅ Done | ✅ Wired | ⬜ Pending |
| 32 | announcements | GET | `/api/announcements/{announcement_id}` | Read a single announcement and bump its view counter. | ✅ Done | ✅ Wired | ⬜ Pending |
| 33 | announcements | POST | `/api/announcements/admin` | Admin: create an announcement. | ✅ Done | ✅ Wired | ⬜ Pending |
| 34 | announcements | GET | `/api/announcements/admin/all` | Admin: list all announcements incl. drafts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 35 | announcements | PATCH | `/api/announcements/admin/{announcement_id}` | Admin: update an announcement. | ✅ Done | ✅ Wired | ⬜ Pending |
| 36 | announcements | DELETE | `/api/announcements/admin/{announcement_id}` | Admin: delete an announcement. | ✅ Done | ✅ Wired | ⬜ Pending |
| 37 | appointments | POST | `/api/appointments` | Book an appointment with a therapist. | ✅ Done | ✅ Wired | ⬜ Pending |
| 38 | appointments | GET | `/api/appointments` | List the caller's appointments (as parent or therapist). | ✅ Done | ✅ Wired | ⬜ Pending |
| 39 | appointments | GET | `/api/appointments/available-therapists` | List therapists a parent can book with. | ✅ Done | ✅ Wired | ⬜ Pending |
| 40 | appointments | GET | `/api/appointments/{appointment_id}` | Fetch a single appointment (participants only). | ✅ Done | ✅ Wired | ⬜ Pending |
| 41 | appointments | PATCH | `/api/appointments/{appointment_id}/reschedule` | Reschedule an appointment to a new time. | ✅ Done | ✅ Wired | ⬜ Pending |
| 42 | appointments | PATCH | `/api/appointments/{appointment_id}/status` | Confirm / complete / cancel / mark no-show. | ✅ Done | ✅ Wired | ⬜ Pending |
| 43 | appointments | DELETE | `/api/appointments/{appointment_id}` | Cancel (soft — sets status=cancelled) an appointment. | ✅ Done | ✅ Wired | ⬜ Pending |
| 44 | appointments | GET | `/api/appointments/admin/all` | Admin: list every appointment. | ✅ Done | ✅ Wired | ⬜ Pending |
| 45 | assessment | GET | `/api/assessment` | List available quizzes (answer keys hidden). | ✅ Done | ✅ Wired | ⬜ Pending |
| 46 | assessment | GET | `/api/assessment/{quiz_slug}` | Fetch a quiz to take (answer keys stripped). | ✅ Done | ✅ Wired | ⬜ Pending |
| 47 | assessment | POST | `/api/assessment/submit` | Score an attempt server-side, store it and award coins on a pass. | ✅ Done | ✅ Wired | ⬜ Pending |
| 48 | assessment | GET | `/api/assessment/attempts/history` | Paginated history of the caller's quiz attempts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 49 | assessment | GET | `/api/assessment/attempts/best` | Best score per quiz for the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 50 | assessment | POST | `/api/assessment/admin` | Therapist/Admin: author a quiz (with answer keys). | ✅ Done | ✅ Wired | ⬜ Pending |
| 51 | assessment | PATCH | `/api/assessment/admin/{quiz_slug}` | Therapist/Admin: update a quiz. | ✅ Done | ✅ Wired | ⬜ Pending |
| 52 | assessment | DELETE | `/api/assessment/admin/{quiz_slug}` | Admin: delete a quiz. | ✅ Done | ✅ Wired | ⬜ Pending |
| 53 | auth | POST | `/api/auth/register` | Register new user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 54 | auth | POST | `/api/auth/login` | Login user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 55 | auth | POST | `/api/auth/admin/login` | Admin login. | ✅ Done | ✅ Wired | ⬜ Pending |
| 56 | auth | POST | `/api/auth/logout` | Logout user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 57 | auth | POST | `/api/auth/change-password` | Change the current user's password. | ✅ Done | ✅ Wired | ⬜ Pending |
| 58 | auth | GET | `/api/auth/me` | Get current user info. | ✅ Done | ✅ Wired | ⬜ Pending |
| 59 | auth | POST | `/api/auth/forgot-password` | Issue a 6-digit OTP for password reset (valid 10 minutes). | ✅ Done | ✅ Wired | ⬜ Pending |
| 60 | auth | POST | `/api/auth/verify-otp` | Verify an OTP without consuming it (used by the verify screen). | ✅ Done | ✅ Wired | ⬜ Pending |
| 61 | auth | POST | `/api/auth/reset-password` | Consume the OTP and set a new password. | ✅ Done | ✅ Wired | ⬜ Pending |
| 62 | auth | POST | `/api/auth/verify-email/request` | Send an email-verification OTP for the current user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 63 | auth | POST | `/api/auth/verify-email/confirm` | Confirm the email-verification OTP and flag the account verified. | ✅ Done | ✅ Wired | ⬜ Pending |
| 64 | auth | POST | `/api/auth/refresh` | Issue a fresh access token for an already-authenticated user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 65 | auth | GET | `/api/auth/sessions` | List recorded login sessions for this account. | ✅ Done | ✅ Wired | ⬜ Pending |
| 66 | auth | DELETE | `/api/auth/sessions/{session_id}` | Revoke a specific session record. | ✅ Done | ✅ Wired | ⬜ Pending |
| 67 | badges | GET | `/api/badges` | List all badges with unlocked/claimed state and progress for the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 68 | badges | POST | `/api/badges/{badge_slug}/claim` | Claim an unlocked badge's coin reward (once). | ✅ Done | ✅ Wired | ⬜ Pending |
| 69 | badges | GET | `/api/badges/claimed` | List the caller's claimed badges. | ✅ Done | ✅ Wired | ⬜ Pending |
| 70 | badges | POST | `/api/badges/admin` | Admin: define a custom badge. | ✅ Done | ✅ Wired | ⬜ Pending |
| 71 | badges | DELETE | `/api/badges/admin/{badge_slug}` | Admin: delete a custom badge. | ✅ Done | ✅ Wired | ⬜ Pending |
| 72 | billing | GET | `/api/billing/plans` | List available plans (seeds defaults on first call). | ✅ Done | ✅ Wired | ⬜ Pending |
| 73 | billing | GET | `/api/billing/subscription` | Return the caller's active subscription (or the implicit free plan). | ✅ Done | ✅ Wired | ⬜ Pending |
| 74 | billing | POST | `/api/billing/subscribe` | Subscribe to a plan (records subscription + an invoice). | ✅ Done | ✅ Wired | ⬜ Pending |
| 75 | billing | POST | `/api/billing/cancel` | Cancel the active subscription. | ✅ Done | ✅ Wired | ⬜ Pending |
| 76 | billing | GET | `/api/billing/invoices` | Paginated invoice history. | ✅ Done | ✅ Wired | ⬜ Pending |
| 77 | billing | GET | `/api/billing/invoices/{invoice_id}` | Fetch a single invoice. | ✅ Done | ✅ Wired | ⬜ Pending |
| 78 | billing | POST | `/api/billing/plans/admin` | Admin: create a plan. | ✅ Done | ✅ Wired | ⬜ Pending |
| 79 | billing | GET | `/api/billing/admin/revenue` | Admin: total revenue, active subscriptions and MRR. | ✅ Done | ✅ Wired | ⬜ Pending |
| 80 | bookmarks | POST | `/api/bookmarks` | Add a bookmark (dedup per user+target). | ✅ Done | ✅ Wired | ⬜ Pending |
| 81 | bookmarks | GET | `/api/bookmarks` | List the caller's bookmarks. | ✅ Done | ✅ Wired | ⬜ Pending |
| 82 | bookmarks | DELETE | `/api/bookmarks/{bookmark_id}` | Remove a bookmark. | ✅ Done | ✅ Wired | ⬜ Pending |
| 83 | calendar | POST | `/api/calendar/events` | Create a calendar event. | ✅ Done | ✅ Wired | ⬜ Pending |
| 84 | calendar | GET | `/api/calendar/events` | List events (and optionally appointments) in a date window. | ✅ Done | ✅ Wired | ⬜ Pending |
| 85 | calendar | GET | `/api/calendar/upcoming` | List events in the next N days (drives the dashboard 'upcoming' widget). | ✅ Done | ✅ Wired | ⬜ Pending |
| 86 | calendar | PATCH | `/api/calendar/events/{event_id}` | Update an event. | ✅ Done | ✅ Wired | ⬜ Pending |
| 87 | calendar | DELETE | `/api/calendar/events/{event_id}` | Delete an event. | ✅ Done | ✅ Wired | ⬜ Pending |
| 88 | contact | POST | `/api/contact` | Save a contact form submission (public, validated). | ✅ Done | ✅ Wired | ⬜ Pending |
| 89 | contact | GET | `/api/contact` | List all contact submissions (admin only). | ✅ Done | ✅ Wired | ⬜ Pending |
| 90 | contact | PATCH | `/api/contact/{contact_id}/read` | Mark a contact submission as read (admin only). | ✅ Done | ✅ Wired | ⬜ Pending |
| 91 | content | GET | `/api/content` | Published content feed. | ✅ Done | ✅ Wired | ⬜ Pending |
| 92 | content | GET | `/api/content/tags` | Distinct tags across published posts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 93 | content | GET | `/api/content/{post_id}` | Read a post and increment views. | ✅ Done | ✅ Wired | ⬜ Pending |
| 94 | content | POST | `/api/content/{post_id}/like` | Toggle a like on a post. | ✅ Done | ✅ Wired | ⬜ Pending |
| 95 | content | POST | `/api/content/admin` | Admin: create a post. | ✅ Done | ✅ Wired | ⬜ Pending |
| 96 | content | GET | `/api/content/admin/all` | Admin: list all posts incl. drafts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 97 | content | PATCH | `/api/content/admin/{post_id}` | Admin: update a post. | ✅ Done | ✅ Wired | ⬜ Pending |
| 98 | content | DELETE | `/api/content/admin/{post_id}` | Admin: delete a post. | ✅ Done | ✅ Wired | ⬜ Pending |
| 99 | dashboard | GET | `/api/dashboard/home` | Everything the home screen shows, in one payload. | ✅ Done | ✅ Wired | ⬜ Pending |
| 100 | dashboard | GET | `/api/dashboard/quick-stats` | Small stat tiles: 7-day sessions, avg accuracy, lessons completed. | ✅ Done | ✅ Wired | ⬜ Pending |
| 101 | dashboard | GET | `/api/dashboard/leaderboard-preview` | Top-3 global leaderboard preview + the caller's own rank, for the home card. | ✅ Done | ✅ Wired | ⬜ Pending |
| 102 | dashboard | GET | `/api/dashboard/whats-new` | Latest announcement + active challenges count for a 'what's new' card. | ✅ Done | ✅ Wired | ⬜ Pending |
| 103 | devices | POST | `/api/devices/register` | Register or refresh a device push token. | ✅ Done | ✅ Wired | ⬜ Pending |
| 104 | devices | GET | `/api/devices` | List the caller's registered devices. | ✅ Done | ✅ Wired | ⬜ Pending |
| 105 | devices | DELETE | `/api/devices/{device_id}` | Unregister a device (e.g. on logout). | ✅ Done | ✅ Wired | ⬜ Pending |
| 106 | enquiries | POST | `/api/enquiries` | Raise a new enquiry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 107 | enquiries | GET | `/api/enquiries` | List the caller's enquiries. | ✅ Done | ✅ Wired | ⬜ Pending |
| 108 | enquiries | GET | `/api/enquiries/{enquiry_id}` | Fetch one enquiry with its full timeline (owner or admin). | ✅ Done | ✅ Wired | ⬜ Pending |
| 109 | enquiries | GET | `/api/enquiries/admin/all` | Admin: list all enquiries. | ✅ Done | ✅ Wired | ⬜ Pending |
| 110 | enquiries | POST | `/api/enquiries/admin/{enquiry_id}/respond` | Admin: respond and advance the status timeline (notifies the user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 111 | evaluation | POST | `/api/evaluate/speech` | Evaluate speech pronunciation. | ✅ Done | ✅ Wired | ⬜ Pending |
| 112 | feedback | POST | `/api/feedback` | Submit feedback tied to the current user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 113 | feedback | GET | `/api/feedback/mine` | List feedback submitted by the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 114 | feedback | GET | `/api/feedback/summary` | Aggregate rating stats (average, distribution) — used for testimonials. | ✅ Done | ✅ Wired | ⬜ Pending |
| 115 | feedback | GET | `/api/feedback/admin/all` | Admin: list all feedback with filters. | ✅ Done | ✅ Wired | ⬜ Pending |
| 116 | feedback | GET | `/api/feedback/admin/stats` | Admin: counts by status and type. | ✅ Done | ✅ Wired | ⬜ Pending |
| 117 | feedback | PATCH | `/api/feedback/admin/{feedback_id}` | Admin: update status/priority and optionally respond (notifies the user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 118 | feedback | DELETE | `/api/feedback/admin/{feedback_id}` | Admin: delete a feedback entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 119 | games | GET | `/api/games` | List active games (seeds the default catalog on first call). | ✅ Done | ✅ Wired | ⬜ Pending |
| 120 | games | GET | `/api/games/my-scores` | Return the caller's best score per game plus totals. | ✅ Done | ✅ Wired | ⬜ Pending |
| 121 | games | GET | `/api/games/{game_slug}` | Game detail with the caller's personal best. | ✅ Done | ✅ Wired | ⬜ Pending |
| 122 | games | POST | `/api/games/score` | Record a game score and award coins (scaled by score). | ✅ Done | ✅ Wired | ⬜ Pending |
| 123 | games | GET | `/api/games/{game_slug}/leaderboard` | Top scores for a single game (best score per user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 124 | games | POST | `/api/games/admin` | Admin: add a game to the catalog. | ✅ Done | ✅ Wired | ⬜ Pending |
| 125 | games | DELETE | `/api/games/admin/{game_slug}` | Admin: remove a game. | ✅ Done | ✅ Wired | ⬜ Pending |
| 126 | gamification | GET | `/api/achievements/{user_id}` | Return the user's badge catalog with unlock state from real stats. | ✅ Done | ✅ Wired | ⬜ Pending |
| 127 | gamification | GET | `/api/leaderboard` | Top users by total stars. Names only (child name), no contact data. | ✅ Done | ✅ Wired | ⬜ Pending |
| 128 | glossary | GET | `/api/glossary` | List glossary entries (seeds defaults on first call). | ✅ Done | ✅ Wired | ⬜ Pending |
| 129 | glossary | GET | `/api/glossary/search` | Search glossary by term/roman/meaning. | ✅ Done | ✅ Wired | ⬜ Pending |
| 130 | glossary | GET | `/api/glossary/{entry_id}` | Fetch a single glossary entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 131 | glossary | POST | `/api/glossary/admin` | Admin: add a glossary entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 132 | glossary | DELETE | `/api/glossary/admin/{entry_id}` | Admin: delete a glossary entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 133 | goals | POST | `/api/goals` | Create a personal goal. | ✅ Done | ✅ Wired | ⬜ Pending |
| 134 | goals | GET | `/api/goals` | List goals with live progress %. | ✅ Done | ✅ Wired | ⬜ Pending |
| 135 | goals | DELETE | `/api/goals/{goal_id}` | Delete a goal. | ✅ Done | ✅ Wired | ⬜ Pending |
| 136 | goals | GET | `/api/goals/challenges` | List active challenges with the caller's join/complete state. | ✅ Done | ✅ Wired | ⬜ Pending |
| 137 | goals | POST | `/api/goals/challenges/{challenge_id}/join` | Join a challenge. | ✅ Done | ✅ Wired | ⬜ Pending |
| 138 | goals | POST | `/api/goals/challenges/{challenge_id}/claim` | Claim a completed challenge's reward. | ✅ Done | ✅ Wired | ⬜ Pending |
| 139 | goals | POST | `/api/goals/challenges/admin` | Admin: create a challenge. | ✅ Done | ✅ Wired | ⬜ Pending |
| 140 | integrations | POST | `/api/integrations/api-keys` | Admin: issue an API key (returned once in full). | ✅ Done | ✅ Wired | ⬜ Pending |
| 141 | integrations | GET | `/api/integrations/api-keys` | Admin: list API keys (hashes/prefixes only). | ✅ Done | ✅ Wired | ⬜ Pending |
| 142 | integrations | DELETE | `/api/integrations/api-keys/{key_id}` | Admin: revoke an API key. | ✅ Done | ✅ Wired | ⬜ Pending |
| 143 | integrations | GET | `/api/integrations/events` | Admin: list webhook event types. | ✅ Done | ✅ Wired | ⬜ Pending |
| 144 | integrations | POST | `/api/integrations/webhooks` | Admin: register an outbound webhook. | ✅ Done | ✅ Wired | ⬜ Pending |
| 145 | integrations | GET | `/api/integrations/webhooks` | Admin: list webhooks. | ✅ Done | ✅ Wired | ⬜ Pending |
| 146 | integrations | DELETE | `/api/integrations/webhooks/{webhook_id}` | Admin: delete a webhook. | ✅ Done | ✅ Wired | ⬜ Pending |
| 147 | lessons | GET | `/api/lessons/custom` | List active custom lessons (available to all authenticated users). | ✅ Done | ✅ Wired | ⬜ Pending |
| 148 | lessons | GET | `/api/lessons/custom/{lesson_id}` | Fetch a single custom lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 149 | lessons | GET | `/api/lessons/categories` | List lesson categories with lesson counts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 150 | lessons | POST | `/api/lessons/admin` | Therapist/Admin: create a custom lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 151 | lessons | PATCH | `/api/lessons/admin/{lesson_id}` | Therapist/Admin: update a custom lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 152 | lessons | DELETE | `/api/lessons/admin/{lesson_id}` | Admin: delete a custom lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 153 | lessons | POST | `/api/lessons/categories/admin` | Admin: create a lesson category. | ✅ Done | ✅ Wired | ⬜ Pending |
| 154 | lessons | DELETE | `/api/lessons/categories/admin/{category_id}` | Admin: delete a lesson category. | ✅ Done | ✅ Wired | ⬜ Pending |
| 155 | messaging | POST | `/api/messaging/conversations` | Start (or reuse) a conversation. | ✅ Done | ✅ Wired | ⬜ Pending |
| 156 | messaging | GET | `/api/messaging/conversations` | List the caller's conversations, newest activity first. | ✅ Done | ✅ Wired | ⬜ Pending |
| 157 | messaging | GET | `/api/messaging/conversations/{conversation_id}/messages` | Fetch messages in a conversation and mark them read for the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 158 | messaging | POST | `/api/messaging/conversations/{conversation_id}/messages` | Post a message to a conversation. | ✅ Done | ✅ Wired | ⬜ Pending |
| 159 | messaging | GET | `/api/messaging/unread-count` | Total unread messages across the caller's conversations. | ✅ Done | ✅ Wired | ⬜ Pending |
| 160 | messaging | DELETE | `/api/messaging/conversations/{conversation_id}` | Delete a conversation and its messages (participant only). | ✅ Done | ✅ Wired | ⬜ Pending |
| 161 | moderation | POST | `/api/moderation/report` | File a content report. | ✅ Done | ✅ Wired | ⬜ Pending |
| 162 | moderation | GET | `/api/moderation/queue` | Admin: moderation queue. | ✅ Done | ✅ Wired | ⬜ Pending |
| 163 | moderation | GET | `/api/moderation/stats` | Admin: report counts by status and reason. | ✅ Done | ✅ Wired | ⬜ Pending |
| 164 | moderation | PATCH | `/api/moderation/{report_id}` | Admin: action a report. | ✅ Done | ✅ Wired | ⬜ Pending |
| 165 | notifications | GET | `/api/notifications` | List the current user's notifications (paginated, newest first). | ✅ Done | ✅ Wired | ⬜ Pending |
| 166 | notifications | GET | `/api/notifications/unread-count` | Return the unread notification count (drives the bell badge). | ✅ Done | ✅ Wired | ⬜ Pending |
| 167 | notifications | GET | `/api/notifications/{notification_id}` | Fetch a single notification (must belong to the caller). | ✅ Done | ✅ Wired | ⬜ Pending |
| 168 | notifications | PATCH | `/api/notifications/{notification_id}/read` | Mark one notification as read. | ✅ Done | ✅ Wired | ⬜ Pending |
| 169 | notifications | PATCH | `/api/notifications/{notification_id}/unread` | Mark one notification back to unread. | ✅ Done | ✅ Wired | ⬜ Pending |
| 170 | notifications | POST | `/api/notifications/read-all` | Mark every notification for the caller as read. | ✅ Done | ✅ Wired | ⬜ Pending |
| 171 | notifications | DELETE | `/api/notifications/{notification_id}` | Delete one notification. | ✅ Done | ✅ Wired | ⬜ Pending |
| 172 | notifications | DELETE | `/api/notifications` | Clear all of the caller's notifications. | ✅ Done | ✅ Wired | ⬜ Pending |
| 173 | notifications | POST | `/api/notifications/admin/create` | Admin sends a notification to one specific user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 174 | notifications | POST | `/api/notifications/admin/broadcast` | Admin broadcasts a notification to every user of a role (or everyone). | ✅ Done | ✅ Wired | ⬜ Pending |
| 175 | parent | GET | `/api/parent/weekly` | Weekly summary + overall analytics for the current parent's child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 176 | parent-ext | GET | `/api/parent/children` | List children linked to this parent (plus the parent's own child profile). | ✅ Done | ✅ Wired | ⬜ Pending |
| 177 | parent-ext | POST | `/api/parent/children` | Add a child profile under this parent. | ✅ Done | ✅ Wired | ⬜ Pending |
| 178 | parent-ext | DELETE | `/api/parent/children/{child_id}` | Unlink (delete) a child profile owned by this parent. | ✅ Done | ✅ Wired | ⬜ Pending |
| 179 | parent-ext | GET | `/api/parent/monthly/{child_id}` | This-month vs last-month report for a child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 180 | parent-ext | GET | `/api/parent/milestones/{child_id}` | Derived milestone list (first session, 10 sessions, 90%+ accuracy, etc.). | ✅ Done | ✅ Wired | ⬜ Pending |
| 181 | polls | GET | `/api/polls` | List active polls with the caller's vote state and live tallies. | ✅ Done | ✅ Wired | ⬜ Pending |
| 182 | polls | POST | `/api/polls/{poll_id}/vote` | Cast a vote (once per poll). | ✅ Done | ✅ Wired | ⬜ Pending |
| 183 | polls | POST | `/api/polls/admin` | Admin: create a poll. | ✅ Done | ✅ Wired | ⬜ Pending |
| 184 | polls | DELETE | `/api/polls/admin/{poll_id}` | Admin: delete a poll and its votes. | ✅ Done | ✅ Wired | ⬜ Pending |
| 185 | privacy | GET | `/api/privacy/export` | Download all data held about the caller as a JSON file. | ✅ Done | ✅ Wired | ⬜ Pending |
| 186 | privacy | POST | `/api/privacy/delete-request` | Request account deletion (queued for admin processing). | ✅ Done | ✅ Wired | ⬜ Pending |
| 187 | privacy | GET | `/api/privacy/delete-request` | Return the caller's pending deletion request, if any. | ✅ Done | ✅ Wired | ⬜ Pending |
| 188 | privacy | GET | `/api/privacy/admin/delete-requests` | Admin: list account-deletion requests. | ✅ Done | ✅ Wired | ⬜ Pending |
| 189 | privacy | POST | `/api/privacy/admin/delete-requests/{request_id}/process` | Admin: process a deletion request — removes the user and their data. | ✅ Done | ✅ Wired | ⬜ Pending |
| 190 | profile | GET | `/api/profile` | Return the full profile (all tabs) for the current user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 191 | profile | PATCH | `/api/profile/personal` | Update personal identity fields. | ✅ Done | ✅ Wired | ⬜ Pending |
| 192 | profile | PATCH | `/api/profile/child` | Update the child profile fields. | ✅ Done | ✅ Wired | ⬜ Pending |
| 193 | profile | PATCH | `/api/profile/medical` | Update medical details (stored under the 'medical' sub-object). | ✅ Done | ✅ Wired | ⬜ Pending |
| 194 | profile | PATCH | `/api/profile/preferences` | Update learning/reward preferences. | ✅ Done | ✅ Wired | ⬜ Pending |
| 195 | profile | GET | `/api/profile/emergency-contacts` | List emergency contacts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 196 | profile | POST | `/api/profile/emergency-contacts` | Add an emergency contact. | ✅ Done | ✅ Wired | ⬜ Pending |
| 197 | profile | DELETE | `/api/profile/emergency-contacts/{contact_id}` | Remove an emergency contact by its generated id. | ✅ Done | ✅ Wired | ⬜ Pending |
| 198 | profile | POST | `/api/profile/avatar` | Set avatar URL (image upload handled client-side / by storage provider). | ✅ Done | ✅ Wired | ⬜ Pending |
| 199 | progress | POST | `/api/progress/save` | Save therapy session progress. | ✅ Done | ✅ Wired | ⬜ Pending |
| 200 | progress | GET | `/api/progress/user/{user_id}` | Get all progress for a user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 201 | progress | GET | `/api/progress/summary/{user_id}` | Get aggregated progress summary for a user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 202 | progress-ext | GET | `/api/progress/history/{user_id}` | Paginated raw session (evaluation) history for a user. | ✅ Done | ✅ Wired | ⬜ Pending |
| 203 | progress-ext | GET | `/api/progress/lesson/{user_id}/{lesson_id}` | All attempts + best for one lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 204 | progress-ext | GET | `/api/progress/overview/{user_id}` | Compact overview: totals, last-7-day sessions, best lesson, weakest lesson. | ✅ Done | ✅ Wired | ⬜ Pending |
| 205 | progress-ext | GET | `/api/progress/export/{user_id}` | Export a user's session history as CSV. | ✅ Done | ✅ Wired | ⬜ Pending |
| 206 | progress-ext | DELETE | `/api/progress/evaluation/{evaluation_id}` | Delete a single evaluation belonging to the caller (or any, for admin). | ✅ Done | ✅ Wired | ⬜ Pending |
| 207 | referrals | GET | `/api/referrals/my-code` | Return (creating if needed) the caller's referral code + stats. | ✅ Done | ✅ Wired | ⬜ Pending |
| 208 | referrals | POST | `/api/referrals/redeem` | Redeem someone's referral code (once per account). | ✅ Done | ✅ Wired | ⬜ Pending |
| 209 | referrals | GET | `/api/referrals/history` | List who redeemed the caller's code. | ✅ Done | ✅ Wired | ⬜ Pending |
| 210 | referrals | GET | `/api/referrals/leaderboard` | Top referrers by number of successful referrals. | ✅ Done | ✅ Wired | ⬜ Pending |
| 211 | reminders | POST | `/api/reminders` | Create a recurring practice reminder. | ✅ Done | ✅ Wired | ⬜ Pending |
| 212 | reminders | GET | `/api/reminders` | List the caller's reminders. | ✅ Done | ✅ Wired | ⬜ Pending |
| 213 | reminders | PATCH | `/api/reminders/{reminder_id}` | Update a reminder (time, days, enabled). | ✅ Done | ✅ Wired | ⬜ Pending |
| 214 | reminders | DELETE | `/api/reminders/{reminder_id}` | Delete a reminder. | ✅ Done | ✅ Wired | ⬜ Pending |
| 215 | reminders | POST | `/api/reminders/{reminder_id}/fire` | Manually fire a reminder now (drops it into notifications). | ✅ Done | ✅ Wired | ⬜ Pending |
| 216 | reports | GET | `/api/reports/meta` | Available sources and group-by options for the report builder. | ✅ Done | ✅ Wired | ⬜ Pending |
| 217 | reports | POST | `/api/reports/run` | Build and return a report for the current user (no persistence). | ✅ Done | ✅ Wired | ⬜ Pending |
| 218 | reports | POST | `/api/reports/run/{user_id}` | Build a report for a specific user (self, or admin/therapist for others). | ✅ Done | ✅ Wired | ⬜ Pending |
| 219 | reports | POST | `/api/reports/save` | Save a report definition for later re-runs. | ✅ Done | ✅ Wired | ⬜ Pending |
| 220 | reports | GET | `/api/reports/saved` | List the caller's saved report definitions. | ✅ Done | ✅ Wired | ⬜ Pending |
| 221 | reports | DELETE | `/api/reports/saved/{report_id}` | Delete a saved report definition. | ✅ Done | ✅ Wired | ⬜ Pending |
| 222 | reports | POST | `/api/reports/export` | Export a built report as CSV (formula-injection guarded). | ✅ Done | ✅ Wired | ⬜ Pending |
| 223 | reviews | POST | `/api/reviews` | Add or update the caller's review for a content item. | ✅ Done | ✅ Wired | ⬜ Pending |
| 224 | reviews | GET | `/api/reviews/{target_type}/{target_ref}` | List reviews for a content item plus its average rating. | ✅ Done | ✅ Wired | ⬜ Pending |
| 225 | reviews | GET | `/api/reviews/mine/all` | List reviews written by the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 226 | reviews | DELETE | `/api/reviews/{review_id}` | Delete the caller's review. | ✅ Done | ✅ Wired | ⬜ Pending |
| 227 | search | GET | `/api/search` | Mixed-type search across content collections. | ✅ Done | ✅ Wired | ⬜ Pending |
| 228 | search | GET | `/api/search/suggest` | Lightweight title-only suggestions for an autocomplete dropdown. | ✅ Done | ✅ Wired | ⬜ Pending |
| 229 | settings | GET | `/api/settings` | Return the caller's settings (creating defaults on first access). | ✅ Done | ✅ Wired | ⬜ Pending |
| 230 | settings | PUT | `/api/settings` | Patch any subset of settings; nested objects merge field-by-field. | ✅ Done | ✅ Wired | ⬜ Pending |
| 231 | settings | POST | `/api/settings/reset` | Reset the caller's settings back to defaults. | ✅ Done | ✅ Wired | ⬜ Pending |
| 232 | social | POST | `/api/social/friends/request` | Send a friend request by email. | ✅ Done | ✅ Wired | ⬜ Pending |
| 233 | social | GET | `/api/social/friends` | List accepted friends. | ✅ Done | ✅ Wired | ⬜ Pending |
| 234 | social | GET | `/api/social/friends/requests` | List incoming pending friend requests. | ✅ Done | ✅ Wired | ⬜ Pending |
| 235 | social | POST | `/api/social/friends/{friendship_id}/accept` | Accept a pending friend request addressed to the caller. | ✅ Done | ✅ Wired | ⬜ Pending |
| 236 | social | DELETE | `/api/social/friends/{friendship_id}` | Remove a friend or decline a request. | ✅ Done | ✅ Wired | ⬜ Pending |
| 237 | social | GET | `/api/social/leaderboard/friends` | Leaderboard limited to the caller and their friends, ranked by stars. | ✅ Done | ✅ Wired | ⬜ Pending |
| 238 | social | GET | `/api/social/leaderboard/global` | Global leaderboard by stars (respects leaderboard_visible privacy). | ✅ Done | ✅ Wired | ⬜ Pending |
| 239 | streaks | GET | `/api/streaks` | Current streak, longest streak and total practice days. | ✅ Done | ✅ Wired | ⬜ Pending |
| 240 | streaks | GET | `/api/streaks/heatmap` | Last-30-day practice heatmap (date -> practised bool + session count). | ✅ Done | ✅ Wired | ⬜ Pending |
| 241 | streaks | GET | `/api/streaks/{user_id}` | Streak for a specific user (self, or admin/therapist). | ✅ Done | ✅ Wired | ⬜ Pending |
| 242 | support | POST | `/api/support/tickets` | Open a support ticket. | ✅ Done | ✅ Wired | ⬜ Pending |
| 243 | support | GET | `/api/support/tickets` | List the caller's tickets. | ✅ Done | ✅ Wired | ⬜ Pending |
| 244 | support | GET | `/api/support/tickets/{ticket_id}` | Fetch a ticket thread (owner or admin). | ✅ Done | ✅ Wired | ⬜ Pending |
| 245 | support | POST | `/api/support/tickets/{ticket_id}/reply` | Reply to a ticket (user or admin); admin can also change status. | ✅ Done | ✅ Wired | ⬜ Pending |
| 246 | support | GET | `/api/support/tickets/admin/all` | Admin: list all tickets. | ✅ Done | ✅ Wired | ⬜ Pending |
| 247 | support | GET | `/api/support/faq` | List FAQ entries (seeds defaults on first call). | ✅ Done | ✅ Wired | ⬜ Pending |
| 248 | support | POST | `/api/support/faq/admin` | Admin: add an FAQ entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 249 | support | DELETE | `/api/support/faq/admin/{faq_id}` | Admin: delete an FAQ entry. | ✅ Done | ✅ Wired | ⬜ Pending |
| 250 | surveys | GET | `/api/surveys` | List active surveys, flagging which the caller has completed. | ✅ Done | ✅ Wired | ⬜ Pending |
| 251 | surveys | GET | `/api/surveys/{survey_id}` | Fetch a survey to complete. | ✅ Done | ✅ Wired | ⬜ Pending |
| 252 | surveys | POST | `/api/surveys/{survey_id}/respond` | Submit a survey response (once per user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 253 | surveys | POST | `/api/surveys/admin` | Admin: create a survey. | ✅ Done | ✅ Wired | ⬜ Pending |
| 254 | surveys | GET | `/api/surveys/admin/{survey_id}/results` | Admin: aggregate results for a survey. | ✅ Done | ✅ Wired | ⬜ Pending |
| 255 | surveys | DELETE | `/api/surveys/admin/{survey_id}` | Admin: delete a survey and its responses. | ✅ Done | ✅ Wired | ⬜ Pending |
| 256 | templates | GET | `/api/templates` | Admin: list templates. | ✅ Done | ✅ Wired | ⬜ Pending |
| 257 | templates | POST | `/api/templates` | Admin: create a template. | ✅ Done | ✅ Wired | ⬜ Pending |
| 258 | templates | GET | `/api/templates/{template_id}` | Admin: fetch a template. | ✅ Done | ✅ Wired | ⬜ Pending |
| 259 | templates | PATCH | `/api/templates/{template_id}` | Admin: update a template (recomputes placeholders). | ✅ Done | ✅ Wired | ⬜ Pending |
| 260 | templates | POST | `/api/templates/{template_id}/render` | Admin: render a template with variables (preview). | ✅ Done | ✅ Wired | ⬜ Pending |
| 261 | templates | DELETE | `/api/templates/{template_id}` | Admin: delete a template. | ✅ Done | ✅ Wired | ⬜ Pending |
| 262 | therapist | POST | `/api/therapist/register` | Create a therapist account (no child profile). | ✅ Done | ✅ Wired | ⬜ Pending |
| 263 | therapist | GET | `/api/therapist/children` | List children assigned to the current therapist, with progress rollups. | ✅ Done | ✅ Wired | ⬜ Pending |
| 264 | therapist | POST | `/api/therapist/assign` | Assign an existing child account to the current therapist by email. | ✅ Done | ✅ Wired | ⬜ Pending |
| 265 | therapist | GET | `/api/therapist/children/{child_id}` | Full progress + analytics for one assigned child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 266 | therapist | DELETE | `/api/therapist/children/{child_id}` | Remove the therapist link from a child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 267 | therapist-ext | POST | `/api/therapist/notes` | Add a clinical note for an assigned child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 268 | therapist-ext | GET | `/api/therapist/notes/{child_id}` | List notes for an assigned child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 269 | therapist-ext | DELETE | `/api/therapist/notes/{note_id}` | Delete a note authored by this therapist. | ✅ Done | ✅ Wired | ⬜ Pending |
| 270 | therapist-ext | POST | `/api/therapist/plans` | Create a treatment plan for an assigned child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 271 | therapist-ext | GET | `/api/therapist/plans/{child_id}` | List treatment plans for an assigned child. | ✅ Done | ✅ Wired | ⬜ Pending |
| 272 | therapist-ext | PATCH | `/api/therapist/plans/{plan_id}/goal/{goal_index}` | Toggle a plan goal's done state. | ✅ Done | ✅ Wired | ⬜ Pending |
| 273 | therapist-ext | DELETE | `/api/therapist/plans/{plan_id}` | Delete a treatment plan. | ✅ Done | ✅ Wired | ⬜ Pending |
| 274 | therapy | GET | `/api/therapy/lessons` | Get all available lessons. | ✅ Done | ✅ Wired | ⬜ Pending |
| 275 | therapy | GET | `/api/therapy/lessons/{lesson_id}` | Get specific lesson by ID. | ✅ Done | ✅ Wired | ⬜ Pending |
| 276 | uploads | POST | `/api/uploads` | Upload a file (max 10 MB, whitelisted types). | ✅ Done | ✅ Wired | ⬜ Pending |
| 277 | uploads | GET | `/api/uploads` | List the caller's uploads. | ✅ Done | ✅ Wired | ⬜ Pending |
| 278 | uploads | DELETE | `/api/uploads/{upload_id}` | Delete an uploaded file (and its metadata). | ✅ Done | ✅ Wired | ⬜ Pending |
| 279 | videos | GET | `/api/videos` | List videos, annotated with the caller's watch progress. | ✅ Done | ✅ Wired | ⬜ Pending |
| 280 | videos | GET | `/api/videos/categories` | List categories with video counts. | ✅ Done | ✅ Wired | ⬜ Pending |
| 281 | videos | GET | `/api/videos/{video_slug}` | Video detail (increments view count) with the caller's progress. | ✅ Done | ✅ Wired | ⬜ Pending |
| 282 | videos | POST | `/api/videos/{video_slug}/progress` | Upsert watch progress; award coins the first time a video is completed. | ✅ Done | ✅ Wired | ⬜ Pending |
| 283 | videos | POST | `/api/videos/admin` | Admin: add a video. | ✅ Done | ✅ Wired | ⬜ Pending |
| 284 | videos | PATCH | `/api/videos/admin/{video_slug}` | Admin: update a video. | ✅ Done | ✅ Wired | ⬜ Pending |
| 285 | videos | DELETE | `/api/videos/admin/{video_slug}` | Admin: delete a video. | ✅ Done | ✅ Wired | ⬜ Pending |
| 286 | wallet | GET | `/api/wallet` | Return the caller's wallet with level progress to the next level. | ✅ Done | ✅ Wired | ⬜ Pending |
| 287 | wallet | GET | `/api/wallet/transactions` | Paginated wallet transaction history. | ✅ Done | ✅ Wired | ⬜ Pending |
| 288 | wallet | POST | `/api/wallet/daily-reward` | Claim a once-per-day coin reward with a growing streak bonus. | ✅ Done | ✅ Wired | ⬜ Pending |
| 289 | wallet | GET | `/api/wallet/shop` | List shop items; flags which the caller already owns. | ✅ Done | ✅ Wired | ⬜ Pending |
| 290 | wallet | POST | `/api/wallet/shop/{item_slug}/buy` | Purchase a shop item, debiting coins/gems and adding to inventory. | ✅ Done | ✅ Wired | ⬜ Pending |
| 291 | wallet | GET | `/api/wallet/inventory` | List items the caller owns. | ✅ Done | ✅ Wired | ⬜ Pending |
| 292 | wallet | POST | `/api/wallet/inventory/{item_slug}/equip` | Equip an owned item (unequips others of the same type). | ✅ Done | ✅ Wired | ⬜ Pending |
| 293 | wallet | POST | `/api/wallet/admin/adjust` | Admin: grant or deduct currency from a user's wallet. | ✅ Done | ✅ Wired | ⬜ Pending |
| 294 | wishlist | POST | `/api/wishlist` | Add an item to the wishlist (dedup per user+item). | ✅ Done | ✅ Wired | ⬜ Pending |
| 295 | wishlist | GET | `/api/wishlist` | List the caller's wishlist. | ✅ Done | ✅ Wired | ⬜ Pending |
| 296 | wishlist | DELETE | `/api/wishlist/{item_id}` | Remove a wishlist item. | ✅ Done | ✅ Wired | ⬜ Pending |
| 297 | wishlist | POST | `/api/wishlist/suggest` | Submit a content/feature suggestion. | ✅ Done | ✅ Wired | ⬜ Pending |
| 298 | wishlist | GET | `/api/wishlist/suggestions` | Public list of suggestions (most-voted first). | ✅ Done | ✅ Wired | ⬜ Pending |
| 299 | wishlist | POST | `/api/wishlist/suggestions/{suggestion_id}/vote` | Upvote a suggestion (one vote per user). | ✅ Done | ✅ Wired | ⬜ Pending |
| 300 | wishlist | GET | `/api/wishlist/suggestions/admin/all` | Admin: review all suggestions. | ✅ Done | ✅ Wired | ⬜ Pending |