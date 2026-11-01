import extensionMetadata from "./extension.json";
import { supportedTransport } from "./model";
import { WORKSPACE_DISCOVERY_PROTOCOL } from "./workspace";

// The extension is released on its own tag, extension/elm-classic/v<version>, so its identity comes from
// extension.json and not from the morphir-elm package version.

/** MEP 0.2.0-draft.1: the model operation morphir.frontend.compileModel, with IR 4.0.0. */
export const MEP_0_2 = "0.2.0-draft.1";
/** MEP 0.1: the legacy morphir.frontend.compile, with classic IR. The finos/morphir Rust host and older hosts use it. */
export const MEP_0_1 = "0.1";
export type MepVersion = typeof MEP_0_2 | typeof MEP_0_1;

/** The versions the extension speaks, the preferred one first. */
export const MEP_VERSIONS: readonly MepVersion[] = Object.freeze(
  extensionMetadata.mepVersions.map((version) => {
    if (version !== MEP_0_2 && version !== MEP_0_1) {
      throw new Error(`extension.json names MEP ${version}, which the extension does not speak`);
    }
    return version;
  })
);

export const extensionInfo = Object.freeze({
  id: extensionMetadata.extensionId,
  name: extensionMetadata.name,
  version: extensionMetadata.version,
  types: ["frontend", "workspace"] as const,
});

export const capabilities = Object.freeze({
  frontend: Object.freeze({
    languages: Object.freeze(
      extensionMetadata.languages.map((language) =>
        Object.freeze({
          id: language.id,
          fileExtensions: Object.freeze([...language.fileExtensions]),
        })
      )
    ),
    irVersions: Object.freeze([...extensionMetadata.irVersions]),
    compile: true,
    incremental: false,
    fragments: false,
    multiDocument: false,
  }),
  workspace: Object.freeze({
    protocolVersions: [WORKSPACE_DISCOVERY_PROTOCOL] as const,
    discover: true,
  }),
  streaming: false,
  incremental: false,
  cancellation: false,
  progress: false,
});

/** The same claim set is returned by describe and copied into every bundle artifact. The model transport is the
 * one the extension supports; a MEP 0.2 session agrees a part of it with the host. */
export function capabilityClaims() {
  return {
    claimsVersion: "0.1.0-draft.2" as const,
    protocolVersions: Array.from<string>(MEP_VERSIONS),
    extension: extensionInfo,
    capabilities: { ...capabilities, modelTransport: supportedTransport },
  };
}
