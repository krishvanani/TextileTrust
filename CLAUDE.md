# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

TextileTrust is a three-service application split across sibling directories:

- `backend/` — Node.js + Express API (MongoDB via Mongoose). Port **5003** by default (`PORT` in `backend/.env`).
- `frontend/` — React 19 + Vite + Tailwind SPA. Dev port **5173** (Vite default). Reads `VITE_API_URL` from `frontend/.env{,.development}`; `frontend/src/services/api.js` falls back to `http://localhost:5003`.
- `nlp/` — Python Flask microservice (port **5001**) used by the backend to classify reviews as fake/abusive before persistence. Runs BERT (`toxic-bert`), TF-IDF, and Word2Vec analyzers in an ensemble via `POST /analyze`.

Each service has its own dependency manifest and is started independently; there is no monorepo tooling or shared root `package.json`.

## Common commands

Backend (`cd backend`):
- `npm run dev` — nodemon on `server.js`
- `npm start` — plain `node server.js`
- No test runner wired up. Ad-hoc scripts in `backend/` root (`test_*.js`, `verify_*.js`, `debug_*.js`, `check_db.js`, `create_admin.js`, `fix_indexes.js`, `enforce_indexes.js`, `update_reputation.js`) are standalone node scripts, run with `node <file>.js` against the configured Mongo URI. Treat them as throwaway utilities, not a test suite.

Frontend (`cd frontend`):
- `npm run dev` — Vite dev server
- `npm run build` — production build (output to `dist/`, deployed via `vercel.json` SPA rewrite)
- `npm run lint` — ESLint (flat config in `eslint.config.js`)
- `npm run preview` — preview built bundle

NLP (`cd nlp`):
- Setup + run: `python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py` (serves on port 5001).
- `python evaluate.py` — developer utility to benchmark the three analyzers.

## Architecture

### Backend request lifecycle (`backend/server.js`)
1. `dotenv.config()` then `connectDB()` (Mongoose connects to `MONGO_URI`). Connection failure calls `process.exit(1)`.
2. Top-level `uncaughtException`/`unhandledRejection` handlers exit the process — import-time errors are fatal on purpose.
3. Two rate limiters: `globalLimiter` on everything, `authLimiter` scoped to `/api/auth`. Both relax their caps when `NODE_ENV !== 'production'`.
4. CORS origin list comes from `CORS_ORIGIN` env (comma-separated); falls back to `*`.
5. Routers mounted under `/api/{auth,reviews,companies,subscription,activities,stats,gst,admin}`. `/uploads` is served statically for legacy local uploads; new image uploads go to Cloudinary (see `backend/config/cloudinary.js`).
6. Global `errorHandler` middleware (`backend/middleware/errorMiddleware.js`) formats thrown errors as JSON — controllers use `express-async-handler` and `throw new Error(...)` after setting `res.status(...)`.

### Auth model
- JWT in `Authorization: Bearer <token>` header. `middleware/authMiddleware.js` exposes `protect` (required) and `optionalAuth` (best-effort). `req.user` is populated from `User.findById(decoded.id).select('-password')`.
- Registration (`POST /api/auth/register`) optionally verifies a `firebaseIdToken` against the phone number via `config/firebase.js`. If Firebase Admin isn't configured it logs a warning but allows the registration to proceed.
- Passwords are validated by `validatePassword` in `controllers/authController.js` (length + complexity + context checks) and hashed in the `User` pre-save hook.

### Data model & invariants
- `User` (`backend/models/User.js`) has role enum (VIEWER/TRADER/MANUFACTURER/... /ADMIN), `isSubscribed` flag, embedded `subscription` pointer, `companySnapshot` (includes unique+sparse `gstNumber`), and `reviewCount`.
- `Company` (`backend/models/Company.js`) holds canonical GST/PAN (unique), business card URLs, and **denormalized review aggregates**: `avgRating`, `dealAgainPercentage`, `totalReviews`, `trustStatus`.
- `Review` (`backend/models/Review.js`) has a compound unique index on `(userId, companyId)` — one review per user per company, enforced at the DB layer.
- **Review aggregates are recomputed server-side, never trusted from the client.** After any review write, `controllers/reviewController.js` calls both `utils/recalcCompanyStats.js` and an internal `recalculateReputation` aggregate pipeline. If you add a code path that mutates reviews, trigger the same recalculation.

