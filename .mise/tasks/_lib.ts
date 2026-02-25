/**
 * Shared utilities for mise build tasks
 * This file is imported by tasks, not executed directly
 */

import { $ } from "bun";
import { join } from "path";
import { mkdir, rm, readFile, writeFile, copyFile } from "fs/promises";
import { existsSync } from "fs";

// Re-export common utilities
export { $, join, mkdir, rm, readFile, writeFile, copyFile, existsSync };

// Project root directory (where mise.toml lives)
export const ROOT_DIR = join(import.meta.dir, "../..");

// Common paths
export const PATHS = {
  cli: join(ROOT_DIR, "packages/cli"),
  cli2: join(ROOT_DIR, "packages/cli2"),
  dist: join(ROOT_DIR, "dist"),
  src: join(ROOT_DIR, "src"),
  morphirTs: join(ROOT_DIR, "packages/morphir-ts"),
  testsIntegration: join(ROOT_DIR, "tests-integration"),
  redistributable: join(ROOT_DIR, "redistributable"),
  nodeBin: join(ROOT_DIR, "node_modules/.bin"),
} as const;

// Environment
export const ENV = {
  morphirJvmVersion: process.env.MORPHIR_JVM_VERSION || "0.18.2",
};

/**
 * Execute a command with inherited stdio
 */
export async function exec(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: Record<string, string> } = {}
): Promise<void> {
  const proc = Bun.spawn([cmd, ...args], {
    cwd: opts.cwd || ROOT_DIR,
    env: { ...process.env, ...opts.env },
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

  // Use elm from node_modules/.bin (installed by elm-tooling)
  const elmPath = join(PATHS.nodeBin, "elm");
  await exec(elmPath, args, { cwd: opts.cwd || ROOT_DIR });
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
    ? join(ROOT_DIR, "packages/cli2/lib/morphir.js")
    : join(ROOT_DIR, "packages/cli/morphir-elm.js");

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
  const cliPath = join(ROOT_DIR, "packages/cli/morphir-elm.js");
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
  const cliPath = join(ROOT_DIR, "packages/cli2/lib/morphir-json-schema-gen.js");
  const args = [cliPath, "json-schema-gen", "-i", inputPath, "-o", outputDir, "-t", target];

  console.log(`Running: node ${args.slice(1).join(" ")}`);
  await exec("node", args);
}

/**
 * Run morphir dockerize command
 */
export async function morphirDockerize(projectDir: string): Promise<void> {
  const cliPath = join(ROOT_DIR, "packages/cli2/lib/morphir-dockerize.js");
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
    const fullPath = pattern.startsWith("/") ? pattern : join(ROOT_DIR, pattern);
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
    const relativePath = file.replace(cwd, "").replace(/^\//, "");
    const destPath = join(destDir, relativePath);
    await mkdir(join(destPath, ".."), { recursive: true });
    await copyFile(file, destPath);
  }
}

/**
 * Concatenate multiple files into one
 */
export async function concat(files: string[], outputPath: string): Promise<void> {
  const contents: string[] = [];

  for (const file of files) {
    const fullPath = file.startsWith("/") ? file : join(ROOT_DIR, file);
    const content = await readFile(fullPath, "utf-8");
    contents.push(content);
  }

  await mkdir(join(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, contents.join("\n"));
  console.log(`Concatenated ${files.length} files into ${outputPath}`);
}

/**
 * Log a task step with consistent formatting
 */
export function log(taskName: string, message: string): void {
  console.log(`[${taskName}] ${message}`);
}
