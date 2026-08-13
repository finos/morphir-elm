'use strict';

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
 * This guard swallows exactly that GC diagnostic and re-throws everything
 * else. An ordinary double-close via `fs.close()` callback has the same
 * `EBADF`/`close` fields but without the GC message, so it must not be
 * swallowed — it indicates a real resource-handling bug while work is still
 * in progress.
 * It is idempotent across multiple `require()` calls via a global flag.
 */
if (!globalThis.__morphirEbadfGuardInstalled) {
  globalThis.__morphirEbadfGuardInstalled = true;
  process.on('uncaughtException', (err) => {
    if (
      err &&
      err.code === 'EBADF' &&
      err.syscall === 'close' &&
      typeof err.message === 'string' &&
      err.message.includes('garbage collection')
    ) {
      return;
    }
    throw err;
  });
}
