import extensionMetadata from "./extension.json";
import { capabilityClaims } from "./identity";

// Pure rules for releasing the Morphir Elm MEP extension. The release task and workflow do the
// building and publishing; everything a release must agree on is decided here and tested.

export interface ExtensionMetadata {
  readonly extensionId: string;
  readonly shortId: string;
  readonly name: string;
  readonly version: string;
  readonly mepVersions: readonly string[];
  readonly irVersions: readonly string[];
  readonly languages: readonly {
    readonly id: string;
    readonly fileExtensions: readonly string[];
  }[];
  /** Whether the extension answers morphir.workspace.discover for its languages. */
  readonly workspaceDiscovery: boolean;
}

export interface ReleaseTarget {
  /** Rust-style target triple, the same spelling the morphir CLI release assets use. */
  readonly platform: string;
  readonly bunTarget: string;
  readonly executable: string;
  readonly archive: "tgz" | "zip";
}

export interface ReleaseArtifact {
  readonly platform: string;
  readonly artifact: string;
  readonly sha256: string;
}

const unix = "morphir-elm-extension";
const windows = "morphir-elm-extension.exe";

export const RELEASE_TARGETS: readonly ReleaseTarget[] = Object.freeze([
  {
    platform: "x86_64-unknown-linux-gnu",
    bunTarget: "bun-linux-x64",
    executable: unix,
    archive: "tgz",
  },
  {
    platform: "aarch64-unknown-linux-gnu",
    bunTarget: "bun-linux-arm64",
    executable: unix,
    archive: "tgz",
  },
  {
    platform: "x86_64-apple-darwin",
    bunTarget: "bun-darwin-x64",
    executable: unix,
    archive: "tgz",
  },
  {
    platform: "aarch64-apple-darwin",
    bunTarget: "bun-darwin-arm64",
    executable: unix,
    archive: "tgz",
  },
  {
    platform: "x86_64-pc-windows-msvc",
    bunTarget: "bun-windows-x64",
    executable: windows,
    archive: "zip",
  },
  {
    platform: "aarch64-pc-windows-msvc",
    bunTarget: "bun-windows-arm64",
    executable: windows,
    archive: "zip",
  },
] as const);

const SEMVER = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?`;

/** The version a tag releases. The tag must name this extension and the version it reports. */
export function parseReleaseTag(
  tag: string,
  metadata: ExtensionMetadata
): string {
  const match = new RegExp(`^extension/${metadata.shortId}/v(${SEMVER})$`).exec(
    tag
  );
  if (match === null) {
    throw new Error(
      `'${tag}' is not a release tag; expected extension/${metadata.shortId}/v<version>`
    );
  }
  const version = match[1];
  if (version !== metadata.version) {
    throw new Error(
      `tag version ${version} does not match extension.json version ${metadata.version}`
    );
  }
  return version;
}

export function assetName(version: string, target: ReleaseTarget): string {
  return `morphir-elm-extension-${version}-${target.platform}.${target.archive}`;
}

/** One line in the format `sha256sum --check` reads. */
export function checksumLine(sha256: string, asset: string): string {
  return `${sha256}  ${asset}\n`;
}

export function releaseDescriptor(
  metadata: ExtensionMetadata,
  gitCommit: string,
  artifacts: readonly ReleaseArtifact[]
) {
  if (!/^[0-9a-f]{40}$/.test(gitCommit)) {
    throw new Error(`'${gitCommit}' is not a full git commit`);
  }
  if (artifacts.length === 0) {
    throw new Error("a release has no artifacts");
  }
  for (const artifact of artifacts) {
    if (!/^[0-9a-f]{64}$/.test(artifact.sha256)) {
      throw new Error(`${artifact.artifact} has an invalid sha256`);
    }
  }
  return {
    schemaVersion: 1,
    shortId: metadata.shortId,
    extensionId: metadata.extensionId,
    name: metadata.name,
    version: metadata.version,
    runtime: "process",
    mepVersions: [...metadata.mepVersions],
    irVersions: [...metadata.irVersions],
    languages: metadata.languages.map((language) => ({
      id: language.id,
      fileExtensions: [...language.fileExtensions],
    })),
    // Written only when true, like the morphir release bundle descriptor it mirrors.
    ...(metadata.workspaceDiscovery ? { workspaceDiscovery: true } : {}),
    gitCommit,
    artifacts: [...artifacts].sort((left, right) =>
      left.platform.localeCompare(right.platform)
    ),
  };
}

export interface ProcessBundleArtifact {
  readonly platform: string;
  readonly filename: string;
  readonly sha256: string;
}

/** A versioned raw executable, not an archive. */
export function executableName(version: string, target: ReleaseTarget): string {
  const suffix = target.executable.endsWith(".exe") ? ".exe" : "";
  return `morphir-elm-extension-${version}-${target.platform}${suffix}`;
}

/** Version-2 bundle shape consumed by morphir extension repository publish. */
export function processBundleDescriptor(
  artifacts: readonly ProcessBundleArtifact[]
) {
  if (artifacts.length === 0) {
    throw new Error("a process bundle has no artifacts");
  }
  const platforms = new Set<string>();
  for (const artifact of artifacts) {
    if (!/^[0-9a-f]{64}$/.test(artifact.sha256)) {
      throw new Error(`${artifact.filename} has an invalid sha256`);
    }
    if (platforms.has(artifact.platform)) {
      throw new Error(`${artifact.platform} appears more than once`);
    }
    platforms.add(artifact.platform);
  }
  const claims = capabilityClaims();
  return {
    schemaVersion: "2.0.0-draft.2",
    extensionId: claims.extension.id,
    shortId: extensionMetadata.shortId,
    version: claims.extension.version,
    platformDifferences: "none",
    artifacts: [...artifacts]
      .sort((left, right) => left.platform.localeCompare(right.platform))
      .map((artifact) => ({
        platform: artifact.platform,
        runtime: "process",
        filename: artifact.filename,
        sha256: artifact.sha256,
        claims: capabilityClaims(),
      })),
  };
}
