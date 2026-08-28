import type { JsonRpcError, JsonRpcId, JsonRpcResponse } from "./framing";
import packageMetadata from "../../package.json";

export type { JsonRpcError, JsonRpcId, JsonRpcResponse } from "./framing";

export interface SourceDocument {
  readonly uri: string;
  readonly languageId: string;
  readonly version: number;
  readonly text: string;
}

export interface CompilePackage {
  readonly name: string;
  readonly exposedModules: readonly string[];
}

export interface CompileDependency {
  readonly packageName: string;
  readonly irVersion: string;
  readonly distribution: unknown;
}

export interface CompileOptions {
  readonly typesOnly: boolean;
  readonly irVersion: string;
  readonly [name: string]: unknown;
}

export interface CompileRequest {
  readonly languageId: string;
  readonly documents: readonly SourceDocument[];
  readonly package: CompilePackage;
  readonly dependencies: readonly CompileDependency[];
  readonly options: CompileOptions;
}

export interface SourcePosition {
  readonly line: number;
  readonly character: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface SourceLocation {
  readonly uri: string;
  readonly range: SourceRange;
}

export interface Diagnostic {
  readonly severity: "error" | "warning" | "info" | "hint";
  readonly code?: string;
  readonly message: string;
  readonly location?: SourceLocation;
  readonly related?: readonly unknown[];
  readonly data?: unknown;
}

interface CompileResultBase {
  readonly diagnostics: readonly Diagnostic[];
  readonly modules: readonly string[];
}

export interface CompileSuccess extends CompileResultBase {
  readonly success: true;
  readonly irVersion: string;
  readonly ir: NonNullable<unknown>;
}

export interface CompileFailure extends CompileResultBase {
  readonly success: false;
  readonly irVersion?: string;
  readonly ir?: unknown;
}

export type CompileResult = CompileSuccess | CompileFailure;

export type SessionState =
  | { readonly kind: "loaded" }
  | { readonly kind: "ready"; readonly protocolVersion: "0.1" }
  | { readonly kind: "stopped" };

export type Compile = (
  request: CompileRequest
) => CompileResult | Promise<CompileResult>;

export class InvalidCompileParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCompileParamsError";
  }
}

export interface Dispatcher {
  readonly dispatch: (body: Uint8Array) => Promise<JsonRpcResponse | null>;
  readonly state: () => SessionState;
}

interface JsonRpcRequest {
  readonly jsonrpc: "2.0";
  readonly method: string;
  readonly hasParams: boolean;
  readonly params: unknown;
  readonly hasId: boolean;
  readonly id: JsonRpcId;
}

const MEP_VERSION = "0.1" as const;
const decoder = new TextDecoder("utf-8", { fatal: true });

const extensionInfo = Object.freeze({
  id: "morphir-elm",
  name: "Morphir Elm frontend",
  version: packageMetadata.version,
  types: ["frontend"] as const,
});

const capabilities = Object.freeze({
  frontend: Object.freeze({
    languages: [
      Object.freeze({ id: "elm", fileExtensions: [".elm"] as const }),
    ] as const,
    irVersions: ["3"] as const,
    compile: true,
    incremental: false,
    fragments: false,
  }),
  streaming: false,
  incremental: false,
  cancellation: false,
  progress: false,
});

const loadedState: SessionState = Object.freeze({ kind: "loaded" });
const readyState: SessionState = Object.freeze({
  kind: "ready",
  protocolVersion: MEP_VERSION,
});
const stoppedState: SessionState = Object.freeze({ kind: "stopped" });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return (
    value === null ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isSafeInteger(value))
  );
}

function parseRequest(value: unknown): JsonRpcRequest | undefined {
  const hasId =
    isRecord(value) && Object.prototype.hasOwnProperty.call(value, "id");
  if (
    !isRecord(value) ||
    value.jsonrpc !== "2.0" ||
    typeof value.method !== "string" ||
    value.method.length === 0 ||
    (hasId && !isJsonRpcId(value.id))
  ) {
    return undefined;
  }

  return {
    jsonrpc: "2.0",
    method: value.method,
    hasParams: Object.prototype.hasOwnProperty.call(value, "params"),
    params: value.params,
    hasId,
    id: hasId && isJsonRpcId(value.id) ? value.id : null,
  };
}

