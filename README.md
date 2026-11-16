# Ministry Hub — V2.0 PostgreSQL migration candidate

Church management application: React/Vite frontend, Express backend, PostgreSQL database.

## Important

This package contains schema definitions only, not the original database records or credentials. Use a separate Supabase project and fictional data for the first deployment. Do not run the schema against your portfolio database. Full integration, role-permission and production security testing are outstanding.

## 1. Supabase

Create a new project. Open SQL Editor, paste the complete contents of `database/schema.sql`, and run once. The transaction creates 15 tables in `ministry_private`, with identity columns, foreign keys, indexes, CHECK constraints and RLS enabled. The schema is deliberately not exposed to the browser roles. The server connects directly via PostgreSQL; its database owner privileges bypass RLS, so server-side authorization remains essential. Use a restricted database role for a real production installation.

Under Connect, choose Session pooler (port 5432), not Transaction pooler. Copy the PostgreSQL connection URI, replace the password placeholder (URL-encode special characters). Configure certificate validation using the provider CA if needed (`PG_CA_BASE64`). Never disable certificate verification. Keep the URI private.

## 2. Backend (PowerShell)

From project root:

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

The old MySQL lockfile was removed; `npm install` regenerates it. Dependency installation has not been tested in this environment.

Edit `.env`: set DATABASE_URL, JWT_SECRET (random 32+ characters), FRONTEND_URL, ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters). Use a unique password and do not reuse old credentials. Set DB_SSL=true for cloud database access. For a local PostgreSQL server without TLS, use DB_SSL=false and development mode.

```powershell
npm run create-admin
npm run dev
```

Remove ADMIN_PASSWORD from `.env` after account creation. Check http://localhost:5000/api/health. The endpoint should report database connectivity; it is not a schema or security audit.

## 3. Frontend

In a second terminal from project root:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open http://localhost:5173. The local API setting is `VITE_API_URL=http://localhost:5000/api`.

## 4. Deployment candidate

Use a private GitHub repository. Never commit .env, original SQL dumps, personal records or private keys. Render root backend, build `npm install`, start `npm start`. Configure production environment variables in Render, not Git. Netlify base frontend, build `npm run build`, publish `dist`. Set VITE_API_URL to the Render HTTPS URL followed by `/api`. Set FRONTEND_URL on Render to the exact Netlify HTTPS origin. Confirm free-tier allowances before deployment.

## 5. Testing checklist

- Verify database connectivity and administrator login.
- Create fictional records for each module, test edits/deletes and relationships.
- Verify dashboards, financial totals, date range reports, attendance reports and church profile updates.
- Create leader and treasurer test accounts and verify denied accesses through direct API calls, not merely hidden navigation.
- Verify no personal data is present and no sensitive errors appear in HTTP responses or logs.
- Only consider a real deployment after access-control, privacy, backup and reliability review.

## Validation status

Backend JavaScript syntax checked; schema definitions compared against original dump (15 tables, 23 foreign keys). No live PostgreSQL server or npm registry was accessible in the preparation environment. Therefore installation, SQL execution, frontend build and end-to-end testing remain unverified. No cloud changes have been made.
