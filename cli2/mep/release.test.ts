import { describe, expect, test } from "bun:test";

import { capabilityClaims } from "./identity";
import extensionMetadata from "./extension.json";
import {
  RELEASE_TARGETS,
  assetName,
  checksumLine,
  executableName,
  processBundleDescriptor,
  parseReleaseTag,
  releaseDescriptor,
} from "./release";

describe("MEP extension release", () => {
  test("a release tag names the extension and the version in extension.json", () => {
    // Derived from the metadata rather than hard-coded, so this keeps asserting
    // what it is named for -- that a tag names the version in extension.json --
    // instead of failing on every version bump.
    expect(
      parseReleaseTag(
        `extension/elm/v${extensionMetadata.version}`,
        extensionMetadata
      )
    ).toBe(extensionMetadata.version);
    expect(
      parseReleaseTag("extension/elm/v1.2.3-rc.1", {
        ...extensionMetadata,
        version: "1.2.3-rc.1",
      })
    ).toBe("1.2.3-rc.1");
  });

  test.each([
    ["v0.1.0", /extension\/elm\/v<version>/],
    ["extension/elm-native/v0.1.0", /extension\/elm\/v<version>/],
    ["extension/elm/0.1.0", /extension\/elm\/v<version>/],
    ["extension/elm/v9.9.9", /does not match .*0\.1\.0/],
  ])("the tag %s is refused", (tag, message) => {
    expect(() =>
      parseReleaseTag(tag, { ...extensionMetadata, version: "0.1.0" })
    ).toThrow(message);
  });

  test("the targets are the six platforms the morphir CLI is released for", () => {
    expect(RELEASE_TARGETS.map((target) => target.platform).sort()).toEqual([
      "aarch64-apple-darwin",
      "aarch64-pc-windows-msvc",
      "aarch64-unknown-linux-gnu",
      "x86_64-apple-darwin",
      "x86_64-pc-windows-msvc",
      "x86_64-unknown-linux-gnu",
    ]);
    for (const target of RELEASE_TARGETS) {
      const windows = target.platform.includes("windows");
      expect(target.bunTarget).toMatch(
        /^bun-(linux|darwin|windows)-(x64|arm64)$/
      );
      expect(target.executable).toBe(
        windows ? "morphir-elm-extension.exe" : "morphir-elm-extension"
      );
      expect(target.archive).toBe(windows ? "zip" : "tgz");
    }
  });

  test("asset names carry the version and the platform, like the morphir CLI assets", () => {
    const linux = RELEASE_TARGETS.find(
      (target) => target.platform === "x86_64-unknown-linux-gnu"
    )!;
    const windows = RELEASE_TARGETS.find(
      (target) => target.platform === "aarch64-pc-windows-msvc"
    )!;
    expect(assetName("0.1.0", linux)).toBe(
      "morphir-elm-extension-0.1.0-x86_64-unknown-linux-gnu.tgz"
    );
    expect(assetName("0.1.0", windows)).toBe(
      "morphir-elm-extension-0.1.0-aarch64-pc-windows-msvc.zip"
    );
  });

  test("a checksum file is one sha256sum line", () => {
    expect(checksumLine("ab".repeat(32), "asset.tgz")).toBe(
      `${"ab".repeat(32)}  asset.tgz\n`
    );
  });

  test("the descriptor describes a process extension with one artifact per platform", () => {
    const descriptor = releaseDescriptor(extensionMetadata, "a".repeat(40), [
      {
        platform: "x86_64-unknown-linux-gnu",
        artifact: "one.tgz",
        sha256: "0".repeat(64),
      },
      {
        platform: "aarch64-apple-darwin",
        artifact: "two.tgz",
        sha256: "1".repeat(64),
      },
    ]);
    expect(descriptor).toEqual({
      schemaVersion: 1,
      shortId: "elm",
      extensionId: "morphir-elm",
      name: "Morphir Elm frontend",
      version: extensionMetadata.version,
      runtime: "process",
      mepVersions: ["0.1"],
      irVersions: ["3"],
      languages: [{ id: "elm", fileExtensions: [".elm"] }],
      // The host stops a session whose capability kinds differ from the published record.
      workspaceDiscovery: true,
      gitCommit: "a".repeat(40),
      // Sorted by platform, so the descriptor does not depend on build order.
      artifacts: [
        {
          platform: "aarch64-apple-darwin",
          artifact: "two.tgz",
          sha256: "1".repeat(64),
        },
        {
          platform: "x86_64-unknown-linux-gnu",
          artifact: "one.tgz",
          sha256: "0".repeat(64),
        },
      ],
    });
  });

  test("a descriptor leaves out workspace discovery the extension does not serve", () => {
    const descriptor = releaseDescriptor(
      { ...extensionMetadata, workspaceDiscovery: false },
      "a".repeat(40),
      [
        {
          platform: "x86_64-unknown-linux-gnu",
          artifact: "one.tgz",
          sha256: "0".repeat(64),
        },
      ]
    );
    expect(descriptor).not.toHaveProperty("workspaceDiscovery");
  });

  test("a descriptor with a bad commit or digest is refused", () => {
    const artifact = {
      platform: "x86_64-unknown-linux-gnu",
      artifact: "one.tgz",
      sha256: "0".repeat(64),
    };
    expect(() =>
      releaseDescriptor(extensionMetadata, "main", [artifact])
    ).toThrow(/git commit/);
    expect(() =>
      releaseDescriptor(extensionMetadata, "a".repeat(40), [
        { ...artifact, sha256: "nope" },
      ])
    ).toThrow(/sha256/);
    expect(() =>
      releaseDescriptor(extensionMetadata, "a".repeat(40), [])
    ).toThrow(/no artifacts/);
  });
});