function success(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function failure(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse {
  const error: JsonRpcError = {
    code,
    message,
    ...(data === undefined ? {} : { data }),
  };
  return { jsonrpc: "2.0", id, error };
}

function invalidRequest(id: JsonRpcId, message: string): JsonRpcResponse {
  return failure(id, -32600, message);
}

function invalidParams(id: JsonRpcId, message: string): JsonRpcResponse {
  return failure(id, -32602, message);
}

function hasStringArray(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === "string")
  );
}

function isInitializeParams(value: unknown): value is {
  readonly protocolVersions: readonly string[];
  readonly host: { readonly name: string; readonly version: string };
} {
  return (
    isRecord(value) &&
    hasStringArray(value.protocolVersions) &&
    isRecord(value.host) &&
    typeof value.host.name === "string" &&
    typeof value.host.version === "string"
  );
}

function isSourceDocument(value: unknown): value is SourceDocument {
  return (
    isRecord(value) &&
    typeof value.uri === "string" &&
    typeof value.languageId === "string" &&
    typeof value.version === "number" &&
    Number.isSafeInteger(value.version) &&
    value.version >= 0 &&
    typeof value.text === "string"
  );
}

function isCompileDependency(value: unknown): value is CompileDependency {
  return (
    isRecord(value) &&
    typeof value.packageName === "string" &&
    typeof value.irVersion === "string" &&
    "distribution" in value
  );
}

function isCompileRequest(value: unknown): value is CompileRequest {
  return (
    isRecord(value) &&
    typeof value.languageId === "string" &&
    Array.isArray(value.documents) &&
    value.documents.every(isSourceDocument) &&
    isRecord(value.package) &&
    typeof value.package.name === "string" &&
    hasStringArray(value.package.exposedModules) &&
    Array.isArray(value.dependencies) &&
    value.dependencies.every(isCompileDependency) &&
    isRecord(value.options) &&
    typeof value.options.typesOnly === "boolean" &&
    typeof value.options.irVersion === "string"
  );
}

function isSourcePosition(value: unknown): value is SourcePosition {
  return (
    isRecord(value) &&
    typeof value.line === "number" &&
    Number.isSafeInteger(value.line) &&
    value.line >= 0 &&
    typeof value.character === "number" &&
    Number.isSafeInteger(value.character) &&
    value.character >= 0
  );
}

function isSourceLocation(value: unknown): value is SourceLocation {
  return (
    isRecord(value) &&
    typeof value.uri === "string" &&
    isRecord(value.range) &&
    isSourcePosition(value.range.start) &&
    isSourcePosition(value.range.end)
  );
}

function isDiagnostic(value: unknown): value is Diagnostic {
  return (
    isRecord(value) &&
    ["error", "warning", "info", "hint"].includes(value.severity as string) &&
    typeof value.message === "string" &&
    (!("code" in value) || typeof value.code === "string") &&
    (!("location" in value) || isSourceLocation(value.location)) &&
    (!("related" in value) || Array.isArray(value.related))
  );
}

function isCompileResult(value: unknown): value is CompileResult {
  if (
    !isRecord(value) ||
    typeof value.success !== "boolean" ||
    !Array.isArray(value.diagnostics) ||
    !value.diagnostics.every(isDiagnostic) ||
    !hasStringArray(value.modules)
  ) {
    return false;
  }

  if (value.success) {
    return (
      typeof value.irVersion === "string" &&
      value.irVersion.trim().length > 0 &&
      Object.prototype.hasOwnProperty.call(value, "ir") &&
      value.ir !== null &&
      value.ir !== undefined
    );
  }

  return !("irVersion" in value) || typeof value.irVersion === "string";
}

function hasObjectParams(value: unknown): boolean {
  return isRecord(value);
}

