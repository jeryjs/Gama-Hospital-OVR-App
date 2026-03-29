# OVR-App

Occurrence Variance Reporting (OVR) system built with Next.js, TypeScript, Drizzle ORM, and NextAuth.

## Stack

- Next.js (App Router)
- TypeScript
- PostgreSQL + Drizzle ORM
- NextAuth (Azure AD / Microsoft identity)
- MUI + SWR

## Prerequisites

- Node.js 20+
- `pnpm`
- PostgreSQL database

## Local setup

1. Install dependencies

	`pnpm install`

2. Configure environment

	- Copy `.env.example` to `.env`
	- Fill required values (at minimum):
	  - `DATABASE_URL`
	  - `NEXTAUTH_URL`
	  - `NEXTAUTH_SECRET`
	  - `ALLOWED_EMAIL_DOMAIN`
	  - `AZURE_AD_CLIENT_ID`
	  - `AZURE_AD_CLIENT_SECRET`
	  - `NEXT_PUBLIC_AZURE_AD_TENANT_ID`

3. Apply schema

	`pnpm db:push`

4. (Optional) Seed sample data

	`pnpm db:seed`

5. Start dev server

	`pnpm dev`

App runs on `http://localhost:3005`.

## Useful commands

- `pnpm dev` — run local development server
- `pnpm build` — production build
- `pnpm start` — run production server
- `pnpm lint` — lint codebase
- `pnpm exec tsc --noEmit` — type-check only
- `pnpm db:generate` — generate Drizzle migrations
- `pnpm db:push` — push schema to DB
- `pnpm db:studio` — open Drizzle Studio
- `pnpm taxonomy:fetch` — refresh taxonomy source file

## Notes

- User roles are DB-managed (`users.roles`) and validated against app role constants.
- Authentication is delegated to Microsoft identity; authorization is enforced in-app using DB roles.
- Workflow emails are sent via delegated Microsoft Graph with outbox/retry safeguards.
