import {
  buildFromScratch,
  ElmWorkerDecodeError,
  // @ts-expect-error CLI2 build output has no declaration artifact.
} from "../../packages/cli2/lib/cli.js";
import type { WorkerBuildInput } from "../../packages/cli2/worker-build";
import {
  normalizePackageIdentity,
  sourceModuleName,
  type NormalizedPackageIdentity,
} from "./elm-names";
import { InvalidCompileParamsError } from "./protocol";

import type {
  CompileFailure,
  Compile,
  CompileRequest,
  CompileResult,
  Diagnostic,
  SourceDocument,
  SourcePosition,
  SourceRange,
} from "./protocol";

type WorkerPosition =
  | { readonly row: number; readonly column: number }
  | { readonly row: number; readonly col: number };

const runWorkerBuild = buildFromScratch as (
  input: WorkerBuildInput,
  onProgress: (message: string) => void
) => Promise<unknown>;

interface WorkerRange {
  readonly start: WorkerPosition;
  readonly end: WorkerPosition;
}

interface WorkerLocation {
  readonly range?: WorkerRange;
}

const zeroPosition: SourcePosition = Object.freeze({ line: 0, character: 0 });
const zeroRange: SourceRange = Object.freeze({
  start: zeroPosition,
  end: zeroPosition,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isWorkerPosition(value: unknown): value is WorkerPosition {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.row) &&
    (Number.isSafeInteger(value.column) || Number.isSafeInteger(value.col))
  );
}

function workerColumn(position: WorkerPosition): number {
  return "column" in position ? position.column : position.col;
}

export function workerPositionToMep(
  source: string,
  position: WorkerPosition
): SourcePosition {
  const lines = source.split(/\r\n|\r|\n/u);
  const line = Math.max(0, Math.min(position.row - 1, lines.length - 1));
  const sourceLine = lines[line] ?? "";
  const codePointOffset = Math.max(
    0,
    Math.min(workerColumn(position) - 1, Array.from(sourceLine).length)
  );
  const character = Array.from(sourceLine)
    .slice(0, codePointOffset)
    .join("").length;

  return { line, character };
}

export function toWorkerBuildInput(request: CompileRequest): WorkerBuildInput {
  const document = request.sources.documents[0];
  if (document === undefined) {
    throw new Error("An Elm worker build requires one source document");
  }
  const packageIdentity = normalizePackageIdentity(request.package.name);
  if (packageIdentity === undefined) {
    throw new Error("An Elm worker build requires a canonical package name");
  }

  return {
    options: { typesOnly: request.options.typesOnly },
    packageInfo: {
      name: packageIdentity.workerName,
      exposedModules: request.package.exposedModules,
    },
    dependencies: request.dependencies.map(
      (dependency) => dependency.distribution
    ),
    fileSnapshot: { [document.uri]: document.text },
  };
}

function compileFailure(
  message: string,
  document?: SourceDocument,
  code = "elm.compiler",
  range = zeroRange,
  data?: unknown
): CompileFailure {
  const diagnostic: Diagnostic = {
    severity: "error",
    code,
    message,
    ...(document === undefined
      ? {}
      : { location: { uri: document.uri, range } }),
    ...(data === undefined ? {} : { data }),
  };

  return {
    success: false,
    diagnostics: [diagnostic],
    modules: [],
  };
}

function invalidParams(message: string): never {
  throw new InvalidCompileParamsError(message);
}

interface VersionedLibraryDistribution {
  readonly formatVersion: 3;
  readonly distribution: readonly ["Library", unknown, unknown, unknown];
}

function versionedLibraryDistribution(
  value: unknown
): VersionedLibraryDistribution | undefined {
  if (
    !isRecord(value) ||
    value.formatVersion !== 3 ||
    !Array.isArray(value.distribution) ||
    value.distribution.length !== 4 ||
    value.distribution[0] !== "Library" ||
    !Array.isArray(value.distribution[2]) ||
    !isRecord(value.distribution[3])
  ) {
    return undefined;
  }
  return value as unknown as VersionedLibraryDistribution;
}

interface ValidatedRequest {
  readonly document: SourceDocument;
  readonly packageIdentity: NormalizedPackageIdentity;
}

