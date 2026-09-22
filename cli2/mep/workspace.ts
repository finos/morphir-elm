// Ad-hoc workspace discovery for Elm sources (`morphir.workspace.discover`). The wire types and
// the order of the checks follow the portable discovery engine in morphir-rust
// (crates/morphir-workspace), so a host gets the same answer from this extension as from a
// native provider. Only the ad-hoc-sources purpose is served; manifest discovery stays with the
// host.

import { canParse, format, parse, parseRange, satisfies } from "@std/semver";

import {
  fallbackModuleName,
  normalizePackageIdentity,
  sourceModuleName,
} from "./elm-names";

// The workspace discovery protocol version, a SemVer string. The protocol is a draft, so it is
// refined in place and a reader names the exact draft it speaks.
export const WORKSPACE_DISCOVERY_PROTOCOL = "0.1.0-draft.1";

// The versions this extension reads: a caret for a released line, an exact requirement for a
// draft. A caret alone would also admit later drafts of the same release.
const SPOKEN = ["=0.1.0-draft.1"].map((requirement) => parseRange(requirement));

// Whether `value` is a version in canonical SemVer spelling. `@std/semver` also parses
// spellings such as a leading `v`, which the Rust `semver` crate refuses; a version on the wire
// must read the same in both, so only the spelling `format` writes back is accepted.
export function isSemVer(value: string): boolean {
  return canParse(value) && format(parse(value)) === value;
}

export function speaksWorkspaceDiscoveryProtocol(version: string): boolean {
  if (!isSemVer(version)) {
    return false;
  }
  const parsed = parse(version);
  return SPOKEN.some((range) => satisfies(parsed, range));
}

export type FileEntry =
  | { readonly kind: "directory" }
  | { readonly kind: "file"; readonly text: string }
  | { readonly kind: "symlink"; readonly target: string };

export interface FileTree {
  readonly entries: ReadonlyMap<string, FileEntry>;
}

export type ProjectSource =
  | { readonly kind: "synthesized" }
  | { readonly kind: "manifest"; readonly path: string };

export interface SourceSelection {
  readonly root: string;
  readonly paths: readonly string[];
}

export type DiscoveryPurpose =
  | { readonly kind: "manifest-projects" }
  | {
      readonly kind: "ad-hoc-sources";
      readonly project: ProjectSource;
      readonly sources: SourceSelection;
      readonly languageId: string;
    };

export interface DiscoveryRequest {
  readonly protocolVersion: string;
  readonly developmentRoot: FileTree;
  readonly morphirHome: FileTree | null;
  readonly systemConfig: FileTree | null;
  readonly cliOverlay: unknown;
  readonly purpose: DiscoveryPurpose;
}

export type ProjectOrigin =
  | { readonly kind: "manifest"; readonly path: string }
  | { readonly kind: "synthesized"; readonly inputs: readonly string[] };

export interface ProjectSnapshot {
  readonly name: string;
  readonly version: null;
  readonly relativePath: string;
  readonly configAnchor: string | null;
  readonly sourceDirectory: string;
  readonly state: "unloaded";
  readonly diagnostics: readonly never[];
  readonly origin: ProjectOrigin;
  readonly exposedModules: readonly string[];
}

export interface WorkspaceSnapshot {
  readonly protocolVersion: string;
  readonly configAnchor: null;
  readonly name: null;
  readonly state: "open";
  readonly projects: readonly ProjectSnapshot[];
  readonly diagnostics: readonly never[];
}

export interface DiscoveryFailure {
  readonly code: string;
  readonly message: string;
  readonly path: string | null;
}

export type DiscoveryResponse =
  | { readonly status: "success"; readonly snapshot: WorkspaceSnapshot }
  | { readonly status: "failure"; readonly error: DiscoveryFailure };

