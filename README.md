# PulseGlucoseWeb

Public product site and documentation portal for PulseGlucose ecosystem.

## What this project contains

- Marketing and trust pages for potential clients
- Consumer app showcase
- Public consumer API docs generated from machine contracts
- Agent focused page and raw JSON mirrors

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
NEXT_PUBLIC_SITE_URL=https://pulse-glucose-web.vercel.app
PULSE_API_BASE_URL=https://glucose-nu.vercel.app
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

## CI checks

GitHub Actions runs lint, typecheck, unit tests, contract validation, broken link check, build, and Playwright smoke tests.
