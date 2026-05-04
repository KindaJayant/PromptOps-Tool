# PromptOps

PromptOps is a prompt engineering workspace for teams that want more than a textarea and a deploy button.

It gives you one place to:

- write and iterate on prompts
- save readable versions with change notes
- run the current draft in a live playground
- attach regression test cases to a prompt
- run eval suites against saved versions
- compare versions with diffs and score movement
- tag versions for environments like `staging` and `production`

The goal is simple: make prompt changes observable before they reach production.

## What The Product Does

PromptOps is built around the actual iteration loop:

1. edit a draft
2. run it with real input
3. save a version with a meaningful summary
4. run test cases against that version
5. compare results against earlier versions
6. promote or roll back with evidence

This is not just prompt storage. It is a small reliability layer for prompt workflows.

## Current Features

### Playground

- run the exact draft before saving it
- inspect rendered prompt output
- inspect live model output
- detect template variables from `{{variable}}` syntax

### Versioning

- save numbered prompt versions
- attach commit-style change summaries
- compare any two versions with a diff view
- restore an older version as a new latest version

### Eval Workflow

- create test cases manually
- import test cases from JSON or CSV
- run all test cases against a saved version
- persist run results, scores, pass/fail state, and judge reasoning
- review per-case score drift across recent versions

### Promotion Guard Rails

- tag versions as `experiment`, `staging`, or `production`
- require evals before a version can be promoted to production
- block underperforming promotions unless explicitly forced

### UX Hardening

- live prompt/analytics refresh after eval mutations
- loading and error feedback around workspace actions
- API-backed workspace hydration instead of stale sidebar state

## Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy
- Database:
  - local: SQLite
  - production: Postgres
- Model provider: Gemini via environment variables

## Repo Layout

```text
prompt-ops-tool/
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── llm.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── smoke_test_api.py
└── vercel.json
```

## Local Setup

### 1. Backend

```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
py -3.11 -m uvicorn main:app --reload
```

Backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Frontend runs at [http://127.0.0.1:5173](http://127.0.0.1:5173) by default.

## Environment Variables

### Backend

See [backend/.env.example](D:/projects/prompt-ops-tool/backend/.env.example).

- `DATABASE_URL`
  - local default: `sqlite:///./promptops.db`
  - production: use a hosted Postgres connection string
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
  - recommended: `gemini-2.5-flash-lite`

### Frontend

See [frontend/.env.example](D:/projects/prompt-ops-tool/frontend/.env.example).

- `VITE_API_BASE_URL`
  - local default: `http://localhost:8000`
  - production default: `/api`

## How To Use PromptOps

### Create a Workspace

Start with a prompt name and short description. This becomes the container for versions, test cases, analytics, and release tags.

### Save Versions Intentionally

Do not save versions with messages like `update prompt`. Write what changed:

- `tightened json schema output`
- `removed chain-of-thought instruction`
- `clarified fallback behavior for missing context`

Readable history is part of the product.

### Build a Small Eval Suite Early

Even two or three test cases are enough to catch regressions. PromptOps stores those cases against the prompt and lets you rerun them against any saved version.

### Use Production Tags Sparingly

Production tagging is guarded for a reason. Run evals first, then promote only when the version is at least not obviously worse than the current production baseline.

## Verification

### Frontend

```bash
cd frontend
npm run lint
npm run build
```

### Backend

```bash
py -3.11 -m compileall backend\main.py backend\schemas.py backend\database.py backend\llm.py backend\models.py
```

### End-To-End API Smoke Test

This exercises the main backend workflow:

- create prompt
- update prompt
- save versions
- diff versions
- run playground
- create/import test cases
- run eval suite
- fetch analytics
- fetch case matrix
- tag production
- rollback version
- delete prompt

Run it with:

```bash
py -3.11 smoke_test_api.py
```

## Deployment

This repo is prepared for a low-cost deployment path:

1. Vercel for frontend and API hosting
2. Neon Postgres for production storage
3. Gemini for model calls

### Why This Works

- the frontend and FastAPI app live in one repo
- the backend already reads `DATABASE_URL`
- production can move off SQLite cleanly

### Vercel Shape

The root [vercel.json](D:/projects/prompt-ops-tool/vercel.json) is configured so:

- `frontend` serves the web app
- `backend/main.py` serves the API
- frontend requests go to `/api` in production

### Production Checklist

1. Push the repo to GitHub.
2. Create a Neon Postgres database.
3. Import the repo into Vercel.
4. Add:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL`
5. Deploy.

## Known Gaps

PromptOps is in an improvement phase. The main areas still worth pushing:

- repeatable browser-level UI smoke tests
- more explicit per-action success states in deeper flows
- cleaner Pydantic v2 schema config
- better model-provider abstraction beyond Gemini-only setup

## Project Direction

The next step is not to turn PromptOps into a random prompt CRUD app. The stronger direction is:

- prompt versioning
- eval signal
- release guard rails
- workflow debugging
- eventually, agent-step visibility

That keeps the product coherent and makes it a stronger systems project.
