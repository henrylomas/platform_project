# Architecture Decision Record

## 1. Monorepo structure

I chose Nx because it manages the monorepo dependency graph automatically. It enforces boundaries in two directions: apps can import from libs, but libs can never import from apps, and apps cannot import from each other. That prevents circular dependencies. If the observability library could import from apps/api, you would create a cycle and the library would stop being independently buildable and testable.

CI efficiency was another reason. Nx with GitHub Actions calculates which projects are actually impacted by a PR and only builds and tests those. With 10 or more teams this makes a significant difference. A change in apps/api does not trigger a rebuild of apps/web or libs/observability unless they are actually affected. That keeps CI times predictable as the codebase grows.

I also included a minimal AI-driven development setup because I use Claude as a core part of my engineering workflow, not to generate code blindly, but to work from specifications and maintain consistency. The .ai/rules/ files define the coding standards any AI tool should follow in this repo: strict TypeScript, no console.log in application code, and file size limits. The .ai/specs/observability.md was the actual spec I wrote before implementing the library, defining its purpose, core types, and behavior before a single line of code was written. That is what spec-driven development looks like in practice.

## 2. Observability library design

The library solves logging with a provider-agnostic design. If you call console.log directly in 50 places across your apps and tomorrow you decide to switch to Datadog, you have to find and replace every single call across every app. That is a recipe for disaster in a project with several teams depending on it, because each team implemented logging differently, with different formats and different levels.

The solution is a single interface with one method: log(). Any provider must implement it. Think of it as a mask over the logging implementation. The app always calls the same face. Behind the mask can be Console, Datadog, or anything else. Swapping the mask is one line at the app entry point. Nothing behind it changes. This is the Strategy pattern: you define an interface, choose the implementation at runtime, and the rest of the code never knows which strategy is active.

Each provider answers a different need. ConsoleProvider is for development and basic production, printing structured JSON to stdout which any log aggregator like CloudWatch or Railway can read. NoopProvider is for tests, discarding everything silently so your test suite produces no log output. DatadogProvider is a stub that demonstrates the interface supports cloud integrations without needing real credentials.

Metrics, distributed tracing, and log sampling were deliberately left out. Adding them would have been over-engineering for this challenge. The goal was to show how to keep a monorepo working with a shared library. I made sure it works as a solid MVP within the time constraints.

## 3. Observability provider switching mechanism

Swapping providers is a one line change at the app entry point. You pass a different provider to createObservability() and that is it. No feature code changes, no tests change, no other files change.

The reason is that the app never talks to the provider directly. It only calls obs.info(), obs.error() on the client. The client internally delegates to whatever provider was passed at startup. You change the constructor argument and the entire app switches behavior.

```typescript
// Before
const obs = createObservability(new ConsoleProvider(), 'api');

// After. Nothing else changes.
const obs = createObservability(new DatadogProvider(), 'api');
```

For a real Datadog integration you would add the dd-trace SDK, initialize the tracer at app startup, and in DatadogProvider.log() forward the LogEntry fields to the Datadog agent. This was my first time working directly with Datadog, but the interface already supports it. Nothing in the application code would change.

## 4. Hosting provider choice and ephemeral lifecycle

Railway's deployment API maps directly to GitHub Actions lifecycle events. PR-isolated environments are a first-class concept in Railway, not something I would have to build myself. The free tier works for this challenge and setup requires a single token secret.

With AWS I would have used ECS Fargate with CDK, which gives more control but significantly more complexity for a 3-day challenge. The trade-off was speed and simplicity over control. In a production platform for a team of 20 I would use AWS. Cost guardrails, VPC isolation, and infrastructure as code with CDK are non-negotiable at that scale.

Three failure modes are worth noting. First, Railway API timeout during deploy. If the process is slow I would add a retry mechanism with an exponential backoff strategy. Second, Docker build failure. I would update the PR comment to reflect that state clearly so the developer knows immediately what failed. Third, the health check polling timing out if the app takes longer than expected to start. I would increase the timeout threshold and surface the failure clearly in the PR comment.

For a team of 20 I would add Slack notifications on failure, auto-teardown of environments after 24 hours idle to prevent forgotten PRs accumulating cost, and deployment status checks on branch protection rules so a failing health check blocks the merge.