describe("MEP version-2 process bundle", () => {
  test.each([...RELEASE_TARGETS])(
    "names the raw executable for $platform",
    (target) => {
      const suffix = target.platform.includes("windows") ? ".exe" : "";
      expect(executableName("1.2.3-rc.1", target)).toBe(
        `morphir-elm-extension-1.2.3-rc.1-${target.platform}${suffix}`
      );
    }
  );

  test("matches the CLI bundle shape with claims for every raw artifact", () => {
    const artifacts = RELEASE_TARGETS.map((target) => ({
      platform: target.platform,
      filename: executableName(extensionMetadata.version, target),
      sha256: "a".repeat(64),
    }));
    const descriptor = processBundleDescriptor(artifacts);
    expect(descriptor).toEqual({
      schemaVersion: "2.0.0-draft.2",
      extensionId: "morphir-elm",
      shortId: "elm",
      version: extensionMetadata.version,
      platformDifferences: "none",
      artifacts: [...artifacts]
        .sort((a, b) => a.platform.localeCompare(b.platform))
        .map((artifact) => ({
          ...artifact,
          runtime: "process",
          claims: capabilityClaims(),
        })),
    });
    // Same member order as the CLI's own process bundle.
    expect(Object.keys(descriptor.artifacts[0])).toEqual([
      "platform",
      "runtime",
      "filename",
      "sha256",
      "claims",
    ]);
  });

  test("refuses an empty, malformed or duplicated artifact list", () => {
    const artifact = {
      platform: "x86_64-unknown-linux-gnu",
      filename: "morphir-elm-extension-1.0.0-x86_64-unknown-linux-gnu",
      sha256: "a".repeat(64),
    };
    expect(() => processBundleDescriptor([])).toThrow("no artifacts");
    expect(() =>
      processBundleDescriptor([{ ...artifact, sha256: "not-hex" }])
    ).toThrow("invalid sha256");
    expect(() => processBundleDescriptor([artifact, artifact])).toThrow(
      "more than once"
    );
  });
});