function parseBody(
  body: Uint8Array
):
  | { readonly kind: "parsed"; readonly value: unknown }
  | { readonly kind: "parse-error" } {
  try {
    return { kind: "parsed", value: JSON.parse(decoder.decode(body)) };
  } catch {
    return { kind: "parse-error" };
  }
}

export function createDispatcher(compile: Compile): Dispatcher {
  let sessionState: SessionState = loadedState;

  const dispatch = async (
    body: Uint8Array
  ): Promise<JsonRpcResponse | null> => {
    const parsed = parseBody(body);
    if (parsed.kind === "parse-error") {
      return failure(null, -32700, "Parse error");
    }

    const request = parseRequest(parsed.value);
    if (request === undefined) {
      const invalidId =
        isRecord(parsed.value) && isJsonRpcId(parsed.value.id)
          ? parsed.value.id
          : null;
      return invalidRequest(invalidId, "Invalid JSON-RPC request");
    }

    const respond = (response: JsonRpcResponse): JsonRpcResponse | null =>
      request.hasId ? response : null;
    if (request.method === "morphir.exit") {
      if (request.hasId) {
        return invalidRequest(request.id, "morphir.exit is a notification");
      }
      sessionState = stoppedState;
      return null;
    }

    const id = request.id;

    if (sessionState.kind === "stopped") {
      return respond(invalidRequest(id, "The MEP session has stopped"));
    }

    if (request.method === "morphir.ping") {
      if (request.hasParams && !hasObjectParams(request.params)) {
        return respond(
          invalidParams(id, "morphir.ping parameters must be an object")
        );
      }
      return respond(success(id, { ok: true }));
    }

    if (sessionState.kind === "loaded") {
      if (request.method !== "morphir.initialize") {
        return respond(
          invalidRequest(id, "The MEP session is not initialized")
        );
      }
      if (!request.hasParams || !isInitializeParams(request.params)) {
        return respond(
          invalidParams(id, "Invalid morphir.initialize parameters")
        );
      }
      if (!request.params.protocolVersions.includes(MEP_VERSION)) {
        return respond(
          failure(
            id,
            -32011,
            "No compatible Morphir Extension Protocol version",
            {
              hostVersions: request.params.protocolVersions,
              extensionVersions: [MEP_VERSION],
            }
          )
        );
      }

      sessionState = readyState;
      return respond(
        success(id, {
          protocolVersion: MEP_VERSION,
          extension: extensionInfo,
          capabilities,
        })
      );
    }

    switch (request.method) {
      case "morphir.initialize":
        return respond(
          invalidRequest(id, "The MEP session is already initialized")
        );
      case "morphir.extension.info":
        return respond(
          !request.hasParams || hasObjectParams(request.params)
            ? success(id, extensionInfo)
            : invalidParams(
                id,
                "morphir.extension.info parameters must be an object"
              )
        );
      case "morphir.extension.capabilities":
        return respond(
          !request.hasParams || hasObjectParams(request.params)
            ? success(id, capabilities)
            : invalidParams(
                id,
                "morphir.extension.capabilities parameters must be an object"
              )
        );
      case "morphir.frontend.compile":
        if (!request.hasParams || !isCompileRequest(request.params)) {
          return respond(
            invalidParams(id, "Invalid morphir.frontend.compile parameters")
          );
        }
        try {
          const result = await compile(request.params);
          return respond(
            isCompileResult(result)
              ? success(id, result)
              : failure(
                  id,
                  -32603,
                  "Elm frontend returned an invalid compile result"
                )
          );
        } catch (error) {
          if (error instanceof InvalidCompileParamsError) {
            return respond(invalidParams(id, error.message));
          }
          return respond(
            failure(id, -32603, "Elm frontend compilation failed internally")
          );
        }
      case "morphir.shutdown":
        if (request.hasParams && !hasObjectParams(request.params)) {
          return respond(
            invalidParams(id, "morphir.shutdown parameters must be an object")
          );
        }
        sessionState = stoppedState;
        return respond(success(id, {}));
      default:
        return respond(
          failure(id, -32601, `Method not found: ${request.method}`)
        );
    }
  };

  return Object.freeze({
    dispatch,
    state: () => sessionState,
  });
}
