#!/usr/bin/env bun
//MISE description="Verify Node.js version is pinned consistently across mise.toml, .nvmrc, package.json engines, and CI workflows"

import { readFile, log, ROOT_DIR, join } from "../_lib.ts";

log("test:check-node-version", "Checking Node.js version consistency...");

// nvm uses LTS codename aliases in .nvmrc. Keep this table updated when a new
// LTS lands; otherwise the check will throw with "Unknown .nvmrc alias".
const NVM_LTS_ALIASES: Record<string, string> = {
  "lts/hydrogen": "18",
  "lts/iron": "20",
  "lts/jod": "22",
  "lts/krypton": "24",
};

type Pin = { source: string; major: string; raw: string };
const pins: Pin[] = [];

// --- mise.toml (source of truth) ----------------------------------------------
const miseToml = await readFile(join(ROOT_DIR, "mise.toml"), "utf-8");
const miseNodeMatch = miseToml.match(/^\s*node\s*=\s*"(\d+)/m);
if (!miseNodeMatch) {
  throw new Error("Could not find node version pin in mise.toml [tools] block");
}
const expectedMajor = miseNodeMatch[1];
pins.push({ source: "mise.toml", major: expectedMajor, raw: miseNodeMatch[0].trim() });

// --- .nvmrc -------------------------------------------------------------------
const nvmrc = (await readFile(join(ROOT_DIR, ".nvmrc"), "utf-8")).trim();
let nvmrcMajor: string;
if (nvmrc.startsWith("lts/")) {
  const resolved = NVM_LTS_ALIASES[nvmrc];
  if (!resolved) {
    throw new Error(
      `Unknown .nvmrc alias "${nvmrc}". Add it to NVM_LTS_ALIASES in ${import.meta.file}.`,
    );
  }
  nvmrcMajor = resolved;
} else {
  const m = nvmrc.match(/^(\d+)/);
  if (!m) {
    throw new Error(`Could not parse .nvmrc value: "${nvmrc}"`);
  }
  nvmrcMajor = m[1];
}
pins.push({ source: ".nvmrc", major: nvmrcMajor, raw: nvmrc });

// --- package.json engines.node -----------------------------------------------
const pkg = JSON.parse(await readFile(join(ROOT_DIR, "package.json"), "utf-8"));
const enginesNode: string | undefined = pkg.engines?.node;
if (enginesNode === undefined) {
  pins.push({ source: "package.json engines.node", major: "<missing>", raw: "(unset)" });
} else if (enginesNode === "*") {
  pins.push({ source: "package.json engines.node", major: "*", raw: "*" });
} else {
  const m = enginesNode.match(/(\d+)/);
  pins.push({
    source: "package.json engines.node",
    major: m ? m[1] : "<unparsable>",
    raw: enginesNode,
  });
}

// --- .github/workflows/*.yml --------------------------------------------------
const workflowsDir = join(ROOT_DIR, ".github/workflows");
const glob = new Bun.Glob("*.yml");
const nodeVersionRegex = /node-version:\s*\[?\s*'?"?(\d+)/g;

for await (const filename of glob.scan({ cwd: workflowsDir })) {
  const fullPath = join(workflowsDir, filename);
  const contents = await readFile(fullPath, "utf-8");
  const lines = contents.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    nodeVersionRegex.lastIndex = 0;
    const m = nodeVersionRegex.exec(line);
    if (m) {
      pins.push({
        source: `.github/workflows/${filename}:${i + 1}`,
        major: m[1],
        raw: line.trim(),
      });
    }
  }
}

// --- comparison ---------------------------------------------------------------
const mismatches = pins.filter((p) => p.major !== expectedMajor);
if (mismatches.length > 0) {
  const summary = pins
    .map((p) => `  ${p.source} → ${p.major} (${p.raw})`)
    .join("\n");
  throw new Error(
    `Node version mismatch (mise.toml pins ${expectedMajor}):\n${summary}`,
  );
}

log(
  "test:check-node-version",
  `Node.js ${expectedMajor} is consistent across ${pins.length} pin sites`,
);
