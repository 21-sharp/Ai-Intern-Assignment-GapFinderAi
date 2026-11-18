# GapFinder AI

GapFinder is a study-diagnosis prototype. Students can add notes, map topics, take source-based diagnostics, review answer feedback, create a revision plan, and ask questions grounded in their material.

## Run locally

Requirements: Node.js 22.13+ and npm. The local account store uses Node's built-in SQLite module.

```bash
npm install
npm run dev
```

On Windows, double-click `run.bat`. It starts Next.js on port 3000. Use `stop.bat` to stop that server. The health endpoint is `http://localhost:3000/api/health` and checks the local account database.

Students can register with a name, email and password or sign in with an existing account. Passwords are hashed with Argon2id. Session tokens are random, stored hashed in SQLite, expire after seven days, and are sent in HTTP-only SameSite cookies. The default database is `data/gapfinder.sqlite`; this folder is ignored by Git. Change `GAPFINDER_DB_PATH` to place it elsewhere.

The admin sample roster is available from **Student examples**. The local admin settings are kept in ignored `.env.local`; change `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` before any deployment. `.env.example` shows the required variable names. Admin login is protected by a signed, HTTP-only cookie and an in-process attempt limit.

## Current features

- Student registration, sign-in, sign-out, hashed passwords, expiring sessions and per-IP in-memory login rate limiting.
- Browser-side TXT, Markdown, CSV, and text-based PDF extraction.
- Basic topic mapping and diagnostic prompts derived from supplied text.
- Keyword-based answer evaluation, topic reports, and study-time planning.
- Source paragraph retrieval for the study assistant; Groq explanations are optional.
- Three clearly labeled fictional admin roster examples and a sample Biology notes dataset.
- Browser-local study history and an admin-only sample roster view.

## Environment variables

Copy `.env.example` values into `.env.local` as needed. Keep all secrets out of Git. `GROQ_API_KEY` and `GROQ_MODEL` are optional. Admin login requires `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a random `ADMIN_SESSION_SECRET`.

## Important implementation limits

This repository is not yet the production multi-user SaaS described in the supplied product specification. Accounts are persisted locally in SQLite, while study materials, quiz responses and progress remain in each browser's account-specific `localStorage`; they do not sync between devices. There is no PostgreSQL database, pgvector index, Redis queue, private object storage, email verification, password reset, account deletion, teacher class authorization, audited user management, OCR, or production deployment pipeline. The roster is sample data. The keyword retrieval and grading logic are a prototype, not a validated educational assessment system. No concurrent-user or load-capacity claim has been tested.

Use a persistent local disk for SQLite during development. For a multi-instance production deployment, migrate accounts and study data to managed PostgreSQL, add server-side ownership checks and session storage, then configure storage, email, AI credentials, and deployment security. Do not use this prototype with real student records or claim production readiness.

## AI behavior

Without `GROQ_API_KEY`, assistant answers return the closest matching source passage. If configured, the API sends the question and retrieved excerpt to Groq for a grounded explanation. Uploaded documents are untrusted input and should not contain sensitive personal data.

## Verification

```bash
npm run build
```

`GET /api/health` returns a small readiness response for the web server. This check does not validate external AI, database, mail, or storage services.
