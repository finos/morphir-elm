// Pure rules for releasing the Elm extension. The release task and workflow do the building and publishing;
// what a release must agree on is decided here and tested.
import { greaterThan, parse, tryParse } from "@std/semver";
import { BytesSession, type BytesExports, type BytesImports } from "./bytes-host";

export const EXTENSION_ID = "morphir-elm";
export const SHORT_ID = "elm";

/** The JavaScript extension released 0.1.0 to 0.4.1 on these tags, before it became the Elm classic extension. */
export const LAST_CLASSIC_VERSION = "0.4.1";

/** The version a tag releases: the tag must be extension/elm/v<version>, equal to moon.mod, above 0.4.1. */
export function parseReleaseTag(tag: string, moduleVersion: string): string {
  const match = /^extension\/elm\/v(.+)$/.exec(tag);
  const version = match === null ? undefined : tryParse(match[1]);
  if (match === null || version === undefined) {
    throw new Error(`'${tag}' is not a release tag; expected extension/elm/v<version>`);
  }
  if (match[1] !== moduleVersion) {
    throw new Error(`tag version ${match[1]} does not match moonbit/moon.mod ${moduleVersion}`);
  }
  if (!greaterThan(version, parse(LAST_CLASSIC_VERSION))) {
    throw new Error(
      `version ${match[1]} must be greater than ${LAST_CLASSIC_VERSION}, the last JavaScript release on these tags`
    );
  }
  return match[1];
}

export interface DescriptorInput {
  readonly version: string;
  readonly gitCommit: string;
  readonly filename: string;
  readonly sha256: string;
  readonly claims: { readonly extension?: { readonly id?: unknown; readonly version?: unknown } } & Record<
    string,
    unknown
  >;
}

/** The version-2 bundle descriptor (release.json) for the single Wasm artifact. */
export function releaseDescriptor(input: DescriptorInput) {
  if (!/^[0-9a-f]{40}$/.test(input.gitCommit)) {
    throw new Error(`'${input.gitCommit}' is not a full git commit`);
  }
  if (!/^[0-9a-f]{64}$/.test(input.sha256)) {
    throw new Error(`'${input.sha256}' is not a lowercase sha256`);
  }
  const id = input.claims.extension?.id;
  const version = input.claims.extension?.version;
  if (id !== EXTENSION_ID || version !== input.version) {
    throw new Error(
      `the claims name ${String(id)} ${String(version)}, but the release is ${EXTENSION_ID} ${input.version}`
    );
  }
  return {
    schemaVersion: "2.0.0-draft.2",
    extensionId: EXTENSION_ID,
    shortId: SHORT_ID,
    version: input.version,
    gitCommit: input.gitCommit,
    platformDifferences: "none",
    artifacts: [
      {
        runtime: "wasm",
        filename: input.filename,
        sha256: input.sha256,
        claims: input.claims,
        // The release workflow runs the module before it publishes it.
        claimCheck: "checked",
      },
    ],
  };
}

/** The claim set that the module answers to describe, read through the morphir-bytes-v1 ABI. */
export function describeClaims(instantiate: (imports: BytesImports) => BytesExports): DescriptorInput["claims"] {
  const reply = new BytesSession(instantiate).call(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "morphir.extension.describe",
      params: { protocolVersions: ["0.2.0-draft.1"] },
    })
  );
  if (reply.kind !== "response") {
    throw new Error(`the module did not answer describe (${reply.kind})`);
  }
  const message = JSON.parse(reply.text);
  if (message.result === undefined) {
    throw new Error(`the module refused describe: ${reply.text}`);
  }
  return message.result;
}

/** Whether a GitHub Actions branch or tag filter matches a ref name. `*` does not match `/`; `**` does. */
export function githubGlobMatches(pattern: string, ref: string): boolean {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*" && pattern[i + 1] === "*") {
      source += ".*";
      i++;
    } else if (c === "*") {
      source += "[^/]*";
    } else if (c === "?") {
      source += "[^/]";
    } else {
      source += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`).test(ref);
}
