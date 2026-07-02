# BizScout Monitor

A full-stack HTTP monitoring application. A backend service pings
`httpbin.org/anything` every 5 minutes with a randomized JSON payload, stores every
response, detects latency anomalies, and streams new results to a live dashboard in
real time — with an **LLM-powered insights** layer on top (natural-language queries,
automatic incident reports, and cost-aware AI usage via **Google Gemini**).

> Take-home submission for the BizScout Engineering team. AI enhancement: **Option B —
> LLM-Powered Insights**.

---

## Table of contents

- [Architecture overview](#architecture-overview)
- [Tech choices & reasoning](#tech-choices--reasoning)
- [Backend structure (feature modules)](#backend-structure-feature-modules)
- [Local setup](#local-setup)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Option B: LLM insights & cost analysis](#option-b-llm-insights--cost-analysis)
- [Testing strategy & core components](#testing-strategy--core-components)
- [Deployment](#deployment)
- [Assumptions](#assumptions)
- [Future improvements](#future-improvements)

---

## Architecture overview

```
                          ┌──────────────────────── backend (Render) ─────────────────────────┐
                          │                                                                    │
  every 5 min ─▶ Scheduler ─▶ Pinger ─▶ httpbin.org/anything                                  │
                          │      │           │                                                 │
                          │      │           ▼                                                 │
                          │      │      Stats / anomaly check ──▶ MongoDB Atlas (responses)    │
                          │      │           │                        ▲                        │
                          │      │           ├──anomaly?──▶ Incident service ──▶ LLM layer      │
                          │      │           │                   │        (rate-limit + cache   │
                          │      ▼           ▼                   ▼         + token count + $)   │
                          │   Event bus ──▶ Socket.IO       MongoDB (incidents)  → Gemini API   │
                          │                    │                                                │
                          │   REST API  ◀──────┼── /api/responses  /api/incidents  /api/chat    │
                          └────────────────────┼───────────────────────────────────────────────┘
                                               │ WebSocket + HTTP
                          ┌────────────────────▼──────────── frontend (Vercel) ────────────────┐
                          │  Next.js dashboard: live table + chart, Incidents tab, chat widget, │
                          │  cost badge. Initial load via REST, live updates via Socket.IO.     │
                          └────────────────────────────────────────────────────────────────────┘
```

**Key design decisions**

- **Feature-module backend.** Each domain (`responses`, `incidents`, `chat`, `monitoring`,
  `llm`) is a self-contained module with its own model / dto / validation / service /
  controller / routes. Cross-cutting concerns (`middlewares`, `utils`, `config`) live in
  their own folders. See [Backend structure](#backend-structure-feature-modules).
- **Decoupled event bus.** Domain services emit events on a typed in-process
  `EventEmitter`; the Socket.IO layer subscribes and forwards them. The monitoring logic
  has zero dependency on the transport, which keeps it unit-testable.
- **Anomaly detection at write time.** Each response is compared against a 24-hour
  rolling window using two independent signals (ratio rule + z-score) before it's stored.
- **LLM guardrails are first-class**, not bolted on: a single `llm/llm.client.ts` wrapper
  owns the rate limiter and cost tracker so no feature can bypass them.
- **Graceful degradation.** Every LLM feature has a deterministic fallback. With no API
  key, the app is fully functional — incidents get rule-based analyses and the chat
  widget explains the AI is disabled.

---

## Tech choices & reasoning

| Concern    | Choice                          | Why                                                                                          |
| ---------- | ------------------------------- | -------------------------------------------------------------------------------------------- |
| Backend    | **TypeScript + Express**        | Explicitly preferred in the brief; Express is minimal and lets the architecture show clearly. |
| Real-time  | **Socket.IO**                   | Robust WebSocket with automatic fallback/reconnect — more reliable than raw `ws` for a demo.  |
| Database   | **MongoDB Atlas (Mongoose)**    | See below.                                                                                    |
| Frontend   | **Next.js (App Router) + Tailwind** | Preferred in the brief; App Router + client components fit a real-time dashboard well.    |
| Charts     | **Recharts**                    | Declarative, small, good enough for a response-time area with anomaly markers.               |
| LLM        | **Google Gemini (`gemini-2.5-flash`)** | Cost-efficient, fast, generous free tier — see the cost analysis. Thinking disabled for cost. |
| Validation | **Zod**                         | Runtime validation of query params / request bodies at the API boundary.                     |
| Logging    | **Pino**                        | Structured JSON logs in prod, pretty in dev — "proper logging is a huge plus".               |

### Why MongoDB (NoSQL)?

- **Schema-flexible payloads.** Each request sends a *randomly-shaped* JSON payload and
  httpbin echoes it back. Storing arbitrary/varied JSON is exactly what a document store
  does best — no migrations as the payload shape evolves.
- **Append-heavy, time-ordered workload.** Monitoring is write-once, read-by-time.
  Mongo's index on `timestamp` covers the dashboard's dominant query (newest-first,
  paginated) cheaply.
- **Free hosted tier.** MongoDB Atlas M0 is free and pairs cleanly with a Render backend.
- **Trade-off acknowledged:** we don't need cross-collection joins or strict relational
  integrity here, so SQL's relational guarantees would buy little. If this grew into
  multi-tenant relational reporting, Postgres would become the better fit.

---

## Backend structure (feature modules)

```
backend/src/
├── config/                 # env parsing + typing, database connection
├── utils/                  # logger, typed event bus, pagination helper
├── middlewares/            # error handler + 404
├── sockets/                # Socket.IO wiring
├── modules/
│   ├── monitoring/         # payload.util, stats.service, monitoring.service, scheduler
│   ├── responses/          # model · dto · validation · service · controller · routes
│   ├── incidents/          # model · service · analyzer (LLM) · controller · routes
│   ├── chat/               # context · service · validation · dto · controller · routes
│   └── llm/                # llm.client (Gemini + guardrails) · rate-limiter · cache · cost-tracker · pricing
├── app.ts                  # Express app (composition root)
└── server.ts               # bootstrap: db → http+sockets → scheduler
```

Each feature module is cohesive and independently testable; `app.ts` simply mounts the
module routers. The `llm` module is shared infrastructure consumed by `incidents`
(analyzer) and `chat` (service).

---

## Local setup

**Prerequisites:** Node 20+, and a MongoDB instance (a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local `mongod`).

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit .env (at minimum set MONGODB_URI)
npm install
npm run dev                   # starts on http://localhost:4000, begins pinging immediately
```

Key env vars (`backend/.env`):

| Variable                 | Default                              | Purpose                                    |
| ------------------------ | ------------------------------------ | ------------------------------------------ |
| `MONGODB_URI`            | `mongodb://localhost:27017/bizscout` | Mongo connection string (your Atlas URI)   |
| `PORT`                   | `4000`                               | HTTP port                                  |
| `CORS_ORIGINS`           | `http://localhost:3000`              | Comma-separated allowed frontend origins   |
| `MONITOR_INTERVAL_MS`    | `300000` (5 min)                     | Ping interval                              |
| `MONITOR_RUN_ON_START`   | `true`                               | Run one ping immediately (nice for demos)  |
| `GEMINI_API_KEY`         | *(empty)*                            | Optional — enables LLM features            |
| `LLM_MODEL`              | `gemini-2.5-flash`                   | Gemini model                               |
| `LLM_MAX_CALLS_PER_HOUR` | `20`                                 | Hard cap on LLM calls per hour             |

> **Demo tip:** lower `MONITOR_INTERVAL_MS` (e.g. `10000`) to see the dashboard fill up
> quickly instead of waiting 5 minutes between rows.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                   # http://localhost:3000
```

### Useful scripts

```bash
# backend
npm run lint            # eslint
npm run test:unit       # jest — unit tests only (no DB needed)
npm run test:coverage   # jest — unit + integration (+ coverage); integration needs a Mongo (see testing)
npm run build           # tsc -> dist/

# frontend
npm run lint
npm run build
```

---

## Database schema

Two collections (Mongoose models under `backend/src/modules/*/`).

### `responses` — one monitoring sample per ping

| Field               | Type     | Notes                                              |
| ------------------- | -------- | -------------------------------------------------- |
| `timestamp`         | Date     | When the request was sent (indexed)                |
| `url`, `method`     | String   | Target endpoint + verb                             |
| `requestPayload`    | Mixed    | The randomized JSON payload sent                   |
| `statusCode`        | Number   | HTTP status (indexed)                              |
| `success`           | Boolean  | 2xx/3xx                                            |
| `responseTimeMs`    | Number   | Round-trip latency (indexed)                       |
| `responseSizeBytes` | Number   | Size of the response body                          |
| `responseBody`      | Mixed    | Echoed body, trimmed if > 8 KB                     |
| `isAnomaly`         | Boolean  | Set at write time by the anomaly check (indexed)   |
| `error`             | String?  | Message when the request itself failed             |

Indexes: `{ timestamp: -1 }` (dashboard query), plus `statusCode`, `responseTimeMs`,
`isAnomaly`.

### `incidents` — auto-generated incident reports (Option B)

| Field                | Type                | Notes                                        |
| -------------------- | ------------------- | -------------------------------------------- |
| `responseId`         | ObjectId → Response | The triggering sample                        |
| `timestamp`          | Date                | Indexed                                      |
| `severity`           | `low`\|`med`\|`high`| Based on how far over the average            |
| `endpoint`           | String              |                                              |
| `responseTimeMs`     | Number              | Observed latency                             |
| `avgResponseTimeMs`  | Number              | Rolling average at the time                  |
| `title`, `rootCause` | String              | LLM-authored (or rule-based fallback)        |
| `recommendations`    | String[]            | Actionable suggestions                       |
| `generatedBy`        | String              | `llm` or `rule-based` (provenance)           |

---

## API reference

| Method | Path                       | Description                                             |
| ------ | -------------------------- | ------------------------------------------------------- |
| GET    | `/health`                  | Liveness probe                                          |
| GET    | `/api/responses`           | Paginated history. `?page&limit&anomaliesOnly`          |
| GET    | `/api/responses/stats`     | 24h rolling stats (mean, stdDev, min, max, p95)         |
| GET    | `/api/incidents`           | Paginated incident reports. `?page&limit`               |
| POST   | `/api/chat`                | `{ question }` → grounded NL answer                     |
| GET    | `/api/chat/cost`           | LLM cost + quota snapshot                               |

**Socket.IO events (server → client):** `response:new`, `incident:new`.

---

## Option B: LLM insights & cost analysis

Implemented features (`backend/src/modules/`):

1. **Natural-language query interface** (`chat/`) — questions like *"What were the slowest
   response times today?"* The backend builds a compact, factual data context from
   MongoDB and Gemini answers **grounded in that context**.
   > **Design choice:** rather than letting the LLM emit raw MongoDB queries (an
   > injection/correctness risk), we pre-aggregate the data it needs and let it reason
   > over that. Safer and more cost-predictable.
2. **Automatic incident reporting** (`incidents/incident.analyzer.ts`) — when a response
   time exceeds `ANOMALY_FACTOR ×` the rolling average, an incident is created with a
   Gemini-authored root cause + recommendations, stored, and surfaced in the **Incidents**
   tab in real time.
3. **Smart response analysis** — response payloads are captured and summarized as part of
   the query context the chat interface reasons over.

### Cost optimization (the "Critical" requirement)

Every guardrail the brief asks for is implemented and unit-tested (`modules/llm/`):

| Requirement                     | Implementation                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------ |
| Token counting before calls     | `pricing.ts` `estimateTokens()` previews input size before every call          |
| Cache frequent queries          | `cache.ts` — TTL cache keyed by normalized question (default 10 min)           |
| Rate limiting (max 20/hr)       | `rate-limiter.ts` — sliding-window limiter, shared across all LLM features      |
| Fallback when quota exceeded    | Chat returns a helpful message; incidents fall back to deterministic analysis  |
| Display cost estimation         | `cost-tracker.ts` + `/api/chat/cost` → the dashboard **cost badge**            |

**Cost analysis.** We use **Gemini 2.5 Flash** ($0.30 / $2.50 per 1M input/output tokens)
with **thinking disabled** (`thinkingBudget: 0`) — the workload is short, structured
summarization over a small pre-aggregated context, which Flash handles well cheaply and
quickly. Worst-case bound per hour:

```
20 calls/hr (hard cap) × (~1.5K input + ~0.7K output tokens per call)
≈ 20 × (1500 × $0.30/1M  +  700 × $2.50/1M)
≈ 20 × ($0.00045 + $0.00175)  ≈ $0.044 / hour absolute ceiling
```

In practice the cache absorbs repeated questions and Gemini's free tier covers demo
usage entirely, so real spend is a fraction of that. The rate limiter guarantees the
ceiling can never be exceeded regardless of traffic. The model is configurable via
`LLM_MODEL`.

---

## Testing strategy & core components

The brief asks us to **identify the core components and comprehensively test one**.

**What we consider core:**

1. **The monitoring pipeline** — payload generation → ping → **anomaly detection** →
   persist → broadcast. This is the reason the app exists; a wrong anomaly decision
   corrupts every downstream signal (flags, incidents, alerts).
2. **The LLM cost guardrails** — rate limiter + cache. Flagged "Critical" in the brief;
   a bug here means uncapped spend.
3. The REST history API (the read path the dashboard depends on).

**Where we focused (comprehensive coverage):** the **anomaly-detection statistics**
(`monitoring/stats.service.ts`) — the core intelligence of the pipeline — plus the
**cost guardrails** (`llm/rate-limiter.ts`, `llm/cache.ts`). These are pure, deterministic
functions, so we test the full decision surface: empty/single-sample edge cases, both
anomaly rules (ratio + z-score), the cold-start minimum-sample guard, sliding-window
expiry, and cache TTL boundaries. **31 tests** pass in total.

We also include an **integration test** for `GET /api/responses` using `supertest`, which
exercises routing, query validation, pagination, and the DB layer together against a real
MongoDB.

> **Why the test DB isn't `mongodb-memory-server`:** an earlier iteration downloaded a
> ~600 MB mongod binary on first run, which is slow and awkward in CI. Instead the
> integration test connects to `MONGO_TEST_URI` — in CI that's a lightweight `mongo:7`
> **service container** (see `.github/workflows/ci.yml`), and locally you point it at a
> local mongod or an Atlas *test* database. It uses its own DB name and cleans up after
> itself, so it never touches production data.

```bash
cd backend
npm run test:unit                                   # no DB needed
MONGO_TEST_URI=mongodb://127.0.0.1:27017/bizscout_test npm run test:coverage
```

---

## Deployment

Because the backend needs a **long-running scheduler** and a **persistent WebSocket**,
it runs on **Render** (a persistent Node process), while the Next.js frontend runs on
**Vercel**. Vercel's serverless model can't hold either of those, so splitting them is
the industry-standard fit.

### Backend → Render

1. Create a free **MongoDB Atlas** cluster; copy its connection string.
2. On Render, **New → Blueprint**, point it at this repo (`render.yaml` at the root
   provisions the service), or create a Web Service manually with root dir `backend`,
   build `npm ci && npm run build`, start `npm start`.
3. Set env vars in the Render dashboard: `MONGODB_URI`, `CORS_ORIGINS` (your Vercel URL),
   and optionally `GEMINI_API_KEY`.

> Note: Render's free tier sleeps after inactivity; the first request after a sleep is
> slow, and the scheduler pauses while asleep. Fine for a demo; a paid tier or an external
> cron ping keeps it warm.

### Frontend → Vercel

1. **New Project → import this repo**, set root directory to `frontend`.
2. Set env var `NEXT_PUBLIC_API_URL` to your Render backend URL.
3. Deploy. Vercel auto-detects Next.js.

---

## Assumptions

- **"Every 5 minutes"** is honored via `setInterval` in a single always-on backend
  process. A multi-instance deployment would move scheduling to a distributed cron/lock.
- **Anomaly definition:** the brief defines an incident-triggering anomaly as
  `response time > 2× average`. We use that as the ratio rule and *add* a z-score rule as
  a second signal, with a minimum-sample guard so a cold start doesn't flag everything.
- **Single-instance state:** the rate limiter, cache, and cost tracker are in-memory.
  Correct for the free-tier single-instance deployment; Redis would be needed to scale
  horizontally.
- **LLM is optional:** the app runs fully without a Gemini key (rule-based fallbacks).
- **Response bodies are trimmed** to 8 KB before storage to keep documents small.

---

## Future improvements

- **Distributed scheduling & shared guardrail state** (Redis) for multi-instance scaling.
- **Time-series forecasting + confidence bands** (Option A overlap) on the chart.
- **Persist cost/usage per day** rather than in-memory, with historical charts.
- **Streaming chat responses** for better UX on longer answers.
- **Alerting integrations** (email/Slack) when high-severity incidents fire.
- **Auth** on the API and a per-user rate limit.
- **E2E tests** (Playwright) for the critical dashboard flow.

---

## Repository layout

```
bizscout-monitor/
├── backend/                 # TypeScript + Express + Socket.IO + Gemini (feature modules)
├── frontend/                # Next.js dashboard (App Router + Tailwind)
├── .github/workflows/ci.yml # lint + typecheck + test + coverage + build (mongo service)
└── render.yaml              # backend deployment blueprint
```
