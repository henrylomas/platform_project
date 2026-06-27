# Platform Project

A full-stack monorepo built as a Platform Engineering technical challenge. It contains an Express API, a React SPA, and a shared observability library — all scaffolded with Nx and deployed to Railway via GitHub Actions ephemeral PR environments.

---

## What this repo contains

| Path | What it is |
|---|---|
| `apps/api` | Express + TypeScript HTTP server. Single `GET /health` endpoint. |
| `apps/web` | Plain React + Vite SPA. Calls the API on load and reports its status. |
| `libs/observability` | Provider-agnostic structured logging library. Zero framework dependencies. |
| `.ai/` | Rules and specs for AI-assisted development in this repo. |
| `docs/` | Architecture Decision Records. |
| `.github/workflows/` | GitHub Actions workflow that spins up an isolated Railway environment per PR and tears it down on close. |

---

## Prerequisites

- **Node.js 20** — `node --version` should print `v20.x`
- **Docker** — required to build and run the containerised services locally
- **Railway CLI** — only needed if you are deploying manually: `npm install -g @railway/cli`

---

## Running locally

### Install dependencies

```bash
npm install
```

### Start the API (dev mode, port 3000)

```bash
npx nx serve api
```

### Start the web app (dev mode, port 4200)

```bash
npx nx serve web
```

The web app reads `VITE_API_URL` at build time. In dev mode Vite serves it directly, so the default fallback `http://localhost:3000` is used unless you set the variable in your shell before starting.

### Run both with Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| API | http://localhost:3000/health |
| Web | http://localhost:4200 |

The Compose file wires `VITE_API_URL=http://api:3000` so the web container can reach the API container by its service name. `VITE_API_URL` is passed as a Docker build arg, so it is baked into the Vite bundle at image build time.

### Run tests

```bash
npx nx test observability
```

---

## Repository structure

```
.
├── apps/
│   ├── api/          Express + TypeScript server
│   └── web/          React + Vite SPA
├── libs/
│   └── observability/ Provider-agnostic structured logging library
├── .ai/
│   ├── rules/        Coding standards AI tools must follow
│   └── specs/        Feature specifications used as implementation blueprints
├── docs/
│   └── ADR.md        Architecture Decision Records
├── .github/
│   └── workflows/
│       └── ephemeral.yml  PR environment lifecycle
├── docker-compose.yml
├── nx.json
├── tsconfig.base.json
└── package.json
```

### `apps/`

Each app is an independently buildable and deployable unit. They share nothing except what they explicitly import from `libs/`.

### `libs/`

`libs/observability` is a zero-dependency TypeScript library. It exposes a factory (`createObservability`), three providers (`ConsoleProvider`, `NoopProvider`, `DatadogProvider`), and the core types. Apps import it via the `@platform/observability` path alias defined in `tsconfig.base.json`.

### `.ai/`

Contains the rules and specs that govern AI-assisted development. The workflow is spec-first: a specification document is written in `.ai/specs/` before any implementation begins. AI tools treat the spec as the source of truth and follow the coding standards in `.ai/rules/`. See `.ai/README.md` for details.

### `docs/`

`ADR.md` records the four key architectural decisions made during this challenge: monorepo structure, observability library design, provider switching mechanism, and hosting provider choice.

---

## Hosting

**Railway** was chosen as the deployment target. Its deployment API maps directly to the GitHub Actions PR lifecycle: one CLI call creates a service, one call tears it down. PR-isolated preview environments are first-class — no VPC, load balancer, or DNS configuration required beyond a single `RAILWAY_TOKEN`.

See `docs/ADR.md § 4` for the full trade-off analysis versus AWS.

---

## AI-driven development

The `.ai/` folder is a convention for keeping AI tooling rules and feature specs version-controlled alongside the code. The intent:

- **Rules** (`.ai/rules/`) are persistent coding standards — TypeScript strictness, logging conventions, file size limits. AI tools read these before writing any code.
- **Specs** (`.ai/specs/`) are per-feature blueprints written before implementation. The `observability.md` spec, for example, defines every type, provider, and test requirement. The implementation in `libs/observability/` is derived directly from it.

This keeps AI-generated code predictable, reviewable, and aligned with team conventions without requiring prompt repetition across sessions.

---

## Environment variables

| Variable | Used by | Default | Notes |
|---|---|---|---|
| `PORT` | `apps/api` | `3000` | TCP port the Express server binds to |
| `VITE_API_URL` | `apps/web` | `http://localhost:3000` | Base URL of the API. Must be set at **build time** (Vite bakes it into the bundle). |
| `RAILWAY_TOKEN` | CI only | — | Authenticates the Railway CLI in GitHub Actions. Store as a GitHub Actions secret. |
| `RAILWAY_PROJECT_ID` | CI only | — | Identifies the Railway project to deploy into. Store as a GitHub Actions secret. |
