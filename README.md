# Equip AI

## **Config, ship, go.** Equip AI turns agent ops into a centralized control panel for your business.

Move beyond brittle scripts and isolated chat bots. Equip AI lets engineering and operations teams spin up specialized agents to handle mission-critical workflows: multi-tier support ticketing, dynamic internal Q&amp;A, real-time alert triage, deep infrastructure inspections, and complex cross-system data pipelines. 

### **✨What You Can Do**

- **Automate Routine Workflows:** Deploy agents for tickets, internal Q&amp;A, monitoring, and system checks.
- **Plug &amp; Play:** Bring your own custom plugins, coding harnesses, and triggers.
- **Maintain Full Control:** Keep critical governance knobs close at hand:
  - 💰 Track token usage
  - 📊 Evaluations &amp; guardrails
  - 🛠️ Custom tools, memory, skills, &amp; integrations
  - 🛑 Approvals &amp; oversight

## Development

Requires Node.js current LTS and pnpm.

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

`pnpm db:migrate` creates the Postgres tables from `packages/db/migrations/0001_runs.sql`.

Run lifecycle starts in `@equip-ai/runs`:

- `enqueueRun(...)` inserts a queued run and adds a BullMQ queue item.
- `createRunWorker()` picks queue items up, marks them `running`, runs the fake harness, then marks `succeeded` or `failed`.

Useful scripts:

```bash
pnpm db:migrate
pnpm build
pnpm test
pnpm lint
pnpm format
```

## License

Apache-2.0