function validateRequest(request: CompileRequest): ValidatedRequest {
  if (request.languageId !== "elm") {
    invalidParams("Morphir Elm only compiles the elm language");
  }
  // The extension accepts the source root for wire compatibility, but one-document compilation
  // does not need it. Keep module resolution unchanged until multi-document input is supported.
  if (request.sources.documents.length !== 1) {
    invalidParams("Morphir Elm requires exactly one source document");
  }
  const document = request.sources.documents[0] as SourceDocument;
  if (document.languageId !== "elm") {
    invalidParams("The source document language must be elm");
  }
  if (document.uri.trim().length === 0) {
    invalidParams("The source document URI must not be empty");
  }
  const packageIdentity = normalizePackageIdentity(request.package.name);
  if (packageIdentity === undefined) {
    invalidParams("The Morphir package name must be canonical");
  }
  if (request.options.irVersion !== "3") {
    invalidParams("Morphir Elm only emits Morphir IR version 3");
  }

  const dependencyKeys = new Set<string>();
  for (const dependency of request.dependencies) {
    const declaredPackage = normalizePackageIdentity(dependency.packageName);
    if (declaredPackage === undefined) {
      invalidParams(
        `Dependency package name ${dependency.packageName} is not canonical`
      );
    }
    if (dependency.irVersion !== "3") {
      invalidParams(
        `Dependency ${dependency.packageName} declares unsupported IR ${dependency.irVersion}`
      );
    }
    const distribution = versionedLibraryDistribution(dependency.distribution);
    if (distribution === undefined) {
      invalidParams(
        `Dependency ${dependency.packageName} is not a versioned Morphir IR 3 library distribution`
      );
    }
    const embeddedPackage = normalizePackageIdentity(
      distribution.distribution[1]
    );
    if (embeddedPackage === undefined) {
      invalidParams(
        `Dependency ${dependency.packageName} does not contain a canonical package identity`
      );
    }
    if (declaredPackage.key !== embeddedPackage.key) {
      invalidParams(
        `Dependency ${dependency.packageName} contains package ${embeddedPackage.canonicalName}`
      );
    }
    if (dependencyKeys.has(declaredPackage.key)) {
      invalidParams(
        `Dependency ${dependency.packageName} was supplied more than once`
      );
    }
    dependencyKeys.add(declaredPackage.key);
  }

  const moduleName = sourceModuleName(document.text);
  if (moduleName !== undefined) {
    const missingModules = request.package.exposedModules.filter(
      (exposedModule) => exposedModule !== moduleName
    );
    if (missingModules.length > 0) {
      invalidParams(
        `Exposed modules are not present in the submitted document: ${missingModules.join(
          ", "
        )}`
      );
    }
  }

  return { document, packageIdentity };
}

function workerRangeToMep(
  source: string,
  value: unknown
): SourceRange | undefined {
  if (
    !isRecord(value) ||
    !isWorkerPosition(value.start) ||
    !isWorkerPosition(value.end)
  ) {
    return undefined;
  }

  return {
    start: workerPositionToMep(source, {
      row: value.start.row,
      column: workerColumn(value.start),
    }),
    end: workerPositionToMep(source, {
      row: value.end.row,
      column: workerColumn(value.end),
    }),
  };
}

function taggedWorkerError(
  error: readonly unknown[],
  document: SourceDocument
): CompileFailure | undefined {
  const tag = typeof error[0] === "string" ? error[0] : undefined;
  if (tag === "ParserError") {
    const deadEnds = Array.isArray(error[2]) ? error[2] : [];
    const first = deadEnds[0];
    const position = isWorkerPosition(first)
      ? workerPositionToMep(document.text, {
          row: first.row,
          column: workerColumn(first),
        })
      : zeroPosition;
    const range = { start: position, end: position };
    return compileFailure(
      "Elm source contains a syntax error",
      document,
      "elm.parser",
      range,
      error
    );
  }

  const codes: Readonly<Record<string, string>> = {
    ModuleCycleDetected: "elm.module-cycle",
    TypeCycleDetected: "elm.type-cycle",
    TypeNotFound: "elm.type-not-found",
    ValueCycleDetected: "elm.value-cycle",
    InvalidModuleName: "elm.invalid-module-name",
    MappingError: "elm.mapping",
    ResolveError: "elm.resolve",
  };
  const code = tag === undefined ? undefined : codes[tag];
  if (code === undefined) {
    return undefined;
  }
  return compileFailure(
    "Elm compilation failed",
    document,
    code,
    zeroRange,
    error
  );
}

