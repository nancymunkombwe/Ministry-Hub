# Ministry Hub — phase 1 hardening (review build)

This source-only copy excludes the original .env, Git history, node_modules and SQL dump. It still uses MySQL. Do not deploy yet.

Changes: administrator-only registration, authenticated report endpoints, restricted detailed contribution endpoints, inactive account rejection, generic database error responses, fixed CORS origin, health endpoint, sample environment files and removal of unused hardcoded database config. Leaders no longer see contributions navigation. Dashboard and other report aggregates remain visible to authenticated roles; review role rules before production. Direct frontend navigation and report UX for restricted roles need testing.

Rotate any credentials included in the original archive or Git history. Restore local settings privately in backend/.env (do not reuse exposed credentials). Use fictional demo data only. Existing administrator accounts must be provisioned privately.

Next: migrate MySQL queries and schema to PostgreSQL, add login rate limiting, review data minimisation and endpoint-level authorisation, test roles and financial reports, then deploy.
