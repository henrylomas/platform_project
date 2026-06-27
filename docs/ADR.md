# Architecture Decision Record

## 1. Monorepo structure

**Why Nx**

Nx provides explicit app/library boundaries enforced by the dependency graph. The `affected` commands mean CI only runs builds and tests for projects touched by a given commit — a team adding a feature to `apps/api` does not trigger the `apps/web` test suite. As the codebase grows, this keeps CI times bounded rather than linear in the number of projects.

**Why an integrated workspace (single `node_modules`)**

A single `node_modules` at the root eliminates duplicate package versions and simplifies `tsconfig.base.json` path resolution. The alternative — npm workspaces with per-package installs — trades simplicity for package isolation that is rarely needed early on.

**Library boundary**

`libs/observability` declares no dependency on any app. It is a pure TypeScript library with zero imports from Express, React, or browser-specific APIs. Any app can consume it without circular dependency risk. The `tsconfig.base.json` path alias (`@platform/observability`) is the only coupling point.

**Scaling to 10 teams**

- Add Nx Cloud for distributed remote caching: every developer and CI run shares the same build/test cache, cutting cold-build times to near zero for unchanged projects.
- Enforce module boundaries via `@nx/enforce-module-boundaries` lint rule: define tags (`scope:api`, `scope:web`, `type:lib`) and declare which tags may import which. This prevents a web component accidentally importing an API-only module.
- Use Nx task pipelines (`dependsOn`) to sequence cross-project builds correctly without manual orchestration.

---

## 2. Observability library design

**Minimal provider interface**

`ObservabilityProvider` exposes a single `log(entry: LogEntry): void` method. One method means one thing to implement: any provider written by any team member is complete in under ten lines. A richer interface (separate `debug()`, `info()` etc. on the provider) would duplicate the arity logic in every provider rather than once in the client.

**Factory pattern**

`createObservability(provider, service)` decouples consumers from provider instantiation. Application code never calls `new ConsoleProvider()` in business logic — it receives an `ObservabilityClient` and calls `.info()`. Changing the provider from `ConsoleProvider` to `DatadogProvider` requires touching exactly one line: the call to `createObservability` in `main.ts`.

**Deliberate omissions**

Metrics, distributed tracing, and log sampling are out of scope for this challenge. Adding them later does not require changing the `ObservabilityProvider` interface — a future `MetricsProvider` or `TracingProvider` would be a separate interface alongside this one, not a modification to it.

**Redaction at the library level**

Sensitive field redaction (password, token, secret, authorization, key) is applied inside `ObservabilityClient.emit()` before any provider receives the entry. Application code passes raw context objects and never needs to remember to scrub them. This is a security invariant enforced at the library boundary rather than by convention.

**Redaction lives in `client.ts`, not in providers**

If redaction were in each provider, adding a fourth provider would require adding redaction there too — a rule enforced by convention rather than structure. Because redaction happens before `provider.log()` is called, providers are guaranteed never to see raw secrets regardless of how many are added.

---

## 3. Observability provider switching mechanism

**How it works at the call site**

```ts
// Application code — unchanged when the provider changes
client.info('order placed', { orderId: '123' });
```

The application calls `client.info()`. The `ObservabilityClient` applies redaction, stamps `timestamp` and `service`, then delegates to `provider.log()`. The consumer never references the provider directly.

**How to swap**

Change the provider passed to `createObservability()` at the app entry point only:

```ts
// Before
const obs = createObservability(new ConsoleProvider(), 'api');

// After — zero other files change
const obs = createObservability(new DatadogProvider(), 'api');
```

No feature code changes. No tests change. The test suite uses `NoopProvider` in every test so tests are equally unaffected by the swap.

**Real Datadog integration**

The `DatadogProvider` stub in this repo logs with a `[datadog]` prefix. A production integration would:

1. `npm install dd-trace`
2. Call `require('dd-trace').init({ service, env, version })` once at process startup, before any other imports.
3. Replace the `console.log` stub with `tracer.logger.log()` or forward `LogEntry` fields to the Datadog Agent via its HTTP intake API.

The `ObservabilityClient` interface and all call sites remain unchanged.

---

## 4. Hosting provider choice and ephemeral lifecycle

**Why Railway over AWS**

Railway's deployment API maps directly to the GitHub Actions PR lifecycle: one CLI call creates a service, one call tears it down. PR-isolated environments are a first-class feature (no custom VPC, Route 53, or ECS task definition required). The free tier is sufficient for a technical challenge with low traffic. The only credential required is `RAILWAY_TOKEN`.

AWS would offer more control (fine-grained IAM, VPC isolation, ECS/EKS) but the operational overhead — ECR push, task definition registration, ALB target group management, Route 53 record creation — is disproportionate for ephemeral PR previews and would obscure the architectural intent of the challenge.

**Trade-offs**

| | Railway | AWS |
|---|---|---|
| Setup time | Minutes | Hours |
| Operational control | Low | High |
| Cost visibility | Simple dashboard | Cost Explorer + budget alerts |
| Vendor lock-in | High | Medium (open standards) |
| Scaling ceiling | Medium | Effectively unlimited |

**Failure modes**

- *Railway API timeout*: the `railway up --detach` call succeeds but Railway never starts the container. The health-check polling loop exits non-zero after 5 minutes, failing the CI job explicitly rather than silently hanging.
- *Docker build failure*: the `docker/build-push-action` step fails and exits before any Railway calls are made. The PR comment is never posted, making the failure visible.
- *Health check never passes*: the polling loop logs each failed attempt with its attempt number, then exits non-zero. The Railway logs remain accessible in the Railway dashboard for post-mortem.

**For a team of 20**

- Add deployment status checks to the branch protection rules so a failing health check blocks the merge.
- Post Slack notifications from the workflow on failure using `slackapi/slack-github-action`.
- Add cost guardrails: a scheduled workflow that queries Railway's API and tears down any PR environment older than 24 hours with no associated open PR.
- Move `RAILWAY_PROJECT_ID` into a separate Railway environment per team (e.g. `staging`, `preview`) to prevent preview deployments interfering with shared staging infrastructure.
