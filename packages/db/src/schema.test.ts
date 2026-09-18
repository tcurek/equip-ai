import { describe, expect, it } from 'vitest';
import { runStatus } from './schema.js';

describe('run schema enums', () => {
  it('keeps the public run states stable', () => {
    expect(runStatus.enumValues).toEqual(['queued', 'running', 'succeeded', 'failed']);
  });
});
