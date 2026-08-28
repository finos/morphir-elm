import { describe, expect, spyOn, test } from "bun:test";

import type { CompileRequest } from "./protocol";
import { createDispatcher } from "./protocol";
import { createBuildFromScratch } from "../../packages/cli2/worker-build";
import {
  compileElm,
  createElmCompiler,
  sourceModuleName,
  toWorkerBuildInput,
  workerPositionToMep,
} from "./compiler";

const sourceUri = "file:///workspace/local/example/Example.elm";
const validSource = `module Example exposing (add)

add : Int -> Int -> Int
add left right = left + right
`;

function dependencyDistribution(packageName: readonly (readonly string[])[]) {
  return {
    formatVersion: 3,
    distribution: ["Library", packageName, [], { modules: [] }],
  };
}

function workerIr(
  packageName: readonly (readonly string[])[] = [["local"], ["example"]]
) {
  return {
    formatVersion: 3,
    distribution: [
      "Library",
      packageName,
      [],
      {
        modules: [
          [
            [["example"]],
            {
              access: "Public",
              value: { types: [], values: [], doc: null },
            },
          ],
        ],
      },
    ],
  };
}

function request(overrides: Partial<CompileRequest> = {}): CompileRequest {
  return {
    languageId: "elm",
    documents: [
      {
        uri: sourceUri,
        languageId: "elm",
        version: 1,
        text: validSource,
      },
    ],
    package: { name: "local/example", exposedModules: ["Example"] },
    dependencies: [],
    options: { typesOnly: false, irVersion: "3" },
    ...overrides,
  };
}

const encoder = new TextEncoder();

