import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dir, "..");
const executable = join(
  root,
  "dist",
  "morphir-elm-extension",
  `morphir-elm-extension${process.platform === "win32" ? ".exe" : ""}`
);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

interface ProcessResult {
  readonly exitCode: number;
  readonly stdout: Uint8Array;
  readonly stderr: string;
}

interface CapturableChildProcess {
  readonly exited: Promise<number>;
  readonly stdout: BodyInit;
  readonly stderr: BodyInit;
  readonly kill: () => void;
}

interface PipeReaders {
  readonly stdout: (body: BodyInit) => Promise<Uint8Array>;
  readonly stderr: (body: BodyInit) => Promise<string>;
}

const responsePipeReaders: PipeReaders = {
  stdout: (body) => new Response(body).bytes(),
  stderr: (body) => new Response(body).text(),
};

function frameBody(body: string): Uint8Array {
  const bytes = encoder.encode(body);
  const header = encoder.encode(`Content-Length: ${bytes.byteLength}\r\n\r\n`);
  const frame = new Uint8Array(header.byteLength + bytes.byteLength);
  frame.set(header);
  frame.set(bytes, header.byteLength);
  return frame;
}

function frame(message: unknown): Uint8Array {
  return frameBody(JSON.stringify(message));
}

function request(method: string, params: unknown, id: string | number) {
  return { jsonrpc: "2.0", id, method, params };
}

function notification(method: string, params?: unknown) {
  return {
    jsonrpc: "2.0",
    method,
    ...(params === undefined ? {} : { params }),
  };
}

function appendFrames(frames: readonly Uint8Array[]): Uint8Array {
  const length = frames.reduce((total, value) => total + value.byteLength, 0);
  const output = new Uint8Array(length);
  frames.reduce((offset, value) => {
    output.set(value, offset);
    return offset + value.byteLength;
  }, 0);
  return output;
}

function findHeaderEnd(bytes: Uint8Array, start: number): number {
  for (let index = start; index <= bytes.byteLength - 4; index += 1) {
    if (
      bytes[index] === 13 &&
      bytes[index + 1] === 10 &&
      bytes[index + 2] === 13 &&
      bytes[index + 3] === 10
    ) {
      return index;
    }
  }
  return -1;
}

function decodeCompleteFrames(bytes: Uint8Array): readonly unknown[] {
  const messages: unknown[] = [];
  let offset = 0;

  while (offset < bytes.byteLength) {
    const headerEnd = findHeaderEnd(bytes, offset);
    if (headerEnd < 0) {
      throw new Error(
        `stdout contains an incomplete or unframed header at byte ${offset}`
      );
    }
    const header = decoder.decode(bytes.subarray(offset, headerEnd));
    const match = /^Content-Length: (\d+)$/iu.exec(header);
    if (match === null) {
      throw new Error(`stdout contains an invalid frame header: ${header}`);
    }
    const contentLength = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    if (!Number.isSafeInteger(contentLength) || bodyEnd > bytes.byteLength) {
      throw new Error("stdout contains a truncated frame body");
    }
    messages.push(
      JSON.parse(decoder.decode(bytes.subarray(bodyStart, bodyEnd)))
    );
    offset = bodyEnd;
  }

  return messages;
}

async function collectChildProcess(
  child: CapturableChildProcess,
  readers: PipeReaders = responsePipeReaders,
  timeoutMilliseconds = 5_000
): Promise<ProcessResult> {
  const stdout = readers.stdout(child.stdout);
  const stderr = readers.stderr(child.stderr);
  const completed = Promise.all([child.exited, stdout, stderr]).then(
    ([exitCode, stdoutBytes, stderrText]) => ({
      kind: "completed" as const,
      result: { exitCode, stdout: stdoutBytes, stderr: stderrText },
    }),
    (error: unknown) => ({ kind: "failed" as const, error })
  );
  let timer: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    completed,
    new Promise<{ readonly kind: "timed-out" }>((resolve) => {
      timer = setTimeout(() => {
        resolve({ kind: "timed-out" });
      }, timeoutMilliseconds);
    }),
  ]).finally(() => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  });
  if (outcome.kind === "completed") {
    return outcome.result;
  }

  child.kill();
  await Promise.allSettled([child.exited, stdout, stderr]);
  if (outcome.kind === "failed") {
    throw outcome.error;
  }
  throw new Error(
    `MEP extension did not terminate within ${timeoutMilliseconds} milliseconds`
  );
}