export type DiscoveryRequestParseResult =
  | { readonly kind: "valid"; readonly request: DiscoveryRequest }
  | { readonly kind: "invalid"; readonly message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function has(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** A canonical path confined to its mount, as morphir-workspace `RelativePath` accepts it. */
export function isRelativePath(value: unknown): value is string {
  if (value === ".") {
    return true;
  }
  return (
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !/^[A-Za-z]:/u.test(value) &&
    value
      .split("/")
      .every(
        (segment) => segment.length > 0 && segment !== "." && segment !== ".."
      )
  );
}

class InvalidDiscoveryParams extends Error {}

function invalid(message: string): never {
  throw new InvalidDiscoveryParams(message);
}

function parseFileEntry(path: string, value: unknown): FileEntry {
  if (isRecord(value)) {
    if (value.kind === "directory") {
      return { kind: "directory" };
    }
    if (value.kind === "file" && typeof value.text === "string") {
      return { kind: "file", text: value.text };
    }
    if (value.kind === "symlink" && isRelativePath(value.target)) {
      return { kind: "symlink", target: value.target };
    }
  }
  return invalid(`Invalid file tree entry at ${path}`);
}

// Entries are kept in the byte order of their UTF-8 paths, the order a Rust BTreeMap iterates.
function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function parseFileTree(name: string, value: unknown): FileTree {
  if (!isRecord(value) || !isRecord(value.entries)) {
    return invalid(`${name} must be a file tree`);
  }
  const entries = value.entries;
  const paths = Object.keys(entries).sort(compareUtf8);
  return {
    entries: new Map(
      paths.map((path) => {
        if (!isRelativePath(path)) {
          invalid(`${name} path ${path} is not confined to its mount`);
        }
        return [path, parseFileEntry(path, entries[path])] as const;
      })
    ),
  };
}

function parseOptionalFileTree(
  value: Record<string, unknown>,
  key: string,
  name: string
): FileTree | null {
  return value[key] === undefined || value[key] === null
    ? null
    : parseFileTree(name, value[key]);
}

function parseProjectSource(value: unknown): ProjectSource {
  if (isRecord(value)) {
    if (value.kind === "synthesized") {
      return { kind: "synthesized" };
    }
    if (value.kind === "manifest" && isRelativePath(value.path)) {
      return { kind: "manifest", path: value.path };
    }
  }
  return invalid("Invalid ad-hoc project source");
}

function parseSourceSelection(value: unknown): SourceSelection {
  if (
    !isRecord(value) ||
    !isRelativePath(value.root) ||
    !Array.isArray(value.paths) ||
    !value.paths.every(isRelativePath)
  ) {
    return invalid("Invalid ad-hoc source selection");
  }
  return { root: value.root, paths: value.paths };
}

function parsePurpose(value: unknown): DiscoveryPurpose {
  if (value === undefined) {
    return { kind: "manifest-projects" };
  }
  if (isRecord(value)) {
    if (value.kind === "manifest-projects") {
      return { kind: "manifest-projects" };
    }
    if (value.kind === "ad-hoc-sources") {
      if (typeof value.languageId !== "string") {
        return invalid("An ad-hoc discovery purpose requires a languageId");
      }
      return {
        kind: "ad-hoc-sources",
        project: parseProjectSource(value.project),
        sources: parseSourceSelection(value.sources),
        languageId: value.languageId,
      };
    }
  }
  return invalid("Invalid workspace discovery purpose");
}

export function parseDiscoveryRequest(
  value: unknown
): DiscoveryRequestParseResult {
  try {
    if (!isRecord(value)) {
      return invalid("morphir.workspace.discover parameters must be an object");
    }
    const protocolVersion = value.protocolVersion;
    if (typeof protocolVersion !== "string" || !isSemVer(protocolVersion)) {
      return invalid("protocolVersion must be a SemVer version");
    }
    if (
      has(value, "environment") &&
      (!isRecord(value.environment) ||
        !Object.values(value.environment).every(
          (entry) => typeof entry === "string"
        ))
    ) {
      return invalid("environment must map names to strings");
    }
    return {
      kind: "valid",
      request: {
        protocolVersion,
        developmentRoot: parseFileTree(
          "developmentRoot",
          value.developmentRoot
        ),
        morphirHome: parseOptionalFileTree(value, "morphirHome", "morphirHome"),
        systemConfig: parseOptionalFileTree(
          value,
          "systemConfig",
          "systemConfig"
        ),
        cliOverlay: has(value, "cliOverlay") ? value.cliOverlay : null,
        purpose: parsePurpose(value.purpose),
      },
    };
  } catch (error) {
    if (error instanceof InvalidDiscoveryParams) {
      return { kind: "invalid", message: error.message };
    }
    throw error;
  }
}

class Refusal extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly path: string | null
  ) {
    super(message);
  }
}

