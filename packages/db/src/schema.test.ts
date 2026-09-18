import { describe, expect, it } from 'vitest';
import { jobStatus } from './schema.js';

describe('job schema enums', () => {
  it('keeps the public job states stable', () => {
    expect(jobStatus.enumValues).toEqual([
      'queued',
      'rejected',
      'in-progress',
      'completed',
      'canceled',
      'failed',
    ]);
  });
});
