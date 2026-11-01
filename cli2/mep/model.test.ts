import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import extensionMetadata from "./extension.json";
import {
  createDispatcher,
  type CompileRequest,
  type CompileResult,
  type JsonRpcId,
  type JsonRpcResponse,
} from "./protocol";

// MEP 0.2.0-draft.1 beside 0.1: negotiation and morphir.frontend.compileModel. The classic-to-v4 conversion is
// injected here, so these tests do not depend on real IR; tests-integration/mep-extension.test.ts checks the
// real conversion against a golden v4 model.

const encoder = new TextEncoder();

const COMPILE_MODEL_TUPLE = {
  operation: "morphir.frontend.compileModel",
  profile: "morphir-ir",
  codec: "morphir-json",
  envelopeVersion: "0.1.0-draft.1",
  irVersion: "4.0.0",
} as const;

const DEFAULT_LIMITS = {
  maxEncodedBytes: 2796204,
  maxDecodedBytes: 2097152,
  maxDepth: 128,
  maxNodes: 100000,
} as const;

const V4_TEXT = '{"formatVersion":4,"distribution":{}}';

const successfulCompile: CompileResult = {
  success: true,
  irVersion: "3",
  ir: { formatVersion: 3 },
  diagnostics: [],
  modules: ["Example"],
};

