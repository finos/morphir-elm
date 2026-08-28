import { describe, expect, test } from "bun:test";
import packageMetadata from "../../package.json";

import {
  createDispatcher,
  type CompileRequest,
  type CompileResult,
  type JsonRpcId,
  type JsonRpcResponse,
} from "./protocol";

const encoder = new TextEncoder();

const compileRequest: CompileRequest = {
  languageId: "elm",
  documents: [
    {
      uri: "file:///work/Example.elm",
      languageId: "elm",
      version: 1,
      text: "module Example exposing (add)\n",
    },
  ],
  package: { name: "local/example", exposedModules: ["Example"] },
  dependencies: [],
  options: { typesOnly: false, irVersion: "3" },
};

const successfulCompile: CompileResult = {
  success: true,
  irVersion: "3",
  ir: { formatVersion: 3 },
  diagnostics: [],
  modules: ["Example"],
};

function request(
  method: string,
  params: unknown,
  id: JsonRpcId = 1
): Uint8Array {
  return encoder.encode(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
}

function notification(method: string, params: unknown = {}): Uint8Array {
  return encoder.encode(JSON.stringify({ jsonrpc: "2.0", method, params }));
}

function requestWithoutParams(method: string, id: JsonRpcId = 1): Uint8Array {
  return encoder.encode(JSON.stringify({ jsonrpc: "2.0", id, method }));
}

function initialize(
  id: JsonRpcId = 1,
  protocolVersions: readonly string[] = ["0.1"]
) {
  return request(
    "morphir.initialize",
    {
      protocolVersions,
      host: { name: "morphir-test", version: "0.1.0" },
    },
    id
  );
}

function expectError(response: JsonRpcResponse | null, code: number) {
  expect(response).not.toBeNull();
  expect(response).toHaveProperty("error.code", code);
  expect(response).not.toHaveProperty("result");
}

describe("MEP protocol parsing", () => {
  test("returns a parse error for malformed JSON", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(encoder.encode('{"jsonrpc":'));

    expectError(response, -32700);
    expect(response).toHaveProperty("id", null);
  });

  test("returns a parse error for a body that is not valid UTF-8", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    const body = encoder.encode(
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "morphir.ping" })
    );
    const methodByte = body.indexOf("p".charCodeAt(0));
    body[methodByte] = 0xff;

    const response = await dispatcher.dispatch(body);

    expectError(response, -32700);
    expect(response).toHaveProperty("id", null);
  });

  test("returns invalid request for a malformed JSON-RPC envelope", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(
      encoder.encode(
        JSON.stringify({ jsonrpc: "1.0", id: 1, method: "morphir.ping" })
      )
    );

    expectError(response, -32600);
  });

  test("preserves integer and string request IDs", async () => {
    for (const id of [17, "compile-17"] as const) {
      const dispatcher = createDispatcher(() => successfulCompile);

      const response = await dispatcher.dispatch(initialize(id));

      expect(response).toHaveProperty("id", id);
      expect(typeof response?.id).toBe(typeof id);
    }
  });

  test("treats an explicit null ID as a request and echoes it", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(initialize(null));

    expect(response).toHaveProperty("id", null);
    expect(response).toHaveProperty("result.protocolVersion", "0.1");
    expect(dispatcher.state()).toEqual({
      kind: "ready",
      protocolVersion: "0.1",
    });
  });
});