function rpc(method: string, params: unknown, id: number): Uint8Array {
  return encoder.encode(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
}

async function compileThroughDispatcher(
  compile: Parameters<typeof createDispatcher>[0],
  params: unknown
) {
  const dispatcher = createDispatcher(compile);
  await dispatcher.dispatch(
    rpc(
      "morphir.initialize",
      {
        protocolVersions: ["0.1"],
        host: { name: "compiler-test", version: "0.1.0" },
      },
      1
    )
  );
  return dispatcher.dispatch(rpc("morphir.frontend.compile", params, 2));
}

describe("MEP to Elm worker conversion", () => {
  test("preserves the source URI, package, dependencies, exposure, and typesOnly", () => {
    const dependencyDistribution = {
      formatVersion: 3,
      distribution: ["Library", [["acme"]], [], { modules: [] }],
    };
    const input = toWorkerBuildInput(
      request({
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "3",
            distribution: dependencyDistribution,
          },
        ],
        options: { typesOnly: true, irVersion: "3" },
      })
    );

    expect(input).toEqual({
      packageInfo: {
        name: "local/example",
        exposedModules: ["Example"],
      },
      fileSnapshot: { [sourceUri]: validSource },
      dependencies: [dependencyDistribution],
      options: { typesOnly: true },
    });
  });

  test.each([
    ["test-model", "test model"],
    ["acme/simple-model", "acme/simple model"],
    ["local/foo-2", "local/foo 2"],
    ["local/s-d-k", "local/s d k"],
  ])(
    "encodes canonical package %s for Elm Path.fromString",
    (name, workerName) => {
      const input = toWorkerBuildInput(
        request({ package: { name, exposedModules: ["Example"] } })
      );

      expect(input.packageInfo.name).toBe(workerName);
    }
  );

  test("converts one-based worker columns to zero-based UTF-16 positions", () => {
    const text = 'module Example exposing (value)\n\nvalue = "😀" +';

    expect(workerPositionToMep(text, { row: 3, column: 14 })).toEqual({
      line: 2,
      character: 14,
    });
  });

  test.each([
    [
      "leading comments",
      `﻿ {- module Fake exposing (..) -}
-- module AlsoFake exposing (..)
module Example exposing (value)`,
      "Example",
    ],
    [
      "nested block comments",
      `{- outer {- module NestedFake exposing (..) -}
module Fake exposing (..)
-}
port module Example.Worker exposing (main)`,
      "Example.Worker",
    ],
    [
      "effect module declarations",
      "effect module Example.Platform where { command = MyCmd } exposing (main)",
      "Example.Platform",
    ],
    [
      "normal module declarations",
      "module Example exposing (value)",
      "Example",
    ],
  ])("finds the module name after %s", (_, source, expected) => {
    expect(sourceModuleName(source)).toBe(expected);
  });

  test("does not scan a module declaration out of a string", () => {
    expect(
      sourceModuleName(
        '"module Fake exposing (..)"\nmodule Example exposing (value)'
      )
    ).toBeUndefined();
  });

  test("cleans earlier subscriptions when a later worker subscribe throws", async () => {
    const fakePort = <T>() => {
      const handlers = new Set<(value: T) => void>();
      return {
        subscribe: (handler: (value: T) => void) => handlers.add(handler),
        unsubscribe: (handler: (value: T) => void) => handlers.delete(handler),
        emit: (value: T) => handlers.forEach((handler) => handler(value)),
        handlerCount: () => handlers.size,
      };
    };
    const decodeFailed = fakePort<unknown>();
    const buildFailed = fakePort<unknown>();
    const progress = fakePort<string>();
    const buildCompleted = fakePort<[unknown, unknown]>();
    let throwOnProgressSubscribe = true;
    const worker = {
      ports: {
        decodeFailed,
        buildFailed,
        reportProgress: {
          ...progress,
          subscribe: (handler: (value: string) => void) => {
            if (throwOnProgressSubscribe) {
              throw new Error("progress subscribe failed");
            }
            progress.subscribe(handler);
          },
        },
        buildCompleted,
        buildFromScratch: { send: () => undefined },
      },
    };
    const runBuild = createBuildFromScratch(worker);

    await expect(
      runBuild(toWorkerBuildInput(request()), () => undefined)
    ).rejects.toThrow("progress subscribe failed");
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);

    throwOnProgressSubscribe = false;
    const nextBuild = runBuild(toWorkerBuildInput(request()), () => undefined);
    await Promise.resolve();
    expect(decodeFailed.handlerCount()).toBe(1);
    expect(buildFailed.handlerCount()).toBe(1);
    expect(progress.handlerCount()).toBe(1);
    expect(buildCompleted.handlerCount()).toBe(1);
    buildCompleted.emit([null, workerIr()]);

    await expect(nextBuild).resolves.toEqual(workerIr());
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);
  });

  test("fails and releases the queue when a progress consumer throws", async () => {
    const fakePort = <T>() => {
      const handlers = new Set<(value: T) => void>();
      return {
        subscribe: (handler: (value: T) => void) => handlers.add(handler),
        unsubscribe: (handler: (value: T) => void) => handlers.delete(handler),
        emit: (value: T) => handlers.forEach((handler) => handler(value)),
        handlerCount: () => handlers.size,
      };
    };
    const decodeFailed = fakePort<unknown>();
    const buildFailed = fakePort<unknown>();
    const progress = fakePort<string>();
    const buildCompleted = fakePort<[unknown, unknown]>();
    const worker = {
      ports: {
        decodeFailed,
        buildFailed,
        reportProgress: progress,
        buildCompleted,
        buildFromScratch: { send: () => undefined },
      },
    };
    const runBuild = createBuildFromScratch(worker);
    const progressError = new Error("progress consumer failed");
    const firstBuild = runBuild(toWorkerBuildInput(request()), () => {
      throw progressError;
    });
    await Promise.resolve();

    expect(() => progress.emit("Compiling")).not.toThrow();
    await expect(firstBuild).rejects.toBe(progressError);
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);

    const nextBuild = runBuild(toWorkerBuildInput(request()), () => undefined);
    await Promise.resolve();
    expect(decodeFailed.handlerCount()).toBe(1);
    expect(buildFailed.handlerCount()).toBe(1);
    expect(progress.handlerCount()).toBe(1);
    expect(buildCompleted.handlerCount()).toBe(1);
    buildCompleted.emit([null, workerIr()]);

    await expect(nextBuild).resolves.toEqual(workerIr());
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);
  });

  test("cleans a handler when subscribe registers and then throws", async () => {
    const fakePort = <T>() => {
      const handlers = new Set<(value: T) => void>();
      return {
        subscribe: (handler: (value: T) => void) => handlers.add(handler),
        unsubscribe: (handler: (value: T) => void) => handlers.delete(handler),
        emit: (value: T) => handlers.forEach((handler) => handler(value)),
        handlerCount: () => handlers.size,
      };
    };
    const decodeFailed = fakePort<unknown>();
    const buildFailed = fakePort<unknown>();
    const progress = fakePort<string>();
    const buildCompleted = fakePort<[unknown, unknown]>();
    let throwOnProgressSubscribe = true;
    let throwOnDecodeUnsubscribe = true;
    const worker = {
      ports: {
        decodeFailed: {
          ...decodeFailed,
          unsubscribe: (handler: (value: unknown) => void) => {
            decodeFailed.unsubscribe(handler);
            if (throwOnDecodeUnsubscribe) {
              throw new Error("decode unsubscribe failed");
            }
          },
        },
        buildFailed,
        reportProgress: {
          ...progress,
          subscribe: (handler: (value: string) => void) => {
            progress.subscribe(handler);
            if (throwOnProgressSubscribe) {
              throw new Error("progress subscribe failed after registration");
            }
          },
        },
        buildCompleted,
        buildFromScratch: { send: () => undefined },
      },
    };
    const runBuild = createBuildFromScratch(worker);

    await expect(
      runBuild(toWorkerBuildInput(request()), () => undefined)
    ).rejects.toThrow("progress subscribe failed after registration");
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);

    throwOnProgressSubscribe = false;
    throwOnDecodeUnsubscribe = false;
    const nextBuild = runBuild(toWorkerBuildInput(request()), () => undefined);
    await Promise.resolve();
    expect(decodeFailed.handlerCount()).toBe(1);
    expect(buildFailed.handlerCount()).toBe(1);
    expect(progress.handlerCount()).toBe(1);
    expect(buildCompleted.handlerCount()).toBe(1);
    buildCompleted.emit([null, workerIr()]);

    await expect(nextBuild).resolves.toEqual(workerIr());
    expect(decodeFailed.handlerCount()).toBe(0);
    expect(buildFailed.handlerCount()).toBe(0);
    expect(progress.handlerCount()).toBe(0);
    expect(buildCompleted.handlerCount()).toBe(0);
  });
});

