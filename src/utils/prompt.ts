import inquirer from 'inquirer';

export class AbortError extends Error {
  constructor() {
    super('ABORT');
    this.name = 'AbortError';
  }
}

/**
 * Prompt wrapper that supports ESC to abort.
 *
 * Detects ESC (\\x1B) and Ctrl+C (\\x03) via stdin data events,
 * closes inquirer's UI, and throws AbortError.
 */
export async function promptWithAbort<T extends Record<string, any>>(
  questions: any,
  answers?: Partial<T>,
): Promise<T> {
  let abortReject: (err: Error) => void;
  const abortPromise = new Promise<never>((_, reject) => {
    abortReject = reject;
  });

  const savedKill = process.kill;
  const savedExit = process.exit;
  process.kill = (() => true) as any;
  process.exit = (() => undefined as never) as any;

  const promptModule = inquirer.createPromptModule();
  const promptPromise: any = promptModule(questions as any, answers);

  const ui = promptPromise.ui;
  const rl = ui?.rl;

  if (rl && rl.input && typeof rl.input.on === 'function') {
    const ESC = '\x1B';
    const CTRL_C = '\x03';

    const onData = (data: Buffer | string) => {
      const ch = typeof data === 'string' ? data : data.toString();
      if (ch === ESC || ch === CTRL_C) {
        ui.close();
        abortReject(new AbortError());
      }
    };

    rl.input.on('data', onData);
    rl.on('close', () => {
      rl.input.removeListener('data', onData);
    });
  }

  try {
    const result = await Promise.race([promptPromise, abortPromise]);
    return result as T;
  } finally {
    process.kill = savedKill;
    process.exit = savedExit;
  }
}
