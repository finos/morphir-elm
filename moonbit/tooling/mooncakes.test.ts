import { describe, expect, test } from "bun:test";
import {
  archiveName,
  checkArchiveEntries,
  consumerFiles,
  credentialsJson,
  indexHasVersion,
  isFinosAccount,
  redact,
  registryState,
} from "./mooncakes";

describe("archiveName", () => {
  test("is the name that moon package writes", () => {
    expect(archiveName("0.5.0-preview.3")).toBe("finos-morphir-elm-0.5.0-preview.3.zip");
  });
});

describe("checkArchiveEntries", () => {
  const good = ["moon.mod", "README.md", "LICENSE", "mep/moon.pkg", "mep/session.mbt", "conformance/projects/a/elm.json"];

  test("accepts the module files", () => {
    expect(() => checkArchiveEntries(good)).not.toThrow();
  });

  test.each(["moon.mod", "README.md", "LICENSE"])("requires %s", (file) => {
    expect(() => checkArchiveEntries(good.filter((entry) => entry !== file))).toThrow(file);
  });

  test.each([
    "tooling/release.ts",
    "tests/guest.test.ts",
    "scripts/package.json",
    "deps.toml",
    "moon.work",
    "_build/publish/x.zip",
    ".mooncakes/finos/morphir-ir/moon.mod",
    ".deps/morphir-moonbit/moon.mod",
    "scripts/node_modules/elm/package.json",
    "mep/node_modules/x.js",
    "/etc/passwd",
    "mep/../../x",
  ])("refuses %s", (entry) => {
    expect(() => checkArchiveEntries([...good, entry])).toThrow(entry);
  });

  test("names every refused entry", () => {
    expect(() => checkArchiveEntries([...good, "deps.toml", "moon.work"])).toThrow(/deps\.toml.*moon\.work/s);
  });
});

describe("registryState", () => {
  test.each([
    [404, "absent"],
    [200, "present"],
    [500, "unknown"],
    [403, "unknown"],
    [301, "unknown"],
  ] as const)("status %d is %s", (status, state) => {
    expect(registryState(status)).toBe(state);
  });
});

describe("isFinosAccount", () => {
  test("accepts the finos account", () => {
    expect(isFinosAccount(200, { ok: true, username: "finos" })).toBe(true);
  });

  test.each([
    [200, { ok: true, username: "someone" }],
    [200, { ok: false, username: "finos" }],
    [401, { ok: true, username: "finos" }],
    [200, null],
    [200, "finos"],
  ])("refuses status %d with %p", (status, body) => {
    expect(isFinosAccount(status, body)).toBe(false);
  });
});

describe("credentialsJson", () => {
  test("is the file that moon login writes for the finos account", () => {
    expect(JSON.parse(credentialsJson("secret-value"))).toEqual({
      token: "secret-value",
      username: "finos",
      registry_api: "https://mooncakes.io",
    });
  });

  test("refuses an empty token", () => {
    expect(() => credentialsJson("")).toThrow(/MOONCAKES_TOKEN/);
    expect(() => credentialsJson("  \n")).toThrow(/MOONCAKES_TOKEN/);
  });
});

describe("redact", () => {
  test("replaces every copy of the token", () => {
    expect(redact("a secret-value b secret-value", "secret-value")).toBe("a *** b ***");
  });

  test("leaves text without the token", () => {
    expect(redact("uploaded", "secret-value")).toBe("uploaded");
  });
});

describe("consumerFiles", () => {
  const files = consumerFiles("0.5.0-preview.3");

  test("imports the release version of finos/morphir-elm", () => {
    expect(files["moon.mod"]).toContain('"finos/morphir-elm@0.5.0-preview.3"');
    expect(files["moon.pkg"]).toContain('"finos/morphir-elm/mep"');
  });

  test("tests that the resolved module reports the release version", () => {
    expect(files["consumer_test.mbt"]).toContain('assert_eq(@mep.VERSION, "0.5.0-preview.3")');
  });

  test("refuses a version that is not SemVer", () => {
    expect(() => consumerFiles('0.5.0"\n')).toThrow(/SemVer/);
  });
});

describe("indexHasVersion", () => {
  const index = [
    JSON.stringify({ name: "finos/morphir-elm", version: "0.1.0" }),
    JSON.stringify({ name: "finos/morphir-elm", version: "0.5.0-preview.3" }),
    "",
  ].join("\n");

  test("finds a version that the index lists", () => {
    expect(indexHasVersion(index, "0.5.0-preview.3")).toBe(true);
  });

  test("does not find a version that the index does not list", () => {
    expect(indexHasVersion(index, "0.5.0-preview.4")).toBe(false);
  });

  test("ignores lines that are not JSON", () => {
    expect(indexHasVersion("not json\n", "0.1.0")).toBe(false);
  });
});