describe("Elm MEP compiler", () => {
  test("compiles a valid Elm document into Morphir IR 3", async () => {
    const result = await compileElm(request());

    expect(result.success).toBe(true);
    expect(result).toHaveProperty("irVersion", "3");
    expect(result.modules).toEqual(["Example"]);
    expect(result.diagnostics).toEqual([]);
    expect(result).toHaveProperty("ir.formatVersion", 3);
    expect(typeof (result as { ir?: unknown }).ir).toBe("object");
  });

  test.each([
    ["a lowercase acronym", "local/sdk", [["local"], ["sdk"]]],
    ["multiple words", "test-model", [["test", "model"]]],
    [
      "multiple words in a nested path",
      "acme/simple-model",
      [["acme"], ["simple", "model"]],
    ],
    ["a numeric word", "local/foo-2", [["local"], ["foo", "2"]]],
    ["an initialism", "local/s-d-k", [["local"], ["s", "d", "k"]]],
    [
      "slash-separated path components",
      "acme/simple/model",
      [["acme"], ["simple"], ["model"]],
    ],
  ] as const)(
    "compiles a canonical package name with %s",
    async (_, packageName, expectedIdentity) => {
      const response = await compileThroughDispatcher(
        compileElm,
        request({ package: { name: packageName, exposedModules: ["Example"] } })
      );

      expect(response).not.toHaveProperty("error");
      expect(response).toHaveProperty("result.success", true);
      expect(response).toHaveProperty(
        "result.ir.distribution.1",
        expectedIdentity
      );
    }
  );

  test("returns an error diagnostic for malformed Elm", async () => {
    const response = await compileThroughDispatcher(
      compileElm,
      request({
        documents: [
          {
            uri: sourceUri,
            languageId: "elm",
            version: 2,
            text: "module Example exposing (add)\n\nadd =",
          },
        ],
      })
    );

    expect(response).not.toHaveProperty("error");
    if (response === null || !("result" in response)) {
      throw new Error("Expected a successful JSON-RPC response");
    }
    const result = response.result as Awaited<ReturnType<typeof compileElm>>;
    expect(result.success).toBe(false);
    expect(result.modules).toEqual([]);
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      code: "elm.parser",
      location: { uri: sourceUri },
    });
  });

  test("uses a worker source range for semantic errors", async () => {
    const result = await compileElm(
      request({
        documents: [
          {
            uri: sourceUri,
            languageId: "elm",
            version: 2,
            text: `module Example exposing (value)

value : Int
value = missing
`,
          },
        ],
      })
    );

    expect(result.success).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      severity: "error",
      code: "elm.mapping",
      location: {
        uri: sourceUri,
        range: {
          start: { line: 3, character: 8 },
        },
      },
    });
  });

  test("isolates concurrent worker invocations", async () => {
    const otherUri = "file:///workspace/local/other/Other.elm";
    const [example, other] = await Promise.all([
      compileElm(request()),
      compileElm(
        request({
          documents: [
            {
              uri: otherUri,
              languageId: "elm",
              version: 1,
              text: "module Other exposing (answer)\n\nanswer : Int\nanswer = 42\n",
            },
          ],
          package: { name: "local/other", exposedModules: ["Other"] },
        })
      ),
    ]);

    expect(example.modules).toEqual(["Example"]);
    expect(other.modules).toEqual(["Other"]);
  });

  test("keeps worker output off stdout", async () => {
    const stdout = spyOn(console, "log").mockImplementation(() => undefined);

    try {
      const result = await compileElm(request());

      expect(result.success).toBe(true);
      expect(stdout).not.toHaveBeenCalled();
    } finally {
      stdout.mockRestore();
    }
  });

  test("compiles an unexposed submitted module as private IR", async () => {
    const result = await compileElm(
      request({ package: { name: "local/example", exposedModules: [] } })
    );

    expect(result.success).toBe(true);
    expect(result.modules).toEqual(["Example"]);
    expect(result).toHaveProperty(
      "ir.distribution.3.modules.0.1.access",
      "Private"
    );
  });

  test("ignores a fake module declaration inside a block comment", async () => {
    const result = await compileThroughDispatcher(
      compileElm,
      request({
        documents: [
          {
            uri: sourceUri,
            languageId: "elm",
            version: 2,
            text: `{-
module Fake exposing (..)
-}
module Example exposing (value)

value = 42
`,
          },
        ],
      })
    );

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("result.success", true);
    expect(result).toHaveProperty("result.modules", ["Example"]);
  });

  test("returns invalid params for duplicate dependency package identities", async () => {
    const dependency = {
      packageName: "acme/dependency",
      irVersion: "3",
      distribution: dependencyDistribution([["acme"], ["dependency"]]),
    };
    const response = await compileThroughDispatcher(
      compileElm,
      request({ dependencies: [dependency, dependency] })
    );

    expect(response).toHaveProperty("error.code", -32602);
    expect(response).not.toHaveProperty("result");
  });

  test("returns invalid params for a mismatched embedded dependency identity", async () => {
    const response = await compileThroughDispatcher(
      compileElm,
      request({
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "3",
            distribution: dependencyDistribution([["another"], ["dependency"]]),
          },
        ],
      })
    );

    expect(response).toHaveProperty("error.code", -32602);
    expect(response).not.toHaveProperty("result");
  });

  test.each([
    [
      "words embedded as separate Path segments",
      "acme/simple-model",
      [["acme"], ["simple"], ["model"]],
    ],
    [
      "words embedded in one Name",
      "acme/simple/model",
      [["acme"], ["simple", "model"]],
    ],
  ] as const)(
    "returns invalid params for a dependency with %s",
    async (_, packageName, embeddedIdentity) => {
      const response = await compileThroughDispatcher(
        compileElm,
        request({
          dependencies: [
            {
              packageName,
              irVersion: "3",
              distribution: dependencyDistribution(embeddedIdentity),
            },
          ],
        })
      );

      expect(response).toHaveProperty("error.code", -32602);
      expect(response).not.toHaveProperty("result");
    }
  );

  test("matches dependency names to canonical Classic IR paths", async () => {
    const response = await compileThroughDispatcher(
      compileElm,
      request({
        dependencies: [
          {
            packageName: "test-model",
            irVersion: "3",
            distribution: dependencyDistribution([["test", "model"]]),
          },
        ],
      })
    );

    expect(response).not.toHaveProperty("error");
    expect(response).toHaveProperty("result.success", true);
  });

  test("returns invalid params for a caller-caused dependency repository error", async () => {
    const compile = createElmCompiler(async () => {
      throw [
        {
          code: "elm.repository",
          message: "Error while building repo.",
          details: [
            "RepoError",
            "Error while building repo.",
            [["DependencyAlreadyExists", [["acme"], ["dependency"]]]],
          ],
        },
      ];
    });
    const response = await compileThroughDispatcher(compile, request());

    expect(response).toHaveProperty("error.code", -32602);
    expect(response).not.toHaveProperty("result");
  });

  test("keeps an unexpected repository error internal", async () => {
    const compile = createElmCompiler(async () => {
      throw [
        {
          code: "elm.repository",
          message: "Cannot process value",
          details: ["RepoError", "Cannot process value", []],
        },
      ];
    });
    const response = await compileThroughDispatcher(compile, request());

    expect(response).toHaveProperty("error.code", -32603);
    expect(response).not.toHaveProperty("result");
  });

  test.each([
    ["request language", { ...request(), languageId: "gleam" }],
    ["document count", { ...request(), documents: [] }],
    [
      "document language",
      {
        ...request(),
        documents: [
          {
            uri: sourceUri,
            languageId: "gleam",
            version: 1,
            text: validSource,
          },
        ],
      },
    ],
    [
      "package name",
      { ...request(), package: { name: "   ", exposedModules: ["Example"] } },
    ],
    ...[
      "/local/example",
      "local/example!",
      "local//example",
      "Local/example",
      "local/../example",
      "local/example-",
      "local/foo--bar",
      "local/foo2",
      "local/SDK",
    ].map(
      (name) =>
        [
          `noncanonical package name ${name}`,
          { ...request(), package: { name, exposedModules: ["Example"] } },
        ] as const
    ),
    [
      "IR version",
      { ...request(), options: { typesOnly: false, irVersion: "4" } },
    ],
    [
      "typesOnly schema",
      { ...request(), options: { typesOnly: "false", irVersion: "3" } },
    ],
    [
      "dependency schema",
      {
        ...request(),
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "3",
            distribution: { formatVersion: 3, distribution: "invalid" },
          },
        ],
      },
    ],
    [
      "dependency IR version",
      {
        ...request(),
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "4",
            distribution: dependencyDistribution([["acme"], ["dependency"]]),
          },
        ],
      },
    ],
    [
      "dependency root format",
      {
        ...request(),
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "3",
            distribution: {
              ...dependencyDistribution([["acme"], ["dependency"]]),
              formatVersion: 4,
            },
          },
        ],
      },
    ],
    [
      "missing exposed module",
      {
        ...request(),
        package: { name: "local/example", exposedModules: ["Missing"] },
      },
    ],
  ] as const)(
    "returns JSON-RPC invalid params for an invalid %s",
    async (_, patch) => {
      const response = await compileThroughDispatcher(compileElm, patch);

      expect(response).toHaveProperty("error.code", -32602);
      expect(response).not.toHaveProperty("result");
    }
  );

  test("returns JSON-RPC internal error for an unexpected worker failure", async () => {
    const compile = createElmCompiler(async () => {
      throw new Error("port subscription failed");
    });

    const response = await compileThroughDispatcher(compile, request());

    expect(response).toHaveProperty("error.code", -32603);
    expect(response).not.toHaveProperty("result");
  });

  test("returns invalid params when the Elm worker rejects a dependency payload", async () => {
    const response = await compileThroughDispatcher(
      compileElm,
      request({
        dependencies: [
          {
            packageName: "acme/dependency",
            irVersion: "3",
            distribution: {
              formatVersion: 3,
              distribution: [
                "Library",
                "not-a-package-name",
                [],
                { modules: [] },
              ],
            },
          },
        ],
      })
    );

    expect(response).toHaveProperty("error.code", -32602);
    expect(response).not.toHaveProperty("result");

    const recovery = await compileElm(request());
    expect(recovery.success).toBe(true);
    expect(recovery.modules).toEqual(["Example"]);
  });

  test("returns JSON-RPC internal error for empty successful worker IR", async () => {
    const compile = createElmCompiler(async () => ({
      formatVersion: 3,
      distribution: ["Library", [["local"], ["example"]], [], { modules: [] }],
    }));

    const response = await compileThroughDispatcher(compile, request());

    expect(response).toHaveProperty("error.code", -32603);
    expect(response).not.toHaveProperty("result");
  });

  test("returns an internal error for a non-round-tripping worker package identity", async () => {
    const compile = createElmCompiler(async () =>
      workerIr([["local"], ["foo2"]])
    );
    const response = await compileThroughDispatcher(
      compile,
      request({ package: { name: "local/foo/2", exposedModules: ["Example"] } })
    );

    expect(response).toHaveProperty("error.code", -32603);
    expect(response).not.toHaveProperty("result");
  });

  test.each([
    ["the wrong root format version", { ...workerIr(), formatVersion: 4 }],
    [
      "a non-Library distribution tag",
      {
        ...workerIr(),
        distribution: ["Package", ...workerIr().distribution.slice(1)],
      },
    ],
    [
      "an overlong distribution tuple",
      {
        ...workerIr(),
        distribution: [...workerIr().distribution, "unexpected"],
      },
    ],
    ["the wrong package identity", workerIr([["local"], ["other"]])],
    [
      "malformed dependencies",
      {
        ...workerIr(),
        distribution: [
          "Library",
          [["local"], ["example"]],
          {},
          workerIr().distribution[3],
        ],
      },
    ],
    [
      "a malformed package definition",
      {
        ...workerIr(),
        distribution: [
          "Library",
          [["local"], ["example"]],
          [],
          { modules: {} },
        ],
      },
    ],
    [
      "a malformed module entry",
      {
        ...workerIr(),
        distribution: [
          "Library",
          [["local"], ["example"]],
          [],
          { modules: [[[["example"]], { access: "Public", value: {} }]] },
        ],
      },
    ],
    ["an arbitrary object", {}],
  ])(
    "returns JSON-RPC internal error when the worker returns %s",
    async (_, ir) => {
      const compile = createElmCompiler(async () => ir);

      const response = await compileThroughDispatcher(compile, request());

      expect(response).toHaveProperty("error.code", -32603);
      expect(response).not.toHaveProperty("result");
    }
  );
});
