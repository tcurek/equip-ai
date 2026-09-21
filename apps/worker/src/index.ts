import { createRunWorker } from '@equip-ai/runs';

const worker = createRunWorker();

console.log(`Worker listening for runs with concurrency ${worker.opts.concurrency ?? 4}`);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    console.log(`Received ${signal}; closing worker`);
    await worker.close();
    process.exit(0);
  });
}
