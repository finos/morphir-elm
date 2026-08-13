/**
 * Guard against Node 24 fatal EBADF on FileHandle GC (finos/morphir-elm#1282).
 *
 * Since Node 24 (DEP0137 EOL, https://github.com/nodejs/node/pull/58536),
 * a `fs.FileHandle` that is garbage-collected without an explicit `close()`
 * throws a fatal uncaughtException with `code === 'EBADF'` and
 * `syscall === 'close'` (message: "Closing file descriptor X on garbage
 * collection failed, close") instead of the previous deprecation warning.
 * The CLI's work has already completed successfully when this fires during
 * wind-down, so the process dying with exit 1 breaks build systems.
 *
 * This guard swallows exactly that error shape and re-throws everything else.
 * It is idempotent across multiple `import` calls via a global flag.
 */
const g = globalThis as unknown as { __morphirEbadfGuardInstalled?: boolean };
if (!g.__morphirEbadfGuardInstalled) {
  g.__morphirEbadfGuardInstalled = true;
  process.on('uncaughtException', (err: unknown) => {
    const e = err as { code?: string; syscall?: string } | null | undefined;
    if (e && e.code === 'EBADF' && e.syscall === 'close') {
      return;
    }
    throw err;
  });
}
