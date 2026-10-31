/**
 * Shared helpers for the MoonBit tasks. This file is imported by tasks, not executed directly.
 */

import { exec, join, ROOT_DIR } from "../_lib.ts";
import { Glob } from "bun";

/** Module root of finos/morphir-elm, the MoonBit Elm extension. */
export const MOONBIT_DIR = join(ROOT_DIR, "moonbit");

/** Fails early when the MoonBit toolchain from mise.moonbit.toml is not active. */
export function requireMoon(): void {
  if (Bun.which("moon") === null) {
    throw new Error(
      "moon is not installed. Run MoonBit tasks with MISE_ENV=moonbit, for example: MISE_ENV=moonbit mise run moonbit:test"
    );
  }
}

/** Runs moon in moonbit/, whatever the caller's working directory is. */
export async function moon(
  args: readonly string[],
  opts: { readonly env?: Record<string, string> } = {}
): Promise<void> {
  requireMoon();
  await exec("moon", [...args], { cwd: MOONBIT_DIR, env: opts.env });
}

/**
 * Package directories of finos/morphir-elm, relative to moonbit/. The workspace also holds the pinned
 * finos/morphir-moonbit modules, so moon commands get these paths to act on this module only.
 */
export function modulePackages(): string[] {
  const packages: string[] = [];
  for (const file of new Glob("**/moon.pkg").scanSync({ cwd: MOONBIT_DIR, dot: true })) {
    if (/^(\.deps|\.mooncakes|_build|target|node_modules)\//.test(file) || file.includes("/node_modules/")) {
      continue;
    }
    packages.push(file === "moon.pkg" ? "." : file.slice(0, -"/moon.pkg".length));
  }
  return packages.sort();
}
