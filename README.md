# KaagazSetu

KaagazSetu is a family vault and lifecycle document management platform built for Indian households. It helps families store important records, track renewals, prepare for life events, and define emergency access rules in a secure and calm interface.

## What is included

- Secure authentication and protected dashboard access
- Family member and document vault organization
- AI-assisted document review for Aadhaar, PAN, insurance, property, and similar records
- Expiry timeline and renewal reminders
- Life-event / death checklist guidance with status tracking
- Nominee configuration and emergency access workflow
- Audit history and privacy-safe export
- Responsive product UI designed for everyday family use

## Architecture

- Frontend: React + Vite
- Backend: Express + MongoDB + Mongoose
- AI extraction: Anthropic Claude integration for document parsing
- Auth: JWT with protected routes
- Security: Helmet, CORS, rate limiting, AES encryption for file payloads
- Jobs: node-cron for expiry and nominee reminders

## Folder structure

- client: React front-end and styling
- server: Express API, models, routes, jobs, AI logic, encryption
- server/templates: contextual death checklist data
- server/test: regression tests for extracted data and timing logic

## Required environment

Create a server .env file from .env.example and fill in the values.

```bash
cp server/.env.example server/.env
```

Minimum required values:

- MONGO_URI
- JWT_SECRET
- ANTHROPIC_API_KEY
- FILE_KEY
- APP_URL
- SMTP_* values if you want real email notifications

## Local setup

### 1) Start MongoDB
Use a local MongoDB instance or Atlas connection string.

### 2) Install server dependencies

```bash
cd server
npm install
npm run dev
```

### 3) Install client dependencies and run UI

```bash
cd client
npm install
npm run dev
```

Open the app at http://localhost:5173.

## Product flow

1. Register or log in.
2. Add family members from the vault screen.
3. Upload Aadhaar, PAN, insurance, or other documents.
4. Review the AI-extracted fields and confirm them.
5. Manage expiry reminders and renewal tasks.
6. Prepare the death checklist and assign a nominee.
7. Use export or delete-account controls from Settings.

## API and operational notes

- Auth endpoints live under /api/auth
- Family and document routes are grouped under /api/persons and /api/docs
- Expiry and checklist flows are exposed under /api
- Nominee emergency access uses a tokenized route at /api/emergency/:token or /emergency/:token in the frontend
- Scheduled jobs can be triggered manually using the dev route when needed:

```bash
curl -X POST http://localhost:5000/api/dev/run-jobs -H "Authorization: Bearer <token>"
```

## Verification

The project was validated with:

```bash
cd server && npm test
cd client && npm run build
```

Current status:

- Server logic tests: passing
- Frontend production build: passing

## Intentionally out of scope

These items are not included in the current product scope and are intentionally left for a future phase:

- Real S3 or object-storage integration for production media hosting
- Multi-factor authentication and OTP verification for nominee approval
- Full legal drafting or notarization workflows
- Background queue orchestration such as BullMQ or a distributed worker system
- A production-grade PDF packet generator or document relationship graph
- Native mobile app packaging
- Full localization for all languages beyond the current product polish
- A full compliance review for legal/estate-specific use in all jurisdictions

## Notes

This app is designed as a practical family vault and decision support tool. It is not a substitute for legal, financial, or estate advice. Sensitive records such as Aadhaar should always be handled with caution and privacy-first controls.
