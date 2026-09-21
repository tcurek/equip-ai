import { desc, sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const runStatus = pgEnum('run_status', ['queued', 'running', 'succeeded', 'failed']);

export const runs = pgTable(
  'runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 256 }).notNull(),
    kind: varchar('kind', { length: 128 }).notNull(),
    status: runStatus('status').notNull().default('queued'),
    owner: varchar('owner', { length: 320 }),
    creator: varchar('creator', { length: 320 }).notNull(),
    externalRef: varchar('external_ref', { length: 256 }),
    parentRunId: uuid('parent_run_id'),
    rootRunId: uuid('root_run_id'),
    priority: integer('priority').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(1),
    error: text('error'),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    startedAt: timestamp('started_at', { withTimezone: true }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('runs_status_idx').on(table.status),
    index('runs_queue_idx').on(table.status, desc(table.priority), table.createdAt),
    index('runs_owner_idx').on(table.owner),
    index('runs_creator_idx').on(table.creator),
    index('runs_external_ref_idx').on(table.externalRef),
    index('runs_parent_run_id_idx').on(table.parentRunId),
    index('runs_root_run_id_idx').on(table.rootRunId),
  ],
);

export const runEvents = pgTable(
  'run_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => runs.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 128 }).notNull(),
    message: text('message'),
    data: jsonb('data').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('run_events_run_id_created_at_idx').on(table.runId, table.createdAt), index('run_events_type_idx').on(table.type)],
);

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type RunEvent = typeof runEvents.$inferSelect;
export type NewRunEvent = typeof runEvents.$inferInsert;
