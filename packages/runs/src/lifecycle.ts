import { and, eq, sql } from 'drizzle-orm';
import { db, runs, type NewRun, type Run } from '../../db/src/index.js';

export type QueueRunInput = {
  name: string;
  creator: string;
  task: string;
  kind?: string;
  owner?: string;
  priority?: number;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
};

export async function queueRun(input: QueueRunInput): Promise<Run> {
  const [run] = await db
    .insert(runs)
    .values({
      name: input.name,
      kind: input.kind ?? 'coding',
      status: 'queued',
      creator: input.creator,
      owner: input.owner,
      priority: input.priority ?? 0,
      maxAttempts: input.maxAttempts ?? 1,
      metadata: { ...input.metadata, task: input.task } satisfies NewRun['metadata'],
    })
    .returning();

  return run;
}

export async function claimQueuedRun(id: string): Promise<Run | null> {
  const [run] = await db
    .update(runs)
    .set({
      status: 'running',
      startedAt: new Date(),
      attempts: sql`${runs.attempts} + 1`,
    })
    .where(and(eq(runs.id, id), eq(runs.status, 'queued')))
    .returning();

  return run ?? null;
}

export async function markRunSucceeded(id: string, summary: string): Promise<Run> {
  const [run] = await db
    .update(runs)
    .set({
      status: 'succeeded',
      error: null,
      metadata: sql`${runs.metadata} || ${JSON.stringify({ summary })}::jsonb`,
      finishedAt: new Date(),
    })
    .where(eq(runs.id, id))
    .returning();

  return run;
}

export async function markRunFailed(id: string, error: unknown): Promise<Run> {
  const [run] = await db
    .update(runs)
    .set({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      finishedAt: new Date(),
    })
    .where(eq(runs.id, id))
    .returning();

  return run;
}
