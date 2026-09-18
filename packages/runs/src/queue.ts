import { Queue, Worker, type ConnectionOptions, type JobsOptions } from 'bullmq';
import { fakeHarness, type HarnessResult } from './harness.js';
import { claimQueuedRun, markRunFailed, markRunSucceeded, queueRun, type QueueRunInput } from './lifecycle.js';
import type { Run } from '../../db/src/index.js';

export const runsQueueName = 'runs';

export type RunQueueData = {
  runId: string;
};

export type RunHarness = (run: Run) => Promise<HarnessResult>;

export function redisConnectionFromEnv(): ConnectionOptions {
  const url = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export type RunsQueue = Queue<RunQueueData, HarnessResult | null, 'run'>;

export function createRunsQueue(connection = redisConnectionFromEnv()): RunsQueue {
  return new Queue<RunQueueData, HarnessResult | null, 'run'>(runsQueueName, { connection });
}

export async function enqueueRun(
  input: QueueRunInput,
  queue: RunsQueue = createRunsQueue(),
  options: JobsOptions = {},
): Promise<Run> {
  const run = await queueRun(input);
  await queue.add('run', { runId: run.id }, { jobId: run.id, priority: input.priority, ...options });
  return run;
}

export async function processRun(runId: string, harness: RunHarness = fakeHarness): Promise<HarnessResult | null> {
  const run = await claimQueuedRun(runId);

  if (!run) {
    return null;
  }

  try {
    const result = await harness(run);
    await markRunSucceeded(run.id, result.summary);
    return result;
  } catch (error) {
    await markRunFailed(run.id, error);
    throw error;
  }
}

export function createRunWorker(
  options: {
    connection?: ConnectionOptions;
    concurrency?: number;
    harness?: RunHarness;
  } = {},
): Worker<RunQueueData, HarnessResult | null, 'run'> {
  return new Worker<RunQueueData, HarnessResult | null, 'run'>(
    runsQueueName,
    (job) => processRun(job.data.runId, options.harness),
    {
      connection: options.connection ?? redisConnectionFromEnv(),
      concurrency: options.concurrency ?? Number(process.env.RUN_WORKER_CONCURRENCY ?? 4),
    },
  );
}
