# PulseGlucoseWeb

Public product site and documentation portal for PulseGlucose ecosystem.

## What this project contains

- Marketing and trust pages for potential clients
- Consumer app showcase
- Public consumer API docs generated from machine contracts
- Agent focused page and raw JSON mirrors
- Private owner dashboard with a temporary POC sign in

## Stack

- Next.js App Router
- Tailwind CSS
- MDX
- Zod
- OpenAPI types
- Vitest and Playwright

## Routes

- `/`
- `/api`
- `/apps`
- `/docs`
- `/docs/getting-started`
- `/docs/authentication`
- `/docs/workflows`
- `/docs/endpoints`
- `/docs/endpoints/[id]`
- `/docs/errors`
- `/agents`
- `/agents/context.json`
- `/agents/openapi.json`

## Environment

Copy `.env.example` to `.env.local`:

```bash
AUTH_POC_EMAIL=owner@pulseglucose.local
NEXT_PUBLIC_SITE_URL=http://localhost:3001
PULSE_API_BASE_URL=https://glucose-nu.vercel.app
PULSE_API_ADMIN_TOKEN=replace_with_existing_api_admin_bearer_token
PULSE_API_STATUS_TOKEN=optional_existing_status_page_token
```

## Contract flow

- Canonical contracts stay in PulseGlucoseApi
- This project fetches:
  - `${PULSE_API_BASE_URL}/docs/openapi.json`
  - `${PULSE_API_BASE_URL}/docs/agent-context.json`
- Fetch is server side with 10 minute revalidation
- If remote fetch fails, bundled snapshots in `content/contracts/*.snapshot.json` are used

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run test:links`
- `npm run contracts:validate`

## POC sign in

For now the dashboard uses a temporary owner cookie instead of a real auth provider.
Open `/login` and click `Sign in`.

## CI checks

GitHub Actions runs lint, typecheck, unit tests, contract validation, broken link check, build, and Playwright smoke tests.
