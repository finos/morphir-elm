// Pure rules for publishing the finos/morphir-elm module to mooncakes. The release:elm-extension-mooncakes task does
// the packaging, the network and the upload; what an archive, a registry answer and a credential must be is decided
// here and tested.
import { isSemVer } from "./release";

export const MODULE_NAME = "finos/morphir-elm";
export const REGISTRY = "https://mooncakes.io";
/** The mooncakes account that owns the finos/* modules. */
export const ACCOUNT = "finos";

function requireSemVer(version: string): void {
  if (!isSemVer(version)) {
    throw new Error(`'${version}' is not a SemVer version`);
  }
}

/** The file that `moon package` writes to _build/publish. */
export function archiveName(version: string): string {
  return `finos-morphir-elm-${version}.zip`;
}

const REQUIRED = ["moon.mod", "README.md", "LICENSE"];
// Repository tooling, workspace files, and build and dependency directories. The module is the MoonBit packages only.
const REFUSED_TOP = ["tooling/", "tests/", "scripts/", "_build/", ".mooncakes/", ".deps/"];
const REFUSED_FILES = ["deps.toml", "moon.work"];

function refused(entry: string): boolean {
  if (entry.startsWith("/") || entry.split("/").includes("..")) return true;
  if (REFUSED_FILES.includes(entry)) return true;
  if (REFUSED_TOP.some((prefix) => entry.startsWith(prefix))) return true;
  return entry.startsWith("node_modules/") || entry.includes("/node_modules/");
}

/** Throws an Error that names every missing and every refused entry of the module archive. */
export function checkArchiveEntries(entries: readonly string[]): void {
  const missing = REQUIRED.filter((file) => !entries.includes(file));
  const bad = entries.filter(refused);
  const problems = [
    ...missing.map((file) => `missing ${file}`),
    ...bad.map((entry) => `refused ${entry}`),
  ];
  if (problems.length > 0) {
    throw new Error(`the ${MODULE_NAME} archive is not the module only:\n${problems.join("\n")}`);
  }
}

export type RegistryState = "absent" | "present" | "unknown";

/** The answer of GET /api/v0/manifest/<module>@<version>. Only "absent" permits an upload. */
export function registryState(status: number): RegistryState {
  if (status === 404) return "absent";
  if (status === 200) return "present";
  return "unknown";
}

/** The answer of GET /api/v0/api_token/check for a token of the finos account. */
export function isFinosAccount(status: number, body: unknown): boolean {
  if (status !== 200 || typeof body !== "object" || body === null || Array.isArray(body)) return false;
  const fields = body as Record<string, unknown>;
  return fields.ok === true && fields.username === ACCOUNT;
}

/** The content of credentials.json in the upload's Moon home. */
export function credentialsJson(token: string): string {
  if (token.trim().length === 0) {
    throw new Error("MOONCAKES_TOKEN must be set and not empty");
  }
  return `${JSON.stringify({ token, username: ACCOUNT, registry_api: REGISTRY })}\n`;
}

/** Child output with every copy of the token replaced. */
export function redact(text: string, token: string): string {
  return token.length === 0 ? text : text.split(token).join("***");
}

/** A new module that imports the published version and tests that the resolved module reports that version. */
export function consumerFiles(version: string): Readonly<Record<string, string>> {
  requireSemVer(version);
  return {
    "moon.mod": `name = "morphir-elm-release/consumer"\n\nversion = "0.0.0"\n\nimport {\n  "${MODULE_NAME}@${version}",\n}\n`,
    "moon.work": `members = [\n  ".",\n]\n`,
    "moon.pkg": `import {\n  "${MODULE_NAME}/mep",\n} for "test"\n`,
    "consumer_test.mbt": [
      "///|",
      `test "the published ${MODULE_NAME} is ${version}" {`,
      `  assert_eq(@mep.VERSION, "${version}")`,
      "  assert_false(@mep.Session::new().exited())",
      "}",
      "",
    ].join("\n"),
  };
}
