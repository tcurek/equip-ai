import type { Run } from '../../db/src/index.js';

export type HarnessResult = {
  summary: string;
};

type FakeHarnessMetadata = {
  task?: string;
  fail?: boolean;
};

export async function fakeHarness(run: Run): Promise<HarnessResult> {
  const metadata = run.metadata as FakeHarnessMetadata;

  if (metadata.fail) {
    throw new Error('fake harness failed');
  }

  return {
    summary: metadata.task ? `Fake harness completed: ${metadata.task}` : 'Fake harness completed',
  };
}
