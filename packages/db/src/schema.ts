import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const jobStatus = pgEnum('job_status', [
  'queued',
  'rejected',
  'in-progress',
  'completed',
  'canceled',
  'failed',
]);

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 256 }).notNull(),
    kind: varchar('kind', { length: 128 }).notNull(),
    status: jobStatus('status').notNull().default('queued'),
    owner: varchar('owner', { length: 320 }),
    creator: varchar('creator', { length: 320 }).notNull(),
    externalRef: varchar('external_ref', { length: 256 }),
    parentJobId: uuid('parent_job_id'),
    rootJobId: uuid('root_job_id'),
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
    index('jobs_status_idx').on(table.status),
    index('jobs_owner_idx').on(table.owner),
    index('jobs_creator_idx').on(table.creator),
    index('jobs_external_ref_idx').on(table.externalRef),
    index('jobs_parent_job_id_idx').on(table.parentJobId),
    index('jobs_root_job_id_idx').on(table.rootJobId),
  ],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
