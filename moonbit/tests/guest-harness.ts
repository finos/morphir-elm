// Drives the packaged Elm extension module through MEP sessions, as the MoonBit CLI's worker host does.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { BytesSession, wasmGuest } from "../tooling/bytes-host";

export const MOONBIT = join(import.meta.dir, "..");
export const PROJECTS = join(MOONBIT, "conformance", "projects");
const DIGEST = "0".repeat(64);
const LIMITS = { maxEncodedBytes: 2796204, maxDecodedBytes: 2097152, maxDepth: 128, maxNodes: 100000 };
const tuple = (operation: string) => ({
  operation,
  profile: "morphir-ir",
  codec: "morphir-json",
  envelopeVersion: "0.1.0-draft.1",
  irVersion: "4.0.0",
});
export const COMPILE = tuple("morphir.frontend.compileModel");
export const GENERATE = tuple("morphir.backend.generateModel");

export type Guest = (imports: Parameters<ReturnType<typeof wasmGuest>>[0]) => ReturnType<ReturnType<typeof wasmGuest>>;

export function rpc(session: BytesSession, id: number, method: string, params: unknown): any {
  const reply = session.call(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
  if (reply.kind !== "response") throw new Error(`${method}: expected a response, got ${reply.kind}`);
  return JSON.parse(reply.text);
}

/** A session initialized for one operation, as the worker host opens it. */
export function openSession(guest: Guest, operation: typeof COMPILE): BytesSession {
  const session = new BytesSession(guest);
  const init = rpc(session, 1, "morphir.initialize", {
    protocolVersions: ["0.2.0-draft.1"],
    host: { name: "elm-extension-tests", version: "0" },
    modelTransport: { tuples: [operation], limits: LIMITS, guarantees: [] },
  });
  if (init.error) throw new Error(JSON.stringify(init.error));
  session.call(JSON.stringify({ jsonrpc: "2.0", method: "morphir.initialized" }));
  return session;
}

export function closeSession(session: BytesSession): void {
  rpc(session, 3, "morphir.shutdown", {});
  session.call(JSON.stringify({ jsonrpc: "2.0", method: "morphir.exit" }));
}

export interface Project {
  readonly name: string;
  readonly packageName: string;
  readonly exposed: readonly string[];
  readonly documents: readonly { uri: string; text: string }[];
}

export function readProject(name: string): Project {
  const dir = join(PROJECTS, name);
  const config = JSON.parse(readFileSync(join(dir, "morphir.json"), "utf8"));
  const root = join(dir, config.sourceDirectory ?? "src");
  const documents: { uri: string; text: string }[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d).sort()) {
      const p = join(d, entry);
      if (statSync(p).isDirectory()) walk(p);
      else if (entry.endsWith(".elm")) documents.push({ uri: relative(root, p), text: readFileSync(p, "utf8") });
    }
  };
  walk(root);
  return { name, packageName: config.name, exposed: config.exposedModules, documents };
}

export function compile(guest: Guest, project: Project): any {
  const session = openSession(guest, COMPILE);
  const reply = rpc(session, 2, "morphir.frontend.compileModel", {
    languageId: "elm",
    sources: { documents: project.documents.map((d) => ({ ...d, languageId: "elm", version: 0 })) },
    package: { name: project.packageName, exposedModules: project.exposed },
    options: { irVersion: "4.0.0" },
    contextDigest: DIGEST,
    output: COMPILE,
  });
  closeSession(session);
  return reply;
}

export function generate(guest: Guest, model: unknown, options?: unknown): any {
  const session = openSession(guest, GENERATE);
  const reply = rpc(session, 2, "morphir.backend.generateModel", {
    model,
    input: GENERATE,
    target: "elm",
    contextDigest: DIGEST,
    ...(options === undefined ? {} : { options }),
  });
  closeSession(session);
  return reply;
}
