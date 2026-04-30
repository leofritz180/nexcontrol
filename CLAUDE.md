# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout note

The actual Next.js app lives in `nexcontrol-final/` (the parent `nexcontrol-FINAL-v6/` is just a wrapper folder). All commands below assume the working directory is `nexcontrol-final/`.

## Commands

```bash
npm install
npm run dev      # next dev on port 3000
npm run build    # next build (deploy uses `npx next build --no-lint`)
npm run start    # next start on port 3000
```

There is **no test suite and no linter step** — validation is manual. Do not invent `npm test`/`npm lint` invocations. Deploy is automatic on `git push` to `main` via Vercel.

Remotion (video generation for `ProfitShowcase`) uses its own CLI: `npx remotion studio` / `npx remotion render`. Entry point is configured in `remotion.config.js` → `remotion/Root.jsx`.

## Required env vars

Copy `.env.example` → `.env.local`. The app boots without them but logs an error and uses placeholder Supabase URLs (no DB will work). Variables in use:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-side Supabase (`lib/supabase/client.js`)
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, in API routes
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` — web-push notifications
- `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_SECRET` — Asaas PIX gateway
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` — Mercado Pago PIX gateway (alternative to Asaas)
- `CRON_SECRET` — guards `/api/cron/trial-notifications` (Vercel cron, daily at 12:00 UTC, configured in `vercel.json`)

## Architecture

### Stack
Next.js 14 App Router (JavaScript, not TypeScript) + Supabase (Postgres + Auth + RLS) + Framer Motion + Tailwind. PWA via `public/sw.js` (registered inline in `app/layout.js`). Push via `web-push` + VAPID. Deployed on Vercel.

### Multi-tenant model
Every business table has a `tenant_id` and is filtered by Supabase RLS. There are three roles, all flowing through the same auth/profile table:

- **owner** — single hardcoded email (`leofritz180@gmail.com`); accesses `/owner` dashboard
- **admin** — tenant manager; full dashboard
- **operator** — restricted dashboard; **must not see financial fields** (`salario`, `bau`, `lucro_final`)

Role + tenant come from `profiles` table. `SubscriptionGate` (`components/SubscriptionGate.js`) wraps every page and gates access by trial / subscription status, with a 30s cache and a `FREE_PATHS` allowlist (`/login`, `/signup`, `/invite`, `/billing`, `/billing-mp`, `/`, `/owner`, `/slots`, `/proxy`, `/performance`, `/aulas`, `/demo`).

### Domain model (CPA / iGaming operations)

Read `project-context-v2.md` for the full glossary; the bare minimum:

- **Meta** = goal of N deposits on a network (W1, OKOK, VOY, DY, etc.). Soft-deleted via `deleted_at`.
- **Remessa** = one batch of deposits inside a meta. Has `deposito`, `saque`, `lucro`, `prejuizo`, `contas_remessa`, `slot_name`. `resultado = saque - deposito`.
- A meta is "fechada" by the admin who supplies `salario` (paid by network), `bau` (bonus), `custo_fixo` (proxy/SMS), `taxa_agente`.

### The lucro_final formula (critical — do not modify casually)

```
lucro_final = resultado_remessas + salario + bau - custo_fixo - taxa_agente
```

Where `resultado_remessas = sum(lucro) - sum(prejuizo)` across all remessas of the meta. Negative remessa results are normal — `salario + bau` compensate.

**Custos table separate from meta custos:** rows in `costs` (proxy, SMS, etc.) belong to the *tenant*, not a meta. They are subtracted from totals **once, on display only** — never persisted into a meta's `lucro_final`. The historic bug here (custos subtracted twice) is why the rule is: brutos in state, NET only in UI. See `project-context-v2.md` §10.

### Operator remuneration models
Stored on `tenants.operation_model` and per-meta on `metas.modelo_remuneracao`:
- `fixo_por_depositante` — admin pays R$ X per processed account
- `percentual_lucro` — admin pays X% of `lucro_final`
- `divisao_resultado` — operator takes X% of profit AND assumes X% of loss; requires explicit admin opt-in; not retroactive. Per-meta fields: `resultado_operador`, `resultado_admin`, `percentual_operador`.

### Demo mode
When a freshly-signed-up user has no metas, the dashboard renders a fully simulated dataset from `lib/demo-data.js` (3 fake operators, 8 metas, 19 remessas, costs, ranking) with a banner. Switches off automatically once the first real meta is created. **Demo and real data must never mix in the same view.**

### Routes (App Router)

