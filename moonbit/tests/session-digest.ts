// Prints one SHA-256 over every response of a fixed set of sessions: describe, then compile and generate for each
// conformance project. The release workflow runs it on Linux, macOS and Windows and requires the same digest.
// Usage: bun moonbit/tests/session-digest.ts <module.wasm>
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { BytesSession, wasmGuest } from "../tooling/bytes-host";
import { compile, generate, PROJECTS, readProject, rpc } from "./guest-harness";

const [wasmPath] = process.argv.slice(2);
if (wasmPath === undefined) {
  console.error("usage: bun moonbit/tests/session-digest.ts <module.wasm>");
  process.exit(2);
}
const guest = wasmGuest(readFileSync(wasmPath));
const hash = createHash("sha256");
hash.update(JSON.stringify(rpc(new BytesSession(guest), 1, "morphir.extension.describe", { protocolVersions: ["0.2.0-draft.1"] })));
for (const name of readdirSync(PROJECTS).sort()) {
  const compiled = compile(guest, readProject(name));
  hash.update(JSON.stringify(compiled));
  if (compiled.result?.success) {
    hash.update(JSON.stringify(generate(guest, compiled.result.model)));
  }
}
console.log(hash.digest("hex"));
