import { classicToV4 } from "./classic-ir";
import type { JsonRpcError, JsonRpcId, JsonRpcResponse } from "./framing";
import {
  MEP_0_1,
  MEP_0_2,
  MEP_VERSIONS,
  type MepVersion,
  extensionInfo,
  capabilities,
  capabilityClaims,
} from "./identity";
import {
  COMPILE_MODEL,
  MODEL_IR_VERSION,
  agreeTransport,
  envelope,
  readTuple,
  sameTuple,
  type Transport,
  type Tuple,
} from "./model";
import { discover, parseDiscoveryRequest } from "./workspace";

export type { JsonRpcError, JsonRpcId, JsonRpcResponse } from "./framing";

export interface SourceDocument {
  readonly uri: string;
  readonly languageId: string;
  readonly version: number;
  readonly text: string;
}

export interface SourceSet {
  readonly root?: string;
  readonly documents: readonly SourceDocument[];
}

export interface CompilePackage {
  readonly name: string;
  /** Absent exposes every module; an empty list exposes none (MEP CompilePackage). */
  readonly exposedModules?: readonly string[];
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
  readonly sources: SourceSet;
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
  | { readonly kind: "ready"; readonly protocolVersion: MepVersion }
  | { readonly kind: "shutdown" }
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

/** Classic IR (format 3) to Morphir IR 4.0.0 JSON text. Throws when it cannot convert the IR. */
export type ToV4 = (ir: unknown) => string;

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

const decoder = new TextDecoder("utf-8", { fatal: true });

const loadedState: SessionState = Object.freeze({ kind: "loaded" });
const shutdownState: SessionState = Object.freeze({ kind: "shutdown" });
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

function protocolMismatch(
  id: JsonRpcId,
  hostVersions: readonly string[]
): JsonRpcResponse {
  return failure(
    id,
    -32011,
    "No compatible Morphir Extension Protocol version",
    {
      hostVersions,
      extensionVersions: MEP_VERSIONS,
    }
  );
}

function invalidRequest(id: JsonRpcId, message: string): JsonRpcResponse {
  return failure(id, -32600, message);
}

/** A request the lifecycle does not allow yet, or any longer: before
 * `morphir.initialize`, or after `morphir.shutdown`. */
function notInitialized(id: JsonRpcId, message: string): JsonRpcResponse {
  return failure(id, -32014, message);
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

type CompileRequestParseResult =
  | { readonly kind: "valid"; readonly request: CompileRequest }
  | { readonly kind: "invalid"; readonly message: string };

function parseCompileRequest(value: unknown): CompileRequestParseResult {
  const invalid = (message = "Invalid morphir.frontend.compile parameters") =>
    ({ kind: "invalid", message } as const);
  if (!isRecord(value)) {
    return invalid();
  }

  const hasSources = Object.prototype.hasOwnProperty.call(value, "sources");
  const hasDocuments = Object.prototype.hasOwnProperty.call(value, "documents");
  if (hasSources && hasDocuments) {
    return invalid(
      "Ambiguous morphir.frontend.compile parameters: provide either sources or documents, not both"
    );
  }
  if (!hasSources && !hasDocuments) {
    return invalid(
      "Invalid morphir.frontend.compile parameters: missing sources or documents"
    );
  }

  const sourceSet = hasSources ? value.sources : undefined;
  const documents = hasSources
    ? isRecord(sourceSet)
      ? sourceSet.documents
      : undefined
    : value.documents;
  if (
    (hasSources &&
      (!isRecord(sourceSet) ||
        ("root" in sourceSet && typeof sourceSet.root !== "string"))) ||
    !Array.isArray(documents) ||
    !documents.every(isSourceDocument) ||
    typeof value.languageId !== "string" ||
    !isRecord(value.package) ||
    typeof value.package.name !== "string" ||
    ("exposedModules" in value.package &&
      !hasStringArray(value.package.exposedModules)) ||
    !Array.isArray(value.dependencies) ||
    !value.dependencies.every(isCompileDependency) ||
    !isRecord(value.options) ||
    typeof value.options.typesOnly !== "boolean" ||
    typeof value.options.irVersion !== "string"
  ) {
    return invalid();
  }
  const root =
    hasSources && isRecord(sourceSet) && typeof sourceSet.root === "string"
      ? sourceSet.root
      : undefined;

  return {
    kind: "valid",
    request: {
      languageId: value.languageId,
      sources: { root, documents },
      package:
        "exposedModules" in value.package
          ? {
              name: value.package.name,
              exposedModules: value.package.exposedModules as string[],
            }
          : { name: value.package.name },
      dependencies: value.dependencies,
      options: value.options as CompileOptions,
    },
  };
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

/** The diagnostic for a request that names package dependencies, as the Elm extension gives it. */
export const UNSUPPORTED_DEPENDENCIES = "elm.unsupported_dependencies";

type CompileModelParseResult =
  | {
      readonly kind: "valid";
      readonly request: CompileRequest;
      readonly hasDependencies: boolean;
    }
  | { readonly kind: "invalid"; readonly message: string };

/** Reads compileModel params as a classic compile request. `tuple` is the agreed compileModel tuple. */
function parseCompileModelRequest(
  value: Record<string, unknown>,
  tuple: Tuple
): CompileModelParseResult {
  const refuse = (reason: string) =>
    ({ kind: "invalid", message: `Compilation admission refused: ${reason}` } as const);
  const output = readTuple(value.output);
  if (output === undefined || !sameTuple(output, tuple)) {
    return {
      kind: "invalid",
      message: "Model admission refused: unsupported_tuple (output)",
    };
  }
  if (value.languageId !== "elm") {
    return refuse("unsupported_language");
  }
  if (
    typeof value.contextDigest !== "string" ||
    !/^[0-9a-f]{64}$/.test(value.contextDigest)
  ) {
    return refuse("invalid_request");
  }
  const options = value.options ?? {};
  if (!isRecord(options)) {
    return refuse("invalid_request");
  }
  if ("irVersion" in options && options.irVersion !== MODEL_IR_VERSION) {
    return refuse("unsupported_ir_version");
  }
  if ("profile" in options && options.profile !== "library") {
    return refuse("unsupported_profile");
  }
  if ("typesOnly" in options && typeof options.typesOnly !== "boolean") {
    return refuse("invalid_request");
  }
  const pkg = value.package;
  if (
    !isRecord(pkg) ||
    typeof pkg.name !== "string" ||
    pkg.name.length === 0 ||
    ("exposedModules" in pkg && !hasStringArray(pkg.exposedModules))
  ) {
    return refuse("invalid_request");
  }
  const sources = value.sources;
  if (
    !isRecord(sources) ||
    !Array.isArray(sources.documents) ||
    sources.documents.length === 0
  ) {
    return refuse("unsupported_source_count");
  }
  if (!sources.documents.every(isSourceDocument)) {
    return refuse("invalid_request");
  }
  if ("root" in sources && typeof sources.root !== "string") {
    return refuse("invalid_source_root");
  }
  const dependencies = value.dependencies ?? [];
  if (!Array.isArray(dependencies)) {
    return refuse("invalid_request");
  }
  return {
    kind: "valid",
    hasDependencies: dependencies.length > 0,
    request: {
      languageId: "elm",
      sources: {
        root: typeof sources.root === "string" ? sources.root : undefined,
        documents: sources.documents,
      },
      package:
        "exposedModules" in pkg
          ? { name: pkg.name, exposedModules: pkg.exposedModules as string[] }
          : { name: pkg.name },
      dependencies: [],
      // The Elm worker writes classic IR; compileModel converts it to IR 4.0.0.
      options: { typesOnly: options.typesOnly === true, irVersion: "3" },
    },
  };
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

export function createDispatcher(
  compile: Compile,
  toV4: ToV4 = classicToV4
): Dispatcher {
  let sessionState: SessionState = loadedState;
  // The model transport agreed in a MEP 0.2 session; undefined in a 0.1 session.
  let transport: Transport | undefined;
  const liveCapabilities = () =>
    transport === undefined
      ? capabilities
      : { ...capabilities, modelTransport: transport };

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
      return respond(notInitialized(id, "The MEP session has stopped"));
    }
    if (sessionState.kind === "shutdown") {
      return respond(notInitialized(id, "The MEP session has shut down"));
    }

    if (request.method === "morphir.extension.describe") {
      if (
        !isRecord(request.params) ||
        !hasStringArray(request.params.protocolVersions)
      ) {
        return respond(
          invalidParams(id, "Invalid morphir.extension.describe parameters")
        );
      }
      const offered = request.params.protocolVersions;
      if (!MEP_VERSIONS.some((version) => offered.includes(version))) {
        return respond(protocolMismatch(id, offered));
      }
      return respond(success(id, capabilityClaims()));
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
          notInitialized(id, "The MEP session is not initialized")
        );
      }
      if (!request.hasParams || !isInitializeParams(request.params)) {
        return respond(
          invalidParams(id, "Invalid morphir.initialize parameters")
        );
      }
      // MEP 0.2 needs a model transport offer. A host that offers 0.1 and no transport gets 0.1, as before.
      const offered = request.params.protocolVersions;
      const offer = isRecord(request.params)
        ? (request.params as Record<string, unknown>).modelTransport
        : undefined;
      let version: MepVersion;
      if (offered.includes(MEP_0_2) && offer !== undefined) {
        const agreement = agreeTransport(offer);
        if (agreement.kind === "invalid") {
          return respond(invalidParams(id, agreement.message));
        }
        transport = agreement.transport;
        version = MEP_0_2;
      } else if (offered.includes(MEP_0_1)) {
        version = MEP_0_1;
      } else {
        return respond(protocolMismatch(id, offered));
      }

      sessionState = Object.freeze({ kind: "ready", protocolVersion: version });
      return respond(
        success(id, {
          protocolVersion: version,
          extension: extensionInfo,
          capabilities: liveCapabilities(),
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
            ? success(id, liveCapabilities())
            : invalidParams(
                id,
                "morphir.extension.capabilities parameters must be an object"
              )
        );
      case "morphir.frontend.compile":
        if (!request.hasParams) {
          return respond(
            invalidParams(id, "Invalid morphir.frontend.compile parameters")
          );
        }
        const compileRequest = parseCompileRequest(request.params);
        if (compileRequest.kind === "invalid") {
          return respond(invalidParams(id, compileRequest.message));
        }
        try {
          const result = await compile(compileRequest.request);
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
      case COMPILE_MODEL: {
        const tuple = transport?.tuples.find(
          (agreed) => agreed.operation === COMPILE_MODEL
        );
        if (tuple === undefined || transport === undefined) {
          return respond(
            failure(id, -32013, `${COMPILE_MODEL} was not negotiated`)
          );
        }
        if (!isRecord(request.params)) {
          return respond(invalidParams(id, "params must be an object"));
        }
        const parsed = parseCompileModelRequest(request.params, tuple);
        if (parsed.kind === "invalid") {
          return respond(invalidParams(id, parsed.message));
        }
        if (parsed.hasDependencies) {
          return respond(
            success(id, {
              success: false,
              diagnostics: [
                {
                  severity: "error",
                  code: UNSUPPORTED_DEPENDENCIES,
                  message:
                    "The Elm classic extension does not support package dependencies in compileModel",
                },
              ],
            })
          );
        }
        let result: unknown;
        try {
          result = await compile(parsed.request);
        } catch (error) {
          if (error instanceof InvalidCompileParamsError) {
            return respond(invalidParams(id, error.message));
          }
          return respond(
            failure(id, -32603, "Elm frontend compilation failed internally")
          );
        }
        if (!isCompileResult(result)) {
          return respond(
            failure(id, -32603, "Elm frontend returned an invalid compile result")
          );
        }
        if (!result.success) {
          return respond(
            success(id, { success: false, diagnostics: result.diagnostics })
          );
        }
        let irText: string;
        try {
          irText = toV4(result.ir);
        } catch {
          return respond(
            failure(id, -32603, "The compiled IR could not be converted to IR 4.0.0")
          );
        }
        const model = envelope(irText, parsed.request.package.name, transport.limits);
        if (model === undefined) {
          return respond(
            success(id, {
              success: false,
              diagnostics: [
                {
                  severity: "error",
                  code: "elm.model_limit",
                  message: "The compiled model is larger than the agreed model limits",
                },
              ],
            })
          );
        }
        return respond(
          success(id, {
            success: true,
            model,
            diagnostics: result.diagnostics,
            modules: result.modules,
          })
        );
      }
      case "morphir.workspace.discover": {
        const discoveryRequest = parseDiscoveryRequest(
          request.hasParams ? request.params : undefined
        );
        if (discoveryRequest.kind === "invalid") {
          return respond(invalidParams(id, discoveryRequest.message));
        }
        try {
          return respond(success(id, discover(discoveryRequest.request)));
        } catch {
          return respond(
            failure(id, -32603, "Elm workspace discovery failed internally")
          );
        }
      }
      case "morphir.shutdown":
        if (request.hasParams && !hasObjectParams(request.params)) {
          return respond(
            invalidParams(id, "morphir.shutdown parameters must be an object")
          );
        }
        sessionState = shutdownState;
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