- Public: `/`, `/login`, `/signup`, `/invite`, `/billing` (Asaas PIX), `/billing-mp` (Mercado Pago PIX), `/demo`
- Admin: `/admin`, `/operadores`, `/redes`, `/faturamento`, `/custos`, `/pix`, `/slots`, `/proxy`, `/tutorial`, `/planejamento`, `/afiliados`, `/aulas`
- Operator: `/operator`, `/performance`, plus shared `/slots`, `/proxy`, `/pix`
- Shared meta detail: `/meta/[id]` (admin and operator both use it; operator UI hides financial fields)
- Owner: `/owner`, `/owner/admins`, `/owner/afiliados`

### API routes
`app/api/` groups: `admin/planilha`, `affiliate`, `asaas/{create-payment,check-status,webhook}`, `aulas`, `cron/trial-notifications` (Vercel cron), `logout`, `mercadopago/{create-payment,check-payment}`, `meta`, `owner/{stats,affiliates}`, `presence` (30s ping, online = last 5min), `push/{subscribe,send}`, `remessa`, `render-profit-video` (Remotion render), `webhook`.

Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, gateway keys, VAPID private) live exclusively in API routes — never imported by client components.

### Realtime / liveness
No websockets. Polling cadence: 30s for the admin dashboard, 10s on active meta detail. Presence via `/api/presence` ping every 30s; "online" = ping in last 5min. Push notifications use VAPID + `web-push` server-side via `/api/push/send` (see `lib/push.js`, `lib/pushClient.js`).

### Insights engine
`lib/insights-engine.js` is an independent layer that emits operational alerts (`sequencia_negativa`, `prejuizo_acima_media`, `meta_parada`) through `/api/push/send`. Cooldowns are per (type, metaId, userId) in `sessionStorage` (30/20/60 min). Do not couple it to the rest of the notification flow.

### Database setup
There is no migration runner — Supabase SQL is checked in as **loose `supabase-*.sql` files at the repo root** that have been applied manually in order over time (`supabase-schema.sql` is the base; the rest are incremental patches like `supabase-multitenant.sql`, `supabase-asaas.sql`, `supabase-mp-payments.sql`, `supabase-fix-*.sql`, etc.). When schema changes, add a new `supabase-<feature>.sql` file rather than editing existing ones.

## Project conventions (enforced)

- **JavaScript only** (`.js`/`.jsx`). No TypeScript. `jsconfig.json` sets `baseUrl: "."` so imports like `components/X` resolve from root, but the codebase mostly uses relative paths (`../components/...`).
- **Inline styles via JS objects** for component-specific styling; Tailwind is configured but the codebase leans on inline styles + global CSS in `app/globals.css`. Don't introduce CSS modules.
- **Framer Motion** for animations (count-ups, fade-ups, page transitions in `AppLayout.js`). Avoid heavy CSS animations.
- **Sidebar fixed at 248px** desktop (`AppLayout.js` sets `marginLeft: 248`), drawer at ≤768px.
- **Currency formatting must be brazilian** (`R$ X.XXX,XX`). When parsing user input, use the project's `parseVal` helper — `1.055` means `1055`, not `1.055`. Inputs use `type="text" inputMode="decimal"`, never `type="number"` (mouse wheel changing values is a bug fixed at the layout level: `app/layout.js` blurs number inputs on wheel).
- **`type="button"` is mandatory** on every non-submit button inside a form (slot pickers and similar were submitting forms accidentally).
- **`toFixed(2)` before persisting** any financial value.
- **Buttons inside forms**: never submit by accident — always `type="button"` unless it is the explicit submit.
- Editing a closed meta must use the `update_lucro_only` flag — closing logic is destructive and overwrites bau/salario if re-run.
- Avoid heavy blur on phones <480px; the dynamic background is already disabled there.

## What not to touch without care

These are the load-bearing pieces — read carefully before changing:

1. The `lucro_final` math and any place that subtracts custos.
2. RLS policies in `supabase-multitenant.sql` (a leak crosses tenants).
3. `SubscriptionGate` (a regression here gives free access to paid features).
4. `parseVal` and the brazilian-number input handling.
5. Demo-mode boundary in `lib/demo-data.js` consumers — never write demo data to Supabase.

## Reference docs in repo

- `project-context-v2.md` — the long-form spec (read this for domain detail, historical bugs, UI rules).
- `project-context.md` — older one-pager; superseded by v2 but still accurate on palette and tone.
- `README.md` — minimal setup only.
