import { describe, expect, it } from 'vitest';
import { fakeHarness } from './harness.js';
import type { Run } from '../../db/src/index.js';

const baseRun = {
  id: '00000000-0000-0000-0000-000000000000',
  name: 'test',
  kind: 'coding',
  status: 'running',
  owner: null,
  creator: 'test@example.com',
  externalRef: null,
  parentRunId: null,
  rootRunId: null,
  priority: 0,
  attempts: 1,
  maxAttempts: 1,
  error: null,
  startedAt: new Date(),
  finishedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Omit<Run, 'metadata'>;

describe('fakeHarness', () => {
  it('returns a deterministic success summary', async () => {
    await expect(fakeHarness({ ...baseRun, metadata: { task: 'say hi' } })).resolves.toEqual({
      summary: 'Fake harness completed: say hi',
    });
  });

  it('can fail for lifecycle testing', async () => {
    await expect(fakeHarness({ ...baseRun, metadata: { fail: true } })).rejects.toThrow('fake harness failed');
  });
});