function structuredWorkerError(
  error: Record<string, unknown>,
  document: SourceDocument
): CompileFailure | undefined {
  const sourceCodes = new Set([
    "elm.parser",
    "elm.module-cycle",
    "elm.type-cycle",
    "elm.type-not-found",
    "elm.value-cycle",
    "elm.invalid-module-name",
    "elm.mapping",
    "elm.resolve",
  ]);
  const code = typeof error.code === "string" ? error.code : undefined;
  if (code === undefined || !sourceCodes.has(code)) {
    return undefined;
  }
  const message =
    typeof error.message === "string"
      ? error.message
      : "Elm compilation failed";
  const location = isRecord(error.location)
    ? (error.location as WorkerLocation)
    : undefined;
  const range = workerRangeToMep(document.text, location?.range) ?? zeroRange;

  return compileFailure(message, document, code, range, error);
}

function workerFailure(
  error: unknown,
  document: SourceDocument
): CompileFailure | undefined {
  const firstError =
    Array.isArray(error) && (Array.isArray(error[0]) || isRecord(error[0]))
      ? error[0]
      : error;
  if (Array.isArray(firstError)) {
    return taggedWorkerError(firstError, document);
  }
  if (isRecord(firstError)) {
    return structuredWorkerError(firstError, document);
  }
  return undefined;
}

function workerInvalidParams(error: unknown): string | undefined {
  const firstError =
    Array.isArray(error) && (Array.isArray(error[0]) || isRecord(error[0]))
      ? error[0]
      : error;
  if (Array.isArray(firstError) && firstError[0] === "InvalidSourceFilePath") {
    return "The source document URI is not supported by Morphir Elm";
  }
  if (isRecord(firstError) && firstError.code === "elm.invalid-source-path") {
    return typeof firstError.message === "string"
      ? firstError.message
      : "The source document URI is not supported by Morphir Elm";
  }
  const details =
    isRecord(firstError) && Array.isArray(firstError.details)
      ? firstError.details
      : firstError;
  if (
    Array.isArray(details) &&
    details[0] === "RepoError" &&
    details[1] === "Error while building repo."
  ) {
    return "The compile request contains conflicting Elm dependencies";
  }
  return undefined;
}

function titleCaseName(name: unknown): string | undefined {
  if (!Array.isArray(name) || !name.every((word) => typeof word === "string")) {
    return undefined;
  }
  return name
    .map((word) =>
      word.length === 0 ? "" : `${word[0]?.toUpperCase()}${word.slice(1)}`
    )
    .join("");
}

function moduleName(path: unknown): string | undefined {
  if (!Array.isArray(path)) {
    return undefined;
  }
  const segments = path.map(titleCaseName);
  return segments.every((segment): segment is string => segment !== undefined)
    ? segments.join(".")
    : undefined;
}

function modulesFromIr(ir: unknown): readonly string[] {
  if (!isRecord(ir) || !Array.isArray(ir.distribution)) {
    return [];
  }
  const packageDefinition = ir.distribution[3];
  if (
    !isRecord(packageDefinition) ||
    !Array.isArray(packageDefinition.modules)
  ) {
    return [];
  }

  return packageDefinition.modules.flatMap((entry) => {
    if (!Array.isArray(entry)) {
      return [];
    }
    const name = moduleName(entry[0]);
    return name === undefined ? [] : [name];
  });
}

function isClassicName(value: unknown): value is readonly string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((word) => typeof word === "string" && /^[a-z0-9]+$/u.test(word))
  );
}

function isClassicPath(
  value: unknown
): value is readonly (readonly string[])[] {
  return Array.isArray(value) && value.length > 0 && value.every(isClassicName);
}

function isPair(value: unknown): value is readonly [unknown, unknown] {
  return Array.isArray(value) && value.length === 2;
}

function hasOptionalDoc(value: Record<string, unknown>): boolean {
  return (
    !("doc" in value) || value.doc === null || typeof value.doc === "string"
  );
}

function isDocumented(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.doc === "string" &&
    value.value !== null &&
    value.value !== undefined
  );
}

function isAccessControlled(
  value: unknown,
  validateValue: (candidate: unknown) => boolean
): boolean {
  return (
    isRecord(value) &&
    (value.access === "Public" || value.access === "Private") &&
    validateValue(value.value)
  );
}

function isNamedEntries(
  value: unknown,
  validateValue: (candidate: unknown) => boolean
): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isPair(entry) && isClassicName(entry[0]) && validateValue(entry[1])
    )
  );
}

function isModuleDefinition(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOptionalDoc(value) &&
    isNamedEntries(value.types, (entry) =>
      isAccessControlled(entry, isDocumented)
    ) &&
    isNamedEntries(value.values, (entry) =>
      isAccessControlled(entry, isDocumented)
    )
  );
}