function refuse(code: string, message: string, path: string | null): never {
  throw new Refusal(code, message, path);
}

function rejectSymlinks(tree: FileTree | null, mount: string): void {
  for (const [path, entry] of tree?.entries ?? []) {
    if (entry.kind === "symlink") {
      refuse(
        "workspace.symlink.unsupported",
        `unmaterialized symlink \`${path}\` to \`${entry.target}\` in ${mount}; protocol-v1 hosts must materialize confined symlink targets before discovery`,
        path
      );
    }
  }
}

function explicitProjectName(
  cliOverlay: unknown,
  root: string
): string | undefined {
  const project = isRecord(cliOverlay) ? cliOverlay.project : undefined;
  if (!isRecord(project) || !has(project, "name")) {
    return undefined;
  }
  const name = project.name;
  if (typeof name !== "string") {
    return refuse(
      "workspace.config.invalid",
      `CLI overlay \`project.name\` must be a string, found \`${JSON.stringify(
        name
      )}\``,
      root
    );
  }
  if (name.trim().length === 0) {
    return refuse(
      "workspace.project-name.empty",
      "CLI overlay `project.name` must not be empty or whitespace-only",
      root
    );
  }
  return name.trim();
}

function segments(path: string): readonly string[] {
  return path === "." ? [] : path.split("/");
}

function isUnderRoot(root: string, path: string): boolean {
  const rootSegments = segments(root);
  const pathSegments = segments(path);
  return (
    pathSegments.length > rootSegments.length &&
    rootSegments.every((segment, index) => pathSegments[index] === segment)
  );
}

function fileText(tree: FileTree, path: string): string | undefined {
  const entry = tree.entries.get(path);
  return entry?.kind === "file" ? entry.text : undefined;
}

function listed(paths: readonly string[]): string {
  return paths.map((path) => `\`${path}\``).join(", ");
}

function validateSelection(tree: FileTree, sources: SourceSelection): void {
  if (sources.paths.length === 0) {
    refuse(
      "workspace.selection.empty",
      `ad-hoc selection rooted at \`${sources.root}\` selects no sources`,
      sources.root
    );
  }
  const seen = new Set<string>();
  for (const path of sources.paths) {
    if (seen.has(path)) {
      refuse(
        "workspace.selection.duplicate",
        `selected path \`${path}\` is repeated in the selection`,
        path
      );
    }
    seen.add(path);
  }
  const outsideRoot = sources.paths.filter(
    (path) => !isUnderRoot(sources.root, path)
  );
  if (outsideRoot.length > 0) {
    refuse(
      "workspace.selection.outside-root",
      `selected paths are not under selection root \`${
        sources.root
      }\`: ${listed(outsideRoot)}`,
      outsideRoot[0] ?? null
    );
  }
  const notFiles = sources.paths.filter(
    (path) => fileText(tree, path) === undefined
  );
  if (notFiles.length > 0) {
    refuse(
      "workspace.selection.invalid",
      `selected paths do not resolve to files: ${listed(notFiles)}`,
      notFiles[0] ?? null
    );
  }
}

