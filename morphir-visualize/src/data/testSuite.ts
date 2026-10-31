import type { FQName } from "../ir/types";
import { pathToString, toCamelCase } from "../ir/names";

/** One test case in `morphir-tests.json`; values use the test-data JSON format. */
export type TestCase = {
  readonly inputs: readonly unknown[];
  readonly expectedOutput: unknown;
  readonly description: string;
};

/** The persisted file: `[[fqName, testCases], ...]`. Kept as raw JSON so unknown entries survive a round trip. */
export type TestSuite = readonly (readonly [unknown, readonly TestCase[]])[];

const sameFQName = (raw: unknown, fqn: FQName): boolean =>
  JSON.stringify(raw) === JSON.stringify(fqn);

export const casesFor = (suite: TestSuite, fqn: FQName): readonly TestCase[] =>
  suite.find(([raw]) => sameFQName(raw, fqn))?.[1] ?? [];

export const withCases = (suite: TestSuite, fqn: FQName, cases: readonly TestCase[]): TestSuite => {
  const others = suite.filter(([raw]) => !sameFQName(raw, fqn));
  return cases.length === 0 ? others : [...others, [fqn, cases] as const];
};

export const countCases = (suite: TestSuite, fqn: FQName): number => casesFor(suite, fqn).length;

export const describeFunction = (fqn: FQName): string => `${pathToString(fqn[1])}.${toCamelCase(fqn[2])}`;

export const parseSuite = (json: unknown): TestSuite => {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (e): e is readonly [unknown, readonly TestCase[]] => Array.isArray(e) && e.length === 2 && Array.isArray(e[1]),
  );
};
