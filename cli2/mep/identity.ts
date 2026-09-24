import extensionMetadata from "./extension.json";
import { WORKSPACE_DISCOVERY_PROTOCOL } from "./workspace";

// The extension is released on its own tag, extension/elm/v<version>, so its identity comes from
// extension.json and not from the morphir-elm package version.
export const MEP_VERSION = extensionMetadata.mepVersions[0];

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

/** The same claim set is returned by describe and copied into every bundle artifact. */
export function capabilityClaims() {
  return {
    claimsVersion: "0.1.0-draft.2" as const,
    protocolVersions: [MEP_VERSION],
    extension: extensionInfo,
    capabilities,
  };
}
