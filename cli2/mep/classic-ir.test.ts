import { describe, expect, test } from "bun:test";
import { classicToV4 } from "./classic-ir";

describe("classic IR to IR 4.0.0", () => {
  test("converts a format 3 library to a format 4 library", () => {
    const classic = {
      formatVersion: 3,
      distribution: [
        "Library",
        [["local"], ["example"]],
        [],
        { modules: [] },
      ],
    };
    const v4 = JSON.parse(classicToV4(classic));
    expect(v4.formatVersion).toBe(4);
    expect(v4.distribution.Library.packageName).toBe("local/example");
  });

  test("throws when the migration refuses the IR", () => {
    expect(() => classicToV4({ formatVersion: 3, distribution: "nonsense" })).toThrow(
      /classic IR conversion failed/
    );
  });
});