### Review gating
- `middleware/checkReviewLimit.js` caps unsubscribed users at 5 reviews by refetching `reviewCount`/`isSubscribed` from the DB (explicit comment: "never trust frontend"). Subscribed users bypass the cap. Applied to `POST /api/reviews` and `POST /api/reviews/gst`.
- Listing reviews (`GET /api/reviews/:companyId`) requires `req.user.isSubscribed` — hard 403 otherwise. Anonymous reviews have user fields scrubbed before the response.

### GST verification flow (`backend/services/gstService.js`)
- In-memory `gstSessions` map keyed by a generated UUID, holding a cookie-jar-wrapped axios session against `services.gst.gov.in`.
- Two-step flow: `fetchCaptcha()` returns `{ sessionId, image }`; `fetchGSTDetails(sessionId, gstin, captcha)` POSTs with the same cookie jar.
- Sessions are auto-deleted after 5 minutes or on first successful use. **This state is per-process** — do not scale the backend horizontally without moving this store to Redis or similar.

### Subscription activation (`backend/controllers/subscriptionController.js`)
Idempotent: if `user.isSubscribed` is already true, the endpoint returns the current state without creating a new `Subscription` document. When activating, it also rewrites `user.role` from `req.body.businessType` by upper-snake-casing the string (e.g. "Yarn Supplier" → `YARN_SUPPLIER`) — must stay in sync with the `User.role` enum.

### NLP service contract
- `POST /analyze` with `{ comment, rating }` returns `{ passed, is_fake, is_abusive, reason, scores }`. Backend calls this before creating/saving a review; `passed === false` should block the write.
- `POST /compare` is a dev/eval endpoint returning all three model verdicts individually — not wired into the main flow.
- Models load once at startup; first boot downloads `toxic-bert` via HuggingFace.

### Frontend
- `src/App.jsx` wraps everything in `AuthProvider` → `SearchProvider` → `BrowserRouter` → `ErrorBoundary` → `Layout`. All routes are defined inline there; no lazy loading.
- `src/services/api.js` is the shared axios instance. A request interceptor attaches `Authorization: Bearer ${localStorage.token}` to every call. Use this module instead of raw axios.
- `src/context/AuthContext.jsx` is the single source of truth for the logged-in user. On mount and after login/register/subscription changes it calls `refreshUser()` (`GET /api/auth/me`) — the comment "Single Source of Truth" is load-bearing; don't mutate user state from response bodies of other endpoints, call `refreshUser()` instead.
- `src/utils/imageUrl.js` (`getImageUrl`) normalizes image paths — legacy local `/uploads/...` strings are prefixed with the API base, Cloudinary `https://...` URLs pass through. Always route image URLs through this helper.

## Environment variables

Backend `.env` (not committed) must include at minimum: `MONGO_URI`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, Firebase Admin vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_ID`, `FIREBASE_CERT_URL`), and Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). Razorpay keys are expected if payment flows are exercised.

Frontend uses `VITE_API_URL` only. `frontend/.env` points at prod, `frontend/.env.development` at `http://localhost:5003` — Vite picks automatically based on mode.

## Conventions to preserve

- Controllers use `express-async-handler` and the `res.status(code); throw new Error(msg);` pattern. The global error middleware relies on the status being set on `res` before the throw — keep this pattern when adding endpoints.
- When creating/updating/deleting reviews, always recompute company stats (`recalcCompanyStats` + `recalculateReputation`) before responding. Skipping it leaves `Company.avgRating`/`totalReviews`/`dealAgainPercentage` stale.
- `reviewCount` on `User` is incremented manually in the add-review path. The 5-review free cap reads it directly; keep it monotonic.
- Windows is the primary dev platform (PowerShell `fix_urls.ps1`), but shell commands in this repo should use Unix syntax per environment policy.
