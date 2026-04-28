# Automai Watcher

An Angular 21 SSR application for managing RPA (Robotic Process Automation) process monitors, watcher agents, and load tests.

This is a UI prototype / design reference — all data is seeded in-memory inside `src/app/app.ts` (no backend wired up yet). The intent of this repo is to capture the visual language, page flows, and component patterns that the dev team will productionise against the real Automai backend.

> **Built with** [Claude Code](https://claude.com/claude-code) and [Figma](https://www.figma.com/) for design.

---

## Tech stack

- **Angular 21** with Server-Side Rendering (`@angular/ssr`) and Express (`src/server.ts`)
- **TypeScript** (strict mode + strict templates)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Material Symbols Outlined** icons (loaded via Google Fonts CDN)
- **Inter** font family
- **Signals** for state management (no NgRx, no services-as-stores)
- **OnPush** change detection on the root component
- **Vitest** for unit tests, **angular-eslint** + **typescript-eslint** for linting

---

## Prerequisites

- **Node.js 20+** (`node --version`)
- **npm 10+** (ships with Node 20)

No API keys, secrets, or external services are required to run the app locally.

---

## Run locally

```bash
git clone <repo-url>
cd Auttomail
npm install
npm run dev
```

The dev server boots on **http://localhost:3000** with hot-module reload.

### Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 with HMR |
| `npm run build` | Production build (browser + SSR bundles) → `dist/app/` |
| `npm run watch` | Development build in watch mode |
| `npm run serve:ssr:app` | Serve the built SSR bundle (`node dist/app/server/server.mjs`) |
| `npm run lint` | Run angular-eslint + typescript-eslint |
| `npm test` | Run unit tests via Vitest |

### Optional environment variables

Copy `.env.example` → `.env.local` if you want to tweak defaults. Nothing is required.

```env
# DISABLE_HMR=true   # opt out of live reload during dev
```

---

## Project layout

```
Auttomail/
├─ src/
│  ├─ main.ts                  # Browser bootstrap
│  ├─ main.server.ts           # SSR bootstrap
│  ├─ server.ts                # Express SSR entry
│  ├─ styles.css               # Tailwind v4 theme tokens (--color-primary, etc.)
│  └─ app/
│     ├─ app.ts                # Root component — holds ALL app state via signals
│     ├─ app.html              # Single large template (~3000 lines, all tabs)
│     ├─ app.routes.ts         # Tab-based routes (data: { tab: '...' })
│     ├─ app.routes.server.ts  # SSR prerender config
│     ├─ drawers/              # Slide-in form panels (watcher / schedule / monitor)
│     └─ documentation/        # Design-system reference page (/documentation)
├─ public/                     # Static assets (favicon, getting-started.html, etc.)
├─ angular.json
├─ package.json
└─ tsconfig*.json
```

---

## Architecture notes for the dev team

### Single-component app

`src/app/app.ts` is the entire application. All domain models (`ProcessMonitor`, `RWatcher`, `TestRun`), seed data, and UI state live as signals on the `App` class. There are no shared services, no NgRx, and no dependency injection layer to learn — just signals and computed methods.

When you wire this up to a real backend, swap the `getDemoMonitors()` / `getDemoTestRuns()` factories for HTTP calls, and replace the `signal<T[]>` setters with the response payloads. The component templates won't need to change.

### Tab-based navigation

`app.routes.ts` declares one route per tab (`/dashboard`, `/process-monitors`, `/test-runs`, etc.). Every route is `children: []` — the actual tab content lives in `app.html` inside an `@if (activeTab() === 'X')` chain. Navigation is just `router.navigate(['/path'])` and the `NavigationEnd` listener in `App.ngOnInit` syncs `activeTab()`.

This keeps everything in one component for prototype velocity. If the team prefers per-route components, splitting each `@if` block into a standalone component is mechanical.

### Drawers

Drawers in `src/app/drawers/` (`add-watcher`, `add-schedule`, `create-process-monitor`) are standalone components communicating via `@Input` / `@Output`. The active drawer is controlled by the `activeDrawer` signal on `App`.

### Wizards

The `/help/new` route hosts a multi-step wizard with two branches (`monitor` vs `testing`). Step state is the `wizardStep` signal; the per-step UI is gated by `@if (wizardStep() === N)` blocks. `wizardCanProceed()` returns true/false to enable the Continue button.

### Hidden routes

A few helper pages are not linked from the main nav and are reachable via direct URL:

- `/help/new` — Smart Add Process / Test Plan wizard
- `/help/new3` — Chat-style process setup agent
- `/help/new4` — Test Monitor (live KPIs + run cards)
- `/documentation` — Design-system reference (with Markdown / PDF / Word export)

### Styling

Tailwind v4 with theme tokens defined in `src/styles.css` via `@theme`:

```css
--color-primary: #335A85;
```

Use `bg-primary`, `text-primary`, `border-primary/40` etc. throughout. Brand colours and component patterns are catalogued in `/documentation` — the page also exports to Markdown (Notion), PDF, and Word (.doc).

### SSR

The app prerenders all routes statically (see `app.routes.server.ts`). For dynamic data later, switch the relevant routes from `RenderMode.Prerender` to `RenderMode.Server`.

---

## Conventions

- Component selectors: `app-` prefix, kebab-case
- Directive selectors: `app` prefix, camelCase
- Standalone components everywhere — no `NgModule`s
- `OnPush` change detection
- Signals for all reactive state — avoid `BehaviorSubject` / class fields
- Inline templates inside drawer components; the main `app.html` is intentionally one file for now
- TypeScript strict mode + Angular strict templates are on

ESLint enforces selector prefixes and standard Angular style rules. Run `npm run lint` before opening a PR.

---

## Deployment

The current build target is **Vercel** (configured via `vercel.json` if present). The output of `npm run build` is a Node SSR bundle at `dist/app/server/server.mjs` plus a browser bundle in `dist/app/browser/`.

To self-host:

```bash
npm run build
node dist/app/server/server.mjs
```

The Express entry (`src/server.ts`) serves static files and falls back to Angular SSR.

---

## Credits

- **Design** — Figma
- **Implementation** — built iteratively with [Claude Code](https://claude.com/claude-code)
- **Framework** — Angular 21