function request(method: string, params: unknown, id: JsonRpcId = 1) {
  return encoder.encode(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
}

function initialize02(
  transport: unknown = {
    tuples: [COMPILE_MODEL_TUPLE],
    limits: DEFAULT_LIMITS,
    guarantees: [],
  },
  protocolVersions: readonly string[] = ["0.2.0-draft.1"]
) {
  return request("morphir.initialize", {
    protocolVersions,
    host: { name: "morphir-test", version: "0.2.0" },
    // null sends no model transport offer.
    ...(transport === null ? {} : { modelTransport: transport }),
  });
}

const contextDigest = "a".repeat(64);

function compileModelParams(overrides: Record<string, unknown> = {}) {
  return {
    languageId: "elm",
    sources: {
      documents: [
        {
          uri: "Example.elm",
          languageId: "elm",
          version: 1,
          text: "module Example exposing (add)\n",
        },
      ],
    },
    package: { name: "local/example" },
    options: { irVersion: "4.0.0" },
    contextDigest,
    output: COMPILE_MODEL_TUPLE,
    ...overrides,
  };
}

function expectError(response: JsonRpcResponse | null, code: number) {
  expect(response).not.toBeNull();
  expect(response).toHaveProperty("error.code", code);
  expect(response).not.toHaveProperty("result");
}

function result(response: JsonRpcResponse | null): any {
  expect(response).not.toBeNull();
  expect(response).not.toHaveProperty("error");
  return (response as { result: unknown }).result;
}

function dispatcher(
  compile: (request: CompileRequest) => CompileResult = () => successfulCompile,
  toV4: (ir: unknown) => string = () => V4_TEXT
) {
  return createDispatcher(compile, toV4);
}

async function ready02(
  compile?: (request: CompileRequest) => CompileResult,
  toV4?: (ir: unknown) => string
) {
  const session = dispatcher(compile, toV4);
  result(await session.dispatch(initialize02()));
  return session;
}

describe("MEP 0.2 claims", () => {
  test("extension.json offers 0.2.0-draft.1 first and keeps 0.1", () => {
    expect(extensionMetadata.mepVersions).toEqual(["0.2.0-draft.1", "0.1"]);
  });

  test("describe lists both versions and the compileModel tuple, for a 0.2 or a 0.1 host", async () => {
    for (const offer of [["0.2.0-draft.1", "0.1"], ["0.2.0-draft.1"], ["0.1"]]) {
      const claims = result(
        await dispatcher().dispatch(
          request("morphir.extension.describe", { protocolVersions: offer })
        )
      );
      expect(claims.claimsVersion).toBe("0.1.0-draft.2");
      expect(claims.protocolVersions).toEqual(["0.2.0-draft.1", "0.1"]);
      expect(claims.capabilities.modelTransport).toEqual({
        tuples: [COMPILE_MODEL_TUPLE],
        limits: DEFAULT_LIMITS,
        guarantees: [],
      });
      // The legacy compile stays, with classic IR.
      expect(claims.capabilities.frontend.compile).toBe(true);
    }
  });

  test("describe refuses a host that offers neither version", async () => {
    expectError(
      await dispatcher().dispatch(
        request("morphir.extension.describe", { protocolVersions: ["0.3"] })
      ),
      -32011
    );
  });
});

describe("MEP 0.2 negotiation", () => {
  test("a 0.1-only host gets 0.1, without a model transport, and the legacy compile", async () => {
    const session = dispatcher();
    const answer = result(
      await session.dispatch(
        request("morphir.initialize", {
          protocolVersions: ["0.1"],
          host: { name: "morphir-rust", version: "0.1.0" },
        })
      )
    );
    expect(answer.protocolVersion).toBe("0.1");
    expect(answer.capabilities).not.toHaveProperty("modelTransport");
    expect(session.state()).toEqual({ kind: "ready", protocolVersion: "0.1" });

    const compiled = result(
      await session.dispatch(
        request(
          "morphir.frontend.compile",
          {
            languageId: "elm",
            sources: compileModelParams().sources,
            package: { name: "local/example" },
            dependencies: [],
            options: { typesOnly: false, irVersion: "3" },
          },
          2
        )
      )
    );
    expect(compiled).toEqual(successfulCompile);

    expectError(
      await session.dispatch(
        request("morphir.frontend.compileModel", compileModelParams(), 3)
      ),
      -32013
    );
  });

  test("a host that offers both versions without a model transport gets 0.1", async () => {
    const session = dispatcher();
    const answer = result(
      await session.dispatch(initialize02(null, ["0.2.0-draft.1", "0.1"]))
    );
    expect(answer.protocolVersion).toBe("0.1");
  });

  test("a 0.2 host gets 0.2 with the agreed tuple and the smaller limits", async () => {
    const session = dispatcher();
    const answer = result(
      await session.dispatch(
        initialize02(
          {
            tuples: [
              { ...COMPILE_MODEL_TUPLE, codec: "ion-binary" },
              COMPILE_MODEL_TUPLE,
              { ...COMPILE_MODEL_TUPLE, operation: "morphir.backend.generateModel" },
            ],
            limits: { ...DEFAULT_LIMITS, maxDecodedBytes: 1000, maxNodes: 200000 },
            guarantees: [],
          },
          ["0.2.0-draft.1", "0.1"]
        )
      )
    );
    expect(answer.protocolVersion).toBe("0.2.0-draft.1");
    expect(answer.extension.id).toBe("morphir-elm-classic");
    expect(answer.capabilities.modelTransport).toEqual({
      tuples: [COMPILE_MODEL_TUPLE],
      limits: { ...DEFAULT_LIMITS, maxDecodedBytes: 1000 },
      guarantees: [],
    });
    // The live claims repeat the described frontend claims.
    const claims = result(
      await dispatcher().dispatch(
        request("morphir.extension.describe", { protocolVersions: ["0.2.0-draft.1"] })
      )
    );
    expect(answer.capabilities.frontend).toEqual(claims.capabilities.frontend);
    expect(session.state()).toEqual({
      kind: "ready",
      protocolVersion: "0.2.0-draft.1",
    });
  });

  test("a 0.2-only host without a model transport is refused with -32011", async () => {
    const session = dispatcher();
    expectError(await session.dispatch(initialize02(null)), -32011);
    expect(session.state()).toEqual({ kind: "loaded" });
  });

  test.each([
    ["tuples not an array", { tuples: {}, limits: DEFAULT_LIMITS, guarantees: [] }],
    [
      "a tuple with an extra member",
      { tuples: [{ ...COMPILE_MODEL_TUPLE, extra: 1 }], limits: DEFAULT_LIMITS, guarantees: [] },
    ],
    ["limits missing", { tuples: [COMPILE_MODEL_TUPLE], guarantees: [] }],
    [
      "a limit of zero",
      { tuples: [COMPILE_MODEL_TUPLE], limits: { ...DEFAULT_LIMITS, maxDepth: 0 }, guarantees: [] },
    ],
    [
      "repeated guarantees",
      { tuples: [COMPILE_MODEL_TUPLE], limits: DEFAULT_LIMITS, guarantees: ["a", "a"] },
    ],
  ])("refuses a model transport offer with %s", async (_, offer) => {
    const session = dispatcher();
    expectError(await session.dispatch(initialize02(offer)), -32602);
    expect(session.state()).toEqual({ kind: "loaded" });
  });
});

describe("morphir.frontend.compileModel", () => {
  test("returns the converted IR as a morphir-json model envelope", async () => {
    const seen: CompileRequest[] = [];
    const converted: unknown[] = [];
    const session = await ready02(
      (compileRequest) => {
        seen.push(compileRequest);
        return successfulCompile;
      },
      (ir) => {
        converted.push(ir);
        return V4_TEXT;
      }
    );

    const answer = result(
      await session.dispatch(
        request("morphir.frontend.compileModel", compileModelParams(), 2)
      )
    );

    // The classic compiler gets the request as a classic (format 3) compile with every module exposed.
    expect(seen).toEqual([
      {
        languageId: "elm",
        sources: { root: undefined, documents: compileModelParams().sources.documents },
        package: { name: "local/example" },
        dependencies: [],
        options: { typesOnly: false, irVersion: "3" },
      },
    ]);
    expect(converted).toEqual([successfulCompile.ir]);

    const bytes = encoder.encode(V4_TEXT);
    const digest = createHash("sha256").update(bytes).digest("hex");
    const packageDigest = createHash("sha256").update("local/example").digest("hex");
    expect(answer).toEqual({
      success: true,
      model: {
        envelopeVersion: "0.1.0-draft.1",
        modelId: `urn:finos:morphir-elm:model:${packageDigest}`,
        revision: `sha256:${digest}`,
        irVersion: "4.0.0",
        profile: "morphir-ir",
        payload: {
          codec: "morphir-json",
          layout: "single-document",
          decodedByteLength: bytes.byteLength,
          sha256: digest,
          content: Buffer.from(bytes).toString("base64"),
        },
      },
      diagnostics: [],
      modules: ["Example"],
    });
  });

  test("passes exposedModules through when the host names them", async () => {
    const seen: CompileRequest[] = [];
    const session = await ready02((compileRequest) => {
      seen.push(compileRequest);
      return successfulCompile;
    });
    result(
      await session.dispatch(
        request(
          "morphir.frontend.compileModel",
          compileModelParams({ package: { name: "local/example", exposedModules: ["Example"] } }),
          2
        )
      )
    );
    expect(seen[0].package).toEqual({ name: "local/example", exposedModules: ["Example"] });
  });

  test("returns source problems as diagnostics without a model", async () => {
    const diagnostics = [
      { severity: "error" as const, code: "elm.parser", message: "Unexpected token" },
    ];
    const session = await ready02(() => ({ success: false, diagnostics, modules: [] }));
    const answer = result(
      await session.dispatch(request("morphir.frontend.compileModel", compileModelParams(), 2))
    );
    expect(answer).toEqual({ success: false, diagnostics });
  });

  test("answers package dependencies with an elm.unsupported_dependencies diagnostic", async () => {
    let compiled = false;
    const session = await ready02(() => {
      compiled = true;
      return successfulCompile;
    });
    const answer = result(
      await session.dispatch(
        request(
          "morphir.frontend.compileModel",
          compileModelParams({ dependencies: [{ packageName: "other/pkg" }] }),
          2
        )
      )
    );
    expect(answer.success).toBe(false);
    expect(answer).not.toHaveProperty("model");
    expect(answer.diagnostics).toEqual([
      expect.objectContaining({ severity: "error", code: "elm.unsupported_dependencies" }),
    ]);
    expect(compiled).toBe(false);
  });

  test("answers a model over the agreed limits with an elm.model_limit diagnostic", async () => {
    const session = dispatcher(undefined, () => V4_TEXT);
    result(
      await session.dispatch(
        initialize02({
          tuples: [COMPILE_MODEL_TUPLE],
          limits: { ...DEFAULT_LIMITS, maxDecodedBytes: 10 },
          guarantees: [],
        })
      )
    );
    const answer = result(
      await session.dispatch(request("morphir.frontend.compileModel", compileModelParams(), 2))
    );
    expect(answer.success).toBe(false);
    expect(answer.diagnostics).toEqual([
      expect.objectContaining({ code: "elm.model_limit" }),
    ]);
  });

  test("answers a failed conversion with an internal error", async () => {
    const session = await ready02(undefined, () => {
      throw new Error("migration refused");
    });
    expectError(
      await session.dispatch(request("morphir.frontend.compileModel", compileModelParams(), 2)),
      -32603
    );
  });

  test.each([
    ["an unagreed codec", { output: { ...COMPILE_MODEL_TUPLE, codec: "ion-binary" } }],
    ["a wrong envelope version", { output: { ...COMPILE_MODEL_TUPLE, envelopeVersion: "0.2.0" } }],
    ["a wrong output IR version", { output: { ...COMPILE_MODEL_TUPLE, irVersion: "3" } }],
    ["no output", { output: undefined }],
    ["a wrong options IR version", { options: { irVersion: "3" } }],
    ["no context digest", { contextDigest: undefined }],
    ["an upper-case context digest", { contextDigest: "A".repeat(64) }],
    ["another language", { languageId: "gleam" }],
    ["no package name", { package: {} }],
    ["exposedModules that is not a string list", { package: { name: "a/b", exposedModules: [1] } }],
    ["no documents", { sources: { documents: [] } }],
  ])("refuses %s with -32602", async (_, overrides) => {
    let compiled = false;
    const session = await ready02(() => {
      compiled = true;
      return successfulCompile;
    });
    expectError(
      await session.dispatch(
        request("morphir.frontend.compileModel", compileModelParams(overrides), 2)
      ),
      -32602
    );
    expect(compiled).toBe(false);
  });

  test("refuses before initialize with -32014", async () => {
    expectError(
      await dispatcher().dispatch(request("morphir.frontend.compileModel", compileModelParams())),
      -32014
    );
  });

  test("refuses when the host did not agree the compileModel tuple, with -32013", async () => {
    const session = dispatcher();
    result(
      await session.dispatch(
        initialize02({ tuples: [], limits: DEFAULT_LIMITS, guarantees: [] })
      )
    );
    expectError(
      await session.dispatch(request("morphir.frontend.compileModel", compileModelParams(), 2)),
      -32013
    );
  });

  test("refuses after shutdown with -32014", async () => {
    const session = await ready02();
    result(await session.dispatch(request("morphir.shutdown", {}, 2)));
    expectError(
      await session.dispatch(request("morphir.frontend.compileModel", compileModelParams(), 3)),
      -32014
    );
  });

  test("the legacy compile still works in a 0.2 session", async () => {
    const session = await ready02();
    const compiled = result(
      await session.dispatch(
        request(
          "morphir.frontend.compile",
          {
            languageId: "elm",
            sources: compileModelParams().sources,
            package: { name: "local/example" },
            dependencies: [],
            options: { typesOnly: false, irVersion: "3" },
          },
          2
        )
      )
    );
    expect(compiled).toEqual(successfulCompile);
  });
});