function isModuleSpecification(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOptionalDoc(value) &&
    isNamedEntries(value.types, isDocumented) &&
    isNamedEntries(value.values, isDocumented)
  );
}

function isPackageDefinition(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.modules) &&
    value.modules.every(
      (entry) =>
        isPair(entry) &&
        isClassicPath(entry[0]) &&
        isAccessControlled(entry[1], isModuleDefinition)
    )
  );
}

function isPackageSpecification(value: unknown): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.modules) &&
    value.modules.every(
      (entry) =>
        isPair(entry) &&
        isClassicPath(entry[0]) &&
        isModuleSpecification(entry[1])
    )
  );
}

function areDependencySpecifications(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isPair(entry) &&
        isClassicPath(entry[0]) &&
        isPackageSpecification(entry[1])
    )
  );
}

function workerInputForCompilation(
  request: CompileRequest,
  moduleName: string | undefined
): WorkerBuildInput {
  const input = toWorkerBuildInput(request);
  if (moduleName === undefined || request.package.exposedModules.length > 0) {
    return input;
  }

  return {
    ...input,
    packageInfo: {
      ...input.packageInfo,
      exposedModules: [moduleName],
    },
  };
}

function applyRequestedExposure(
  ir: unknown,
  exposedModules: readonly string[]
): unknown {
  if (!isRecord(ir) || !Array.isArray(ir.distribution)) {
    return ir;
  }
  const packageDefinition = ir.distribution[3];
  if (
    !isRecord(packageDefinition) ||
    !Array.isArray(packageDefinition.modules)
  ) {
    return ir;
  }
  const exposed = new Set(exposedModules);
  const modules = packageDefinition.modules.map((entry) => {
    if (!Array.isArray(entry) || !isRecord(entry[1])) {
      return entry;
    }
    const name = moduleName(entry[0]);
    if (name === undefined) {
      return entry;
    }
    return [
      entry[0],
      { ...entry[1], access: exposed.has(name) ? "Public" : "Private" },
    ];
  });
  const distribution = [...ir.distribution];
  distribution[3] = { ...packageDefinition, modules };
  return { ...ir, distribution };
}

function validateWorkerIr(
  ir: unknown,
  expectedPackage: NormalizedPackageIdentity,
  expectedModule: string | undefined
): readonly string[] {
  if (
    !isRecord(ir) ||
    ir.formatVersion !== 3 ||
    !Array.isArray(ir.distribution) ||
    ir.distribution.length !== 4 ||
    ir.distribution[0] !== "Library" ||
    normalizePackageIdentity(ir.distribution[1])?.key !== expectedPackage.key ||
    !areDependencySpecifications(ir.distribution[2]) ||
    !isPackageDefinition(ir.distribution[3])
  ) {
    throw new Error("Elm worker returned invalid Morphir IR 3");
  }
  const modules = modulesFromIr(ir);
  if (
    expectedModule === undefined ||
    modules.length === 0 ||
    !modules.includes(expectedModule)
  ) {
    throw new Error("Elm worker returned IR without the submitted module");
  }
  return modules;
}

export type ElmWorkerBuild = (
  input: WorkerBuildInput,
  onProgress: (message: string) => void
) => Promise<unknown>;

export function createElmCompiler(
  runBuild: ElmWorkerBuild = runWorkerBuild
): Compile {
  return async (request: CompileRequest): Promise<CompileResult> => {
    const { document, packageIdentity } = validateRequest(request);
    const expectedModule = sourceModuleName(document.text);
    let rawIr: unknown;
    try {
      rawIr = await runBuild(
        workerInputForCompilation(request, expectedModule),
        console.error
      );
    } catch (error) {
      if (error instanceof ElmWorkerDecodeError) {
        invalidParams("The compile request contains invalid Elm worker input");
      }
      const invalidWorkerParams = workerInvalidParams(error);
      if (invalidWorkerParams !== undefined) {
        invalidParams(invalidWorkerParams);
      }
      const sourceFailure = workerFailure(error, document);
      if (sourceFailure !== undefined) {
        return sourceFailure;
      }
      throw error;
    }

    const modules = validateWorkerIr(rawIr, packageIdentity, expectedModule);
    const ir = applyRequestedExposure(rawIr, request.package.exposedModules);
    return {
      success: true,
      irVersion: "3",
      ir: ir as NonNullable<unknown>,
      diagnostics: [],
      modules,
    };
  };
}

export const compileElm = createElmCompiler();
