// Pure rules for the pinned finos/morphir-moonbit checkout in moonbit/.deps. The moonbit:deps task does
// the git work; what a valid pin is, and when the checkout must be fetched again, is decided here.

export interface Pin {
  readonly repository: string;
  readonly commit: string;
  readonly paths: readonly string[];
}

/** What is checked out now, or null when there is no usable checkout. */
export interface Checkout {
  readonly commit: string;
  readonly paths: readonly string[];
}

const COMMIT = /^[0-9a-f]{40}$/;
const PACKAGE_PATH = /^pkgs\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reads the [morphir-moonbit] table of moonbit/deps.toml. Throws an Error that names the bad field. */
export function parsePin(value: unknown): Pin {
  if (!isRecord(value)) {
    throw new Error("moonbit/deps.toml has no [morphir-moonbit] table");
  }
  const { repository, commit, paths } = value;
  if (typeof repository !== "string" || repository.length === 0) {
    throw new Error("moonbit/deps.toml: repository must be a non-empty string");
  }
  if (typeof commit !== "string" || !COMMIT.test(commit)) {
    throw new Error(
      `moonbit/deps.toml: commit must be a full 40-character lowercase commit, got '${String(commit)}'`
    );
  }
  if (!Array.isArray(paths) || paths.length === 0) {
    throw new Error("moonbit/deps.toml: paths must list at least one path");
  }
  for (const path of paths) {
    if (typeof path !== "string" || !PACKAGE_PATH.test(path) || path.split("/").includes("..")) {
      throw new Error(`moonbit/deps.toml: paths must be under pkgs/, got '${String(path)}'`);
    }
  }
  return { repository, commit, paths: [...paths] };
}

/** Fetch again unless the checkout is at the pinned commit with exactly the pinned paths. */
export function planDepsFetch(current: Checkout | null, pin: Pin): "skip" | "fetch" {
  if (current === null || current.commit !== pin.commit) {
    return "fetch";
  }
  const have = new Set(current.paths);
  const want = new Set(pin.paths);
  const same = have.size === want.size && [...want].every((path) => have.has(path));
  return same ? "skip" : "fetch";
}
