# Equip AI Manager MVP

## Summary

Build `equip-ai` as an open-source TypeScript monorepo: a self-hosted agent manager that accepts triggers, schedules isolated agent runs, invokes bring-your-own coding harnesses, and exposes a dashboard for run status, costs, logs, tools, and outcomes.

Default v1 stack:

- Node.js current LTS, TypeScript, ESM, and pnpm workspaces
- Fastify API backend
- Postgres + Drizzle for durable app data and migrations
- Redis + BullMQ for queues/concurrency
- Docker CLI as the first sandbox runtime
- Codex CLI as the first harness adapter
- Slack + GitHub as the first real integrations
- Vite + React dashboard
- Pino structured logs
- Single-admin token auth
- Vercel AI SDK for model/provider abstraction where Equip calls LLMs directly, added only when direct LLM calls are needed
- Langfuse as optional observability/evals integration, not a required dependency

## Key Changes

- Create a monorepo with `apps/api`, `apps/dashboard`, `apps/worker`, and shared packages for config, types, integrations, harnesses, sandboxes, and telemetry.
- Define stable core entities: `AgentConfig`, `Run`, `Trigger`, `HarnessAdapter`, `SandboxAdapter`, `ToolDefinition`, `SkillDefinition`, `KnowledgeSource`, and `Guardrail`.
- Implement the first run flow: Slack command/event -> API validates trigger -> BullMQ job -> worker creates Docker sandbox -> clones GitHub repo -> runs Codex CLI adapter -> stores logs/results -> dashboard displays status.
- Keep harnesses pluggable from day one, but only ship one real adapter: `codex-cli`. Add placeholder docs/interfaces for Claude Code, OpenRouter/AI SDK agents, and generic shell.
- Keep integrations pluggable, but only ship Slack trigger and GitHub repo access initially. Gmail, Drive, Teams, Confluence, Jira, HubSpot, Salesforce stay documented future plugins.
- Add config-driven limits: max concurrent runs, per-agent allowed tools, model/provider settings, timeout, repo allowlist, environment variables, and sandbox resource limits.
- Use Docker isolation first. The sandbox interface must allow later Modal, Daytona, E2B, Firecracker, or Kubernetes adapters without changing run orchestration.

## Framework And Runtime Choices

- Use pnpm workspaces for the monorepo. npm works, but pnpm keeps installs smaller and workspace behavior predictable.
- Target Node.js current LTS instead of bleeding-edge current. Orchestration, queues, CLIs, SDKs, and Docker integrations are mature there.
- Use TypeScript with ESM across apps/packages.
- Use `tsx` for development and scripts. Add a bundler such as `tsup` only if shared packages need distributable builds.
- Use Fastify instead of NestJS or Express. It gives validation/logging/plugin hooks without Nest's boilerplate.
- Use Drizzle instead of Prisma for a smaller SQL-first database layer and straightforward migrations.
- Use Vite + React for the dashboard. Skip Next.js until SSR, product pages, or richer auth justify it.
- Avoid agent frameworks in v1. Equip should wrap real harness CLIs behind small adapters first.

Initial dependency set:

- Root/dev: `typescript`, `tsx`, `vitest`, `eslint`, `prettier`
- API: `fastify`, `@fastify/cors`, `zod`, `pino`, `pg`, `drizzle-orm`, `bullmq`, `ioredis`
- Worker: `bullmq`, `ioredis`, `execa`, `zod`, `pino`
- Integrations: `@slack/web-api`, `@octokit/rest`
- Dashboard: `vite`, `react`, `react-dom`, `react-router`, `@tanstack/react-query`, `@tanstack/react-table`
- Optional later: `@opentelemetry/api`, `ai`, `langfuse`

Skipped for v1: NestJS, Temporal, Prisma, PM2, Kubernetes, GraphQL, broad agent frameworks, broad plugin test matrices.

## Service Lifecycle

Default self-hosting target is Docker Compose with `restart: unless-stopped` for `api`, `worker`, `dashboard`, `postgres`, and `redis`.

Tradeoffs:

- Docker Compose: default v1 path; simplest self-hosted install and service restart story.
- systemd: useful for bare-metal installs, document later.
- PM2: acceptable for quick Node-only VPS installs, but not the default because Docker already manages processes.
- Kubernetes: future enterprise deployment path, not a v1 requirement.

## Agent Run Execution

The worker should own run execution:

1. Claim BullMQ job.
2. Mark the `Run` as running.
3. Create a temporary working directory.
4. Clone the allowed GitHub repo/ref.
5. Start a Docker container through the Docker CLI via `execa`.
6. Run the selected harness adapter, starting with Codex CLI.
7. Stream/store logs as run events.
8. Collect artifacts and harness result.
9. Mark the run succeeded/failed/timed out.
10. Clean up the container and working directory.

Prefer Docker CLI calls over `dockerode` initially. The CLI is easier to debug and mirrors what self-hosters already know. Add a Docker API client only when CLI orchestration becomes the bottleneck.

## Interfaces

Public API:

- `POST /triggers/slack`
- `POST /runs`
- `GET /runs`
- `GET /runs/:id`
- `GET /agents`
- `POST /agents`
- `GET /metrics/summary`

Worker contract:

- Job input includes `trigger`, `agentConfigId`, `repo`, `task`, `actor`, and optional `contextRefs`.
- Job output includes `status`, `summary`, `artifacts`, `cost`, `tokenUsage`, `toolCalls`, `logs`, and `harnessResult`.

Plugin contracts:

- `HarnessAdapter.run(input): Promise<HarnessResult>`
- `SandboxAdapter.create(input): Promise<SandboxSession>`
- `IntegrationAdapter.register(app): void`
- `KnowledgeConnector.search(query, scope): Promise<KnowledgeHit[]>`

## Dashboard

- Build a practical internal dashboard, not a marketing page.
- First views:
  - Runs table with status, agent, trigger, repo, cost, duration, created time
  - Run detail with log stream, tool calls, final summary, artifacts, errors
  - Agent config list/detail
  - Basic metrics: success rate, failures, average duration, estimated cost
- Auth can be single-admin token in v1. Full RBAC is future work.

## Data And Observability

- Store app data in Postgres with a small migration system.
- Store queue state in Redis through BullMQ.
- Emit structured logs and OpenTelemetry-compatible spans.
- Langfuse integration is optional via env/config, using current JS/TS tracing packages. Add only enough wiring to record runs, model generations, tools, retrievers, guardrails, and errors.

## Test Plan

- Unit-test config parsing, adapter contracts, Slack signature validation, and run state transitions.
- Add one integration test for API -> queue -> worker with fake sandbox/harness.
- Add one smoke test for Docker sandbox creation and command execution.
- Add one dashboard smoke test that verifies the runs table renders from mocked API data.
- No broad plugin test matrix in v1; add when second real adapter/integration lands.

## Assumptions

- License: permissive core, default to Apache-2.0 unless you prefer MIT later.
- Runtime: Node.js is good enough for v1 because orchestration, APIs, dashboard, queues, and provider SDKs are all strong in TS. Python can be added later for specific RAG/ML workers.
- Temporal is intentionally skipped for v1; BullMQ is simpler for self-hosters and supports queues/workers/concurrency with Redis.
- RAG/OKF starts as an interface plus minimal GitHub/repo context. Real Confluence/Drive/wiki indexing comes after the first runnable loop.
