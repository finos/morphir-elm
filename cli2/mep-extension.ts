#!/usr/bin/env bun

import { compileElm } from "./mep/compiler";
import { encodeFrame, readFrames } from "./mep/framing";
import { createDispatcher } from "./mep/protocol";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function writeStdout(bytes: Uint8Array): Promise<void> {
  if (process.stdout.write(bytes)) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      process.stdout.off("drain", onDrain);
      process.stdout.off("error", onError);
    };
    process.stdout.once("drain", onDrain);
    process.stdout.once("error", onError);
  });
}

async function serve(): Promise<void> {
  const dispatcher = createDispatcher(compileElm);

  for await (const body of readFrames(process.stdin)) {
    const response = await dispatcher.dispatch(body);
    if (response !== null) {
      await writeStdout(encodeFrame(response));
    }
    if (dispatcher.state().kind === "stopped") {
      break;
    }
  }
}

try {
  await serve();
} catch (error) {
  process.stderr.write(`morphir-elm-extension: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