function fileName(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

function moduleName(path: string, text: string): string {
  return sourceModuleName(text) ?? fallbackModuleName(fileName(path));
}

// The historical single-file rule: ASCII-lowercase the module and join its segments with `-`.
function synthesizedPackageName(module: string): string {
  return `local/${module
    .replace(/[A-Z]/gu, (letter) => letter.toLowerCase())
    .replace(/\./gu, "-")}`;
}

function discoverAdHocSources(
  request: DiscoveryRequest,
  project: ProjectSource,
  sources: SourceSelection,
  languageId: string
): WorkspaceSnapshot {
  const root = sources.root;
  if (languageId.length === 0) {
    refuse(
      "workspace.language-id.empty",
      `ad-hoc selection rooted at \`${root}\` has an empty language id`,
      root
    );
  }
  const explicitName = explicitProjectName(request.cliOverlay, root);
  if (project.kind === "manifest") {
    if (explicitName === undefined) {
      refuse(
        "workspace.selection.name-required",
        `ad-hoc selection borrowing manifest \`${project.path}\` has no explicit name; the host states the manifest's project name as the overlay's \`project.name\``,
        project.path
      );
    }
    if (fileText(request.developmentRoot, project.path) === undefined) {
      refuse(
        "workspace.selection.invalid",
        `manifest \`${project.path}\` is not a file in the request`,
        project.path
      );
    }
  }
  validateSelection(request.developmentRoot, sources);

  if (explicitName !== undefined) {
    if (normalizePackageIdentity(explicitName) === undefined) {
      refuse(
        "workspace.project-name.invalid",
        `project name \`${explicitName}\` is invalid: it is not a canonical Morphir package name`,
        root
      );
    }
  } else if (sources.paths.length !== 1) {
    refuse(
      "workspace.selection.name-required",
      `ad-hoc selection rooted at \`${root}\` selects ${sources.paths.length} sources but has no explicit name; an unnamed synthesized selection must select exactly one source`,
      root
    );
  }

  const modules: string[] = [];
  const definedBy = new Map<string, string>();
  for (const path of sources.paths) {
    const module = moduleName(
      path,
      fileText(request.developmentRoot, path) ?? ""
    );
    const first = definedBy.get(module);
    if (first !== undefined) {
      refuse(
        "workspace.selection.module-collision",
        `selected sources \`${first}\` and \`${path}\` both define module \`${module}\``,
        path
      );
    }
    definedBy.set(module, path);
    modules.push(module);
  }

  return {
    protocolVersion: WORKSPACE_DISCOVERY_PROTOCOL,
    configAnchor: null,
    name: null,
    state: "open",
    projects: [
      {
        name: explicitName ?? synthesizedPackageName(modules[0] as string),
        version: null,
        relativePath: root,
        configAnchor: project.kind === "manifest" ? project.path : null,
        sourceDirectory: ".",
        state: "unloaded",
        diagnostics: [],
        origin:
          project.kind === "manifest"
            ? { kind: "manifest", path: project.path }
            : { kind: "synthesized", inputs: [...sources.paths] },
        exposedModules: modules,
      },
    ],
    diagnostics: [],
  };
}

function discoverSnapshot(request: DiscoveryRequest): WorkspaceSnapshot {
  if (!speaksWorkspaceDiscoveryProtocol(request.protocolVersion)) {
    refuse(
      "workspace.protocol.unsupported",
      `unsupported workspace discovery protocol ${request.protocolVersion}; supported version is ${WORKSPACE_DISCOVERY_PROTOCOL}`,
      null
    );
  }
  if (request.cliOverlay !== null && !isRecord(request.cliOverlay)) {
    refuse(
      "workspace.config.invalid",
      "CLI overlay must be a JSON object or null",
      null
    );
  }
  rejectSymlinks(request.developmentRoot, "development root");
  rejectSymlinks(request.morphirHome, "Morphir Home");
  rejectSymlinks(request.systemConfig, "system configuration");

  const purpose = request.purpose;
  if (purpose.kind === "manifest-projects") {
    return refuse(
      "workspace.purpose.unsupported",
      "the Morphir Elm extension discovers ad-hoc sources only; manifest projects are discovered by the host",
      null
    );
  }
  return discoverAdHocSources(
    request,
    purpose.project,
    purpose.sources,
    purpose.languageId
  );
}

export function discover(request: DiscoveryRequest): DiscoveryResponse {
  try {
    return { status: "success", snapshot: discoverSnapshot(request) };
  } catch (error) {
    if (error instanceof Refusal) {
      return {
        status: "failure",
        error: { code: error.code, message: error.message, path: error.path },
      };
    }
    throw error;
  }
}
