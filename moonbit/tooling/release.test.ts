import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compareVersions, describeClaims, githubGlobMatches, parseReleaseTag, releaseDescriptor } from "./release";

describe("compareVersions", () => {
  test.each([
    ["0.5.0-preview.1", "0.4.1", 1],
    ["0.4.1", "0.4.1", 0],
    ["0.4.1-rc.1", "0.4.1", -1],
    ["1.0.0-alpha", "1.0.0-alpha.1", -1],
    ["1.0.0-alpha.1", "1.0.0-alpha.beta", -1],
    ["1.0.0-beta.2", "1.0.0-beta.11", -1],
    ["1.0.0-rc.1", "1.0.0", -1],
    ["0.10.0", "0.9.9", 1],
    ["1.0.0+build.1", "1.0.0", 0],
  ])("%s compared with %s is %d", (a, b, expected) => {
    expect(Math.sign(compareVersions(a, b))).toBe(expected);
  });

  test("refuses a version that is not SemVer", () => {
    expect(() => compareVersions("1.0", "1.0.0")).toThrow(/SemVer/);
    expect(() => compareVersions("01.0.0", "1.0.0")).toThrow(/SemVer/);
  });
});

describe("parseReleaseTag", () => {
  test("returns the version that the tag and moon.mod agree on", () => {
    expect(parseReleaseTag("extension/elm/v0.5.0-preview.1", "0.5.0-preview.1")).toBe("0.5.0-preview.1");
  });

  test.each([
    ["extension/elm/v0.6.0", "0.5.0", /0\.6\.0 does not match moonbit\/moon\.mod 0\.5\.0/],
    ["elm/v0.5.0", "0.5.0", /expected extension\/elm\/v<version>/],
    ["extension/elm-classic/v0.5.0", "0.5.0", /expected extension\/elm\/v<version>/],
    ["extension/elm/0.5.0", "0.5.0", /expected extension\/elm\/v<version>/],
    ["extension/elm/v0.4.1", "0.4.1", /must be greater than 0\.4\.1/],
    ["extension/elm/v0.4.1-rc.1", "0.4.1-rc.1", /must be greater than 0\.4\.1/],
  ])("refuses %s when moon.mod says %s", (tag, version, message) => {
    expect(() => parseReleaseTag(tag, version)).toThrow(message);
  });
});

const sha256 = "a".repeat(64);
const commit = "b".repeat(40);
const claims = { claimsVersion: "0.1.0-draft.2", extension: { id: "morphir-elm", version: "0.5.0" } };

describe("releaseDescriptor", () => {
  test("describes one wasm artifact without a platform", () => {
    expect(
      releaseDescriptor({ version: "0.5.0", gitCommit: commit, filename: "morphir-elm-0.5.0.wasm", sha256, claims })
    ).toEqual({
      schemaVersion: "2.0.0-draft.2",
      extensionId: "morphir-elm",
      shortId: "elm",
      version: "0.5.0",
      gitCommit: commit,
      platformDifferences: "none",
      artifacts: [
        {
          runtime: "wasm",
          abi: "morphir-bytes-v1",
          filename: "morphir-elm-0.5.0.wasm",
          sha256,
          claims,
          claimCheck: "checked",
        },
      ],
    });
  });

  test("refuses claims of another extension or version", () => {
    const input = { version: "0.5.0", gitCommit: commit, filename: "x.wasm", sha256 };
    expect(() => releaseDescriptor({ ...input, claims: { extension: { id: "x", version: "0.5.0" } } })).toThrow(
      /claims name x 0\.5\.0/
    );
    expect(() =>
      releaseDescriptor({ ...input, claims: { extension: { id: "morphir-elm", version: "0.4.0" } } })
    ).toThrow(/claims name morphir-elm 0\.4\.0/);
  });

  test("refuses a short commit or digest", () => {
    const input = { version: "0.5.0", filename: "x.wasm", claims };
    expect(() => releaseDescriptor({ ...input, gitCommit: "abc", sha256 })).toThrow(/commit/);
    expect(() => releaseDescriptor({ ...input, gitCommit: commit, sha256: "abc" })).toThrow(/sha256/);
  });
});

describe("describeClaims", () => {
  test("returns the result of describe", () => {
    const answer = { claimsVersion: "0.1.0-draft.2" };
    const guest = () => ({
      handle: () => -1,
    });
    expect(() => describeClaims(guest)).toThrow(/describe/);
    expect(
      describeClaims((imports) => ({
        handle: () => {
          const text = JSON.stringify({ jsonrpc: "2.0", id: 1, result: answer });
          for (const byte of new TextEncoder().encode(text)) imports.morphir_bytes_v1.output_byte(byte);
          return new TextEncoder().encode(text).length;
        },
      }))
    ).toEqual(answer);
  });
});

describe("the release workflows' tag filters", () => {
  const workflows = join(import.meta.dir, "..", "..", ".github", "workflows");
  const filter = (file: string) => {
    const match = /tags:\s*\n\s*-\s*"([^"]+)"/.exec(readFileSync(join(workflows, file), "utf8"));
    if (match === null) throw new Error(`${file} has no tag filter`);
    return match[1];
  };
  const elm = filter("elm-extension-release.yml");
  const classic = filter("elm-classic-extension-release.yml");

  test("each workflow starts on its own tags", () => {
    expect(githubGlobMatches(elm, "extension/elm/v0.5.0-preview.1")).toBe(true);
    expect(githubGlobMatches(classic, "extension/elm-classic/v0.5.0")).toBe(true);
  });

  test("neither workflow starts on the other's tags", () => {
    expect(githubGlobMatches(elm, "extension/elm-classic/v0.5.0")).toBe(false);
    expect(githubGlobMatches(classic, "extension/elm/v0.5.0-preview.1")).toBe(false);
  });
});