describe("MEP lifecycle dispatch", () => {
  test("starts in the loaded state", () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    expect(dispatcher.state()).toEqual({ kind: "loaded" });
  });

  test("initializes MEP 0.1 and reports the Elm frontend", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(initialize());

    expect(response).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "0.1",
        extension: {
          id: "morphir-elm",
          name: "Morphir Elm frontend",
          version: packageMetadata.version,
          types: ["frontend"],
        },
        capabilities: {
          frontend: {
            languages: [{ id: "elm", fileExtensions: [".elm"] }],
            irVersions: ["3"],
            compile: true,
            incremental: false,
            fragments: false,
          },
          streaming: false,
          incremental: false,
          cancellation: false,
          progress: false,
        },
      },
    });
    expect(dispatcher.state()).toEqual({
      kind: "ready",
      protocolVersion: "0.1",
    });
  });

  test("rejects unsupported protocol versions without becoming ready", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(initialize(1, ["9.0"]));

    expectError(response, -32011);
    expect(response).toHaveProperty("error.data", {
      hostVersions: ["9.0"],
      extensionVersions: ["0.1"],
    });
    expect(dispatcher.state()).toEqual({ kind: "loaded" });
  });

  test("rejects malformed initialization parameters", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(
      request("morphir.initialize", { protocolVersions: "0.1" })
    );

    expectError(response, -32602);
    expect(dispatcher.state()).toEqual({ kind: "loaded" });
  });

  test("allows ping before initialization", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    expect(await dispatcher.dispatch(request("morphir.ping", {}))).toEqual({
      jsonrpc: "2.0",
      id: 1,
      result: { ok: true },
    });
    expect(dispatcher.state()).toEqual({ kind: "loaded" });
  });

  test("distinguishes omitted ping params from explicit null", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const omitted = await dispatcher.dispatch(
      requestWithoutParams("morphir.ping")
    );
    const explicitNull = await dispatcher.dispatch(
      request("morphir.ping", null, 2)
    );

    expect(omitted).toHaveProperty("result", { ok: true });
    expectError(explicitNull, -32602);
  });

  test("rejects operations before initialization", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    for (const method of [
      "morphir.extension.info",
      "morphir.extension.capabilities",
      "morphir.frontend.compile",
      "morphir.shutdown",
    ]) {
      const response = await dispatcher.dispatch(
        request(method, compileRequest)
      );
      expectError(response, -32600);
    }
  });

  test("returns info, capabilities, and ping after initialization", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const info = await dispatcher.dispatch(
      request("morphir.extension.info", {}, "info")
    );
    const capabilities = await dispatcher.dispatch(
      request("morphir.extension.capabilities", {}, "capabilities")
    );
    const ping = await dispatcher.dispatch(request("morphir.ping", {}, "ping"));

    expect(info).toHaveProperty("result.id", "morphir-elm");
    expect(info).toHaveProperty("result.types", ["frontend"]);
    expect(capabilities).toHaveProperty(
      "result.frontend.languages.0.id",
      "elm"
    );
    expect(capabilities).toHaveProperty("result.frontend.irVersions", ["3"]);
    expect(ping).toHaveProperty("result", { ok: true });
  });

  test("returns unknown ready methods as method not found", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(request("morphir.unknown", {}));

    expectError(response, -32601);
  });

  test("dispatches compile results, including source-language failures", async () => {
    const sourceFailure: CompileResult = {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "elm.compiler",
          message: "Elm compilation failed",
        },
      ],
      modules: [],
    };
    const dispatcher = createDispatcher((params) => {
      expect(params).toEqual(compileRequest);
      return sourceFailure;
    });
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest, "compile")
    );

    expect(response).toEqual({
      jsonrpc: "2.0",
      id: "compile",
      result: sourceFailure,
    });
    expect(response).not.toHaveProperty("error");
  });

  test("executes compile notifications and suppresses their response", async () => {
    let observed: CompileRequest | undefined;
    const dispatcher = createDispatcher((params) => {
      observed = params;
      return successfulCompile;
    });
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      notification("morphir.frontend.compile", compileRequest)
    );

    expect(response).toBeNull();
    expect(observed).toEqual(compileRequest);
  });

  test("suppresses invalid-params and internal errors for notifications", async () => {
    let compileCalls = 0;
    const dispatcher = createDispatcher(() => {
      compileCalls += 1;
      throw new Error("worker crashed");
    });
    await dispatcher.dispatch(initialize());

    const invalidParamsResponse = await dispatcher.dispatch(
      notification("morphir.frontend.compile", null)
    );
    const internalErrorResponse = await dispatcher.dispatch(
      notification("morphir.frontend.compile", compileRequest)
    );
    const unknownMethodResponse = await dispatcher.dispatch(
      notification("morphir.unknown")
    );

    expect(invalidParamsResponse).toBeNull();
    expect(internalErrorResponse).toBeNull();
    expect(unknownMethodResponse).toBeNull();
    expect(compileCalls).toBe(1);
  });

  test("rejects malformed compile parameters", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", { languageId: "elm" })
    );

    expectError(response, -32602);
  });

  test("rejects omitted and explicit-null compile params", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const omitted = await dispatcher.dispatch(
      requestWithoutParams("morphir.frontend.compile")
    );
    const explicitNull = await dispatcher.dispatch(
      request("morphir.frontend.compile", null, 2)
    );

    expectError(omitted, -32602);
    expectError(explicitNull, -32602);
  });

  test("returns internal error when the compiler boundary throws", async () => {
    const dispatcher = createDispatcher(() => {
      throw new Error("worker crashed");
    });
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest)
    );

    expectError(response, -32603);
  });

  test("returns internal error for a successful compile result without IR", async () => {
    const dispatcher = createDispatcher(
      () =>
        ({
          success: true,
          diagnostics: [],
          modules: ["Example"],
        } as unknown as CompileResult)
    );
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest)
    );

    expectError(response, -32603);
  });

  test("returns internal error for a successful compile result with null IR", async () => {
    const dispatcher = createDispatcher(
      () =>
        ({
          success: true,
          irVersion: "3",
          ir: null,
          diagnostics: [],
          modules: ["Example"],
        } as unknown as CompileResult)
    );
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest)
    );

    expectError(response, -32603);
  });

  test("returns internal error for a successful compile result with empty IR version", async () => {
    const dispatcher = createDispatcher(() => ({
      success: true,
      irVersion: "",
      ir: { formatVersion: 3 },
      diagnostics: [],
      modules: ["Example"],
    }));
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest)
    );

    expectError(response, -32603);
  });

  test("allows a failed compile result to contain null IR", async () => {
    const failedCompile: CompileResult = {
      success: false,
      irVersion: "3",
      ir: null,
      diagnostics: [
        {
          severity: "error",
          message: "Elm compilation failed",
        },
      ],
      modules: [],
    };
    const dispatcher = createDispatcher(() => failedCompile);
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      request("morphir.frontend.compile", compileRequest)
    );

    expect(response).toHaveProperty("result", failedCompile);
  });

  test("shutdown stops the session", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(request("morphir.shutdown", {}));

    expect(response).toEqual({ jsonrpc: "2.0", id: 1, result: {} });
    expect(dispatcher.state()).toEqual({ kind: "stopped" });
  });

  test("distinguishes omitted shutdown params from explicit null", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const explicitNull = await dispatcher.dispatch(
      request("morphir.shutdown", null, 2)
    );
    expectError(explicitNull, -32602);
    expect(dispatcher.state()).toEqual({
      kind: "ready",
      protocolVersion: "0.1",
    });

    const omitted = await dispatcher.dispatch(
      requestWithoutParams("morphir.shutdown", 3)
    );
    expect(omitted).toHaveProperty("result", {});
    expect(dispatcher.state()).toEqual({ kind: "stopped" });
  });

  test("executes a valid shutdown notification without responding", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());

    const response = await dispatcher.dispatch(
      notification("morphir.shutdown")
    );

    expect(response).toBeNull();
    expect(dispatcher.state()).toEqual({ kind: "stopped" });
  });

  test("exit is an accepted notification before initialization", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(notification("morphir.exit"));

    expect(response).toBeNull();
    expect(dispatcher.state()).toEqual({ kind: "stopped" });
  });

  test("exit is the only accepted call after shutdown", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);
    await dispatcher.dispatch(initialize());
    await dispatcher.dispatch(request("morphir.shutdown", {}));

    const rejected = await dispatcher.dispatch(request("morphir.ping", {}));
    const exited = await dispatcher.dispatch(notification("morphir.exit"));

    expectError(rejected, -32600);
    expect(exited).toBeNull();
    expect(dispatcher.state()).toEqual({ kind: "stopped" });
  });

  test("rejects exit when sent as a request", async () => {
    const dispatcher = createDispatcher(() => successfulCompile);

    const response = await dispatcher.dispatch(request("morphir.exit", {}));

    expectError(response, -32600);
  });
});