async function runExtension(
  input: Uint8Array,
  closeStdin = true
): Promise<ProcessResult> {
  if (!existsSync(executable)) {
    throw new Error(`Build the MEP extension first: ${executable}`);
  }
  const child = Bun.spawn([executable], {
    cwd: root,
    env: process.env,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  const collected = collectChildProcess(child);
  try {
    child.stdin.write(input);
    if (closeStdin) {
      child.stdin.end();
    } else {
      await child.stdin.flush();
    }
  } catch (error) {
    child.kill();
    await Promise.allSettled([collected]);
    throw error;
  }

  return collected;
}

function compileParams(uri: string, text: string, moduleName: string) {
  return {
    languageId: "elm",
    documents: [{ uri, languageId: "elm", version: 1, text }],
    package: { name: "local/example", exposedModules: [moduleName] },
    dependencies: [],
    options: { typesOnly: false, irVersion: "3" },
  };
}

describe("standalone Morphir Elm MEP extension", () => {
  test("starts draining both process pipes before the child exits", async () => {
    let resolveExit: (exitCode: number) => void = () => undefined;
    const exited = new Promise<number>((resolve) => {
      resolveExit = resolve;
    });
    const drains: string[] = [];
    const collected = collectChildProcess(
      {
        exited,
        stdout: "stdout",
        stderr: "stderr",
        kill: () => undefined,
      },
      {
        stdout: async (body) => {
          drains.push(String(body));
          return encoder.encode(String(body));
        },
        stderr: async (body) => {
          drains.push(String(body));
          return String(body);
        },
      },
      1_000
    );

    try {
      await Promise.resolve();
      expect(drains).toEqual(["stdout", "stderr"]);
    } finally {
      resolveExit(0);
      await collected;
    }
  });

  test("keeps host-native executables out of the portable npm package", async () => {
    const packageMetadata = JSON.parse(
      await readFile(join(root, "package.json"), "utf8")
    ) as {
      readonly bin?: Readonly<Record<string, string>>;
      readonly files?: readonly string[];
    };

    expect(packageMetadata.bin).not.toHaveProperty("morphir-elm-extension");
    expect(
      packageMetadata.files?.some((file) =>
        file.startsWith("dist/morphir-elm-extension")
      )
    ).toBe(false);
  });

  test("compiles real Elm, reports source errors, and stops after shutdown", async () => {
    const fixtureDir = join(import.meta.dir, "mep-extension");
    const validPath = join(fixtureDir, "Example.elm");
    const invalidPath = join(fixtureDir, "Invalid.elm");
    const [validSource, invalidSource] = await Promise.all([
      readFile(validPath, "utf8"),
      readFile(invalidPath, "utf8"),
    ]);
    const result = await runExtension(
      appendFrames([
        frame(
          request(
            "morphir.initialize",
            {
              protocolVersions: ["0.1"],
              host: { name: "integration-test", version: "0.1.0" },
            },
            1
          )
        ),
        frame(
          request(
            "morphir.frontend.compile",
            compileParams(
              pathToFileURL(validPath).href,
              validSource,
              "Example"
            ),
            "valid-compile"
          )
        ),
        frame(
          request(
            "morphir.frontend.compile",
            compileParams(
              pathToFileURL(invalidPath).href,
              invalidSource,
              "Invalid"
            ),
            3
          )
        ),
        frameBody('{"jsonrpc":'),
        frame(request("morphir.shutdown", {}, "shutdown")),
      ]),
      false
    );
    const responses = decodeCompleteFrames(result.stdout) as readonly Record<
      string,
      unknown
    >[];

    expect(result.exitCode).toBe(0);
    expect(result.stderr).not.toContain('"jsonrpc":"2.0"');
    expect(responses).toHaveLength(5);
    expect(responses[0]).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "0.1",
        extension: { id: "morphir-elm", types: ["frontend"] },
        capabilities: {
          frontend: { languages: [{ id: "elm" }], irVersions: ["3"] },
        },
      },
    });
    expect(responses[1]).toMatchObject({
      jsonrpc: "2.0",
      id: "valid-compile",
      result: {
        success: true,
        irVersion: "3",
        diagnostics: [],
        modules: ["Example"],
      },
    });
    expect(responses[1]).toHaveProperty("result.ir.formatVersion", 3);
    expect(responses[1]).toHaveProperty("result.ir.distribution.0", "Library");
    expect(responses[2]).toMatchObject({
      jsonrpc: "2.0",
      id: 3,
      result: {
        success: false,
        modules: [],
        diagnostics: [
          {
            severity: "error",
            code: "elm.parser",
            location: { uri: pathToFileURL(invalidPath).href },
          },
        ],
      },
    });
    expect(responses[3]).toEqual({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
    expect(responses[4]).toEqual({
      jsonrpc: "2.0",
      id: "shutdown",
      result: {},
    });
  }, 60_000);

  test("stops on an exit notification without writing a response", async () => {
    const result = await runExtension(
      appendFrames([
        frame(
          request(
            "morphir.initialize",
            {
              protocolVersions: ["0.1"],
              host: { name: "integration-test", version: "0.1.0" },
            },
            "initialize"
          )
        ),
        frame(notification("morphir.exit")),
      ]),
      false
    );

    expect(result.exitCode).toBe(0);
    expect(decodeCompleteFrames(result.stdout)).toHaveLength(1);
  });

  test("treats clean stdin EOF as a clean process exit", async () => {
    const result = await runExtension(new Uint8Array());

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toEqual(new Uint8Array());
    expect(result.stderr).not.toContain('"jsonrpc":"2.0"');
  });

  test("reports malformed framing on stderr and exits without stdout", async () => {
    const result = await runExtension(
      encoder.encode("Content-Length: nope\r\n\r\n"),
      false
    );

    expect(result.exitCode).not.toBe(0);
    expect(result.stdout).toEqual(new Uint8Array());
    expect(result.stderr).toContain("invalid Content-Length");
  });

  test("drains a large framed compile response", async () => {
    const declarations = Array.from(
      { length: 400 },
      (_, index) => `value${index} : Int\nvalue${index} = ${index}`
    ).join("\n\n");
    const source = `module Large exposing (..)\n\n${declarations}\n`;
    const result = await runExtension(
      appendFrames([
        frame(
          request(
            "morphir.initialize",
            {
              protocolVersions: ["0.1"],
              host: { name: "large-output-test", version: "0.1.0" },
            },
            "initialize"
          )
        ),
        frame(
          request(
            "morphir.frontend.compile",
            compileParams("file:///workspace/Large.elm", source, "Large"),
            "large-compile"
          )
        ),
        frame(request("morphir.shutdown", {}, "shutdown")),
      ]),
      false
    );
    const responses = decodeCompleteFrames(result.stdout);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.byteLength).toBeGreaterThan(64 * 1024);
    expect(responses).toHaveLength(3);
    expect(responses[1]).toHaveProperty("id", "large-compile");
    expect(responses[1]).toHaveProperty("result.success", true);
  }, 60_000);
});
