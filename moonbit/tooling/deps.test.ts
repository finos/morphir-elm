import { describe, expect, test } from "bun:test";
import committed from "../deps.toml";
import { parsePin, planDepsFetch, type Pin } from "./deps";

const good: Pin = {
  repository: "https://github.com/finos/morphir-moonbit.git",
  commit: "a".repeat(40),
  paths: ["pkgs/morphir-ir", "pkgs/morphir-typing"],
};

describe("parsePin", () => {
  test("accepts the committed pin", () => {
    const pin = parsePin(committed["morphir-moonbit"]);
    expect(pin.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(pin.paths).toContain("pkgs/morphir-ir");
  });

  test("refuses a short commit", () => {
    expect(() => parsePin({ ...good, commit: "abc123" })).toThrow(/commit/);
  });

  test("refuses a commit that is not lowercase hexadecimal", () => {
    expect(() => parsePin({ ...good, commit: "G".repeat(40) })).toThrow(/commit/);
  });

  test("refuses no paths", () => {
    expect(() => parsePin({ ...good, paths: [] })).toThrow(/paths/);
  });

  test("refuses a path outside pkgs/", () => {
    expect(() => parsePin({ ...good, paths: ["../x"] })).toThrow(/paths/);
    expect(() => parsePin({ ...good, paths: ["pkgs/../../x"] })).toThrow(/paths/);
    expect(() => parsePin({ ...good, paths: ["apps/morphir"] })).toThrow(/paths/);
  });

  test("refuses a missing repository", () => {
    expect(() => parsePin({ ...good, repository: "" })).toThrow(/repository/);
  });

  test("refuses a value that is not a table", () => {
    expect(() => parsePin(undefined)).toThrow(/morphir-moonbit/);
  });
});

describe("planDepsFetch", () => {
  test("fetches when nothing is checked out", () => {
    expect(planDepsFetch(null, good)).toBe("fetch");
  });

  test("skips when the commit and paths match", () => {
    expect(planDepsFetch({ commit: good.commit, paths: [...good.paths].reverse() }, good)).toBe("skip");
  });

  test("fetches when the commit differs", () => {
    expect(planDepsFetch({ commit: "0".repeat(40), paths: good.paths }, good)).toBe("fetch");
  });

  test("fetches when the copy has fewer paths than the pin", () => {
    expect(planDepsFetch({ commit: good.commit, paths: ["pkgs/morphir-ir"] }, good)).toBe("fetch");
  });

  test("fetches when the copy has other paths", () => {
    expect(
      planDepsFetch({ commit: good.commit, paths: [...good.paths, "pkgs/morphir-sdk"] }, good)
    ).toBe("fetch");
  });
});
