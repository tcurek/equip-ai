import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const values = vi.fn(async () => undefined);
  return {
    db: { insert: vi.fn(() => ({ values })) },
    runEvents: {},
    runs: {},
    values,
  };
});

vi.mock('../../db/src/index.js', () => mocks);

const { createRunEvent } = await import('./lifecycle.js');

describe('createRunEvent', () => {
  it('inserts an append-only run event', async () => {
    const event = {
      runId: '00000000-0000-0000-0000-000000000000',
      type: 'queued',
      message: 'Queued run: test',
      data: { task: 'say hi' },
    };

    await createRunEvent(event);

    expect(mocks.db.insert).toHaveBeenCalledWith(mocks.runEvents);
    expect(mocks.values).toHaveBeenCalledWith(event);
  });
});
