/**
 * Shared utilities for mise build tasks
 * This file is imported by tasks, not executed directly
 */

import { $ } from "bun";
import { join, isAbsolute, relative, dirname } from "path";
import { mkdir, rm, readFile, writeFile, copyFile } from "fs/promises";
import { existsSync } from "fs";

// Re-export common utilities
export { $, join, isAbsolute, relative, dirname, mkdir, rm, readFile, writeFile, copyFile, existsSync };

// Project root directory (where mise.toml lives)
export const ROOT_DIR = join(import.meta.dir, "../..");

// Common paths
export const PATHS = {
  cli: join(ROOT_DIR, "cli"),
  cli2: join(ROOT_DIR, "cli2"),
  dist: join(ROOT_DIR, "dist"),
  src: join(ROOT_DIR, "src"),
  morphirTs: join(ROOT_DIR, "morphir-ts"),
  testsIntegration: join(ROOT_DIR, "tests-integration"),
  redistributable: join(ROOT_DIR, "redistributable"),
} as const;

// Environment
export const ENV = {
  morphirJvmVersion: process.env.MORPHIR_JVM_VERSION || "0.18.2",
};

/**
 * Execute a command with inherited stdio.
 *
 * On Windows, Bun.spawn does not auto-resolve `.cmd` / `.ps1` shims (e.g.
 * the `npx.cmd` or `elm.cmd` wrappers npm/elm-tooling install into
 * node_modules/.bin). Resolve via `Bun.which` first so spawned commands
 * find the right binary regardless of shim extension.
 */
export async function exec(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: Record<string, string> } = {}
): Promise<void> {
  const cwd = opts.cwd || ROOT_DIR;
  const env = { ...process.env, ...opts.env };
  const resolved = Bun.which(cmd, { PATH: env.PATH, cwd }) ?? cmd;
  const proc = Bun.spawn([resolved, ...args], {
    cwd,
    env,
    stdio: ["inherit", "inherit", "inherit"],
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")} (exit code ${exitCode})`);
  }
}

/**
 * Compile Elm source files
 */
export async function elmMake(
  sources: string[],
  opts: {
    cwd?: string;
    output?: string;
    optimize?: boolean;
    docs?: string;
  } = {}
): Promise<void> {
  const args = ["make", ...sources];

  if (opts.output) {
    args.push("--output", opts.output);
  }

  if (opts.optimize) {
    args.push("--optimize");
  }

  if (opts.docs) {
    args.push("--docs", opts.docs);
  }

  await exec("elm", args, { cwd: opts.cwd || ROOT_DIR });
}

/**
 * Run morphir-elm make command
 */
export async function morphirMake(
  projectDir: string,
  outputPath: string,
  opts: {
    typesOnly?: boolean;
    force?: boolean;
    useCli2?: boolean;
  } = {}
): Promise<void> {
  const cliPath = opts.useCli2
    ? join(ROOT_DIR, "cli2/lib/morphir.js")
    : join(ROOT_DIR, "cli/morphir-elm.js");

  const args = [cliPath, "make", "-p", projectDir, "-o", outputPath];

  if (opts.force) {
    args.splice(2, 0, "-f");
  }

  if (opts.typesOnly) {
    args.push("--types-only");
  }

  console.log(`Running: node ${args.slice(1).join(" ")}`);
  await exec("node", args);
}

/**
 * Run morphir-elm gen command
 */
export async function morphirGen(
  inputPath: string,
  outputDir: string,
  target: string
): Promise<void> {
  const cliPath = join(ROOT_DIR, "cli/morphir-elm.js");
  const args = [cliPath, "gen", "-i", inputPath, "-o", outputDir, "-t", target];

  console.log(`Running: node ${args.slice(1).join(" ")}`);
  await exec("node", args);
}

/**
 * Run morphir json-schema-gen command
 */
export async function morphirJsonSchemaGen(
  inputPath: string,
  outputDir: string,
  target: string
): Promise<void> {
  const cliPath = join(ROOT_DIR, "cli2/lib/morphir-json-schema-gen.js");
  const args = [cliPath, "json-schema-gen", "-i", inputPath, "-o", outputDir, "-t", target];

  console.log(`Running: node ${args.slice(1).join(" ")}`);
  await exec("node", args);
}

/**
 * Run morphir dockerize command
 */
export async function morphirDockerize(projectDir: string): Promise<void> {
  const cliPath = join(ROOT_DIR, "cli2/lib/morphir-dockerize.js");
  const args = [cliPath, "dockerize", "-p", projectDir, "-f"];

  console.log(`Running: node ${args.slice(1).join(" ")}`);
  await exec("node", args);
}

/**
 * Delete files/directories (like del/rimraf)
 */
export async function del(patterns: string | string[]): Promise<void> {
  const patternList = Array.isArray(patterns) ? patterns : [patterns];

  for (const pattern of patternList) {
    const fullPath = isAbsolute(pattern) ? pattern : join(ROOT_DIR, pattern);
    if (existsSync(fullPath)) {
      await rm(fullPath, { recursive: true, force: true });
      console.log(`Deleted: ${pattern}`);
    }
  }
}

/**
 * Copy files matching a glob pattern to a destination
 */
export async function copyGlob(
  srcPattern: string,
  destDir: string,
  opts: { cwd?: string } = {}
): Promise<void> {
  const cwd = opts.cwd || ROOT_DIR;
  const glob = new Bun.Glob(srcPattern);

  await mkdir(destDir, { recursive: true });

  for await (const file of glob.scan({ cwd, absolute: true })) {
    const relativePath = relative(cwd, file);
    const destPath = join(destDir, relativePath);
    await mkdir(dirname(destPath), { recursive: true });
    await copyFile(file, destPath);
  }
}

/**
 * Concatenate multiple files into one
 */
export async function concat(files: string[], outputPath: string): Promise<void> {
  const contents: string[] = [];

  for (const file of files) {
    const fullPath = isAbsolute(file) ? file : join(ROOT_DIR, file);
    const content = await readFile(fullPath, "utf-8");
    contents.push(content);
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents.join("\n"));
  console.log(`Concatenated ${files.length} files into ${outputPath}`);
}

/**
 * Log a task step with consistent formatting
 */
export function log(taskName: string, message: string): void {
  console.log(`[${taskName}] ${message}`);
}
