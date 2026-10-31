import { IRIndex } from "./ir/index";
import { parseSuite, type TestSuite } from "./data/testSuite";

export type Project = { readonly index: IRIndex; readonly tests: TestSuite };

const getJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status} ${response.statusText}`);
  return response.json();
};

/** Loads the Morphir IR and test cases from a server exposing the `/server/*` endpoints of `morphir visualize`. */
export const loadProject = async (baseUrl = ""): Promise<Project> => {
  const [ir, tests] = await Promise.all([
    getJson(`${baseUrl}/server/morphir-ir.json`),
    getJson(`${baseUrl}/server/morphir-tests.json`).catch(() => []),
  ]);
  return { index: IRIndex.fromJson(ir), tests: parseSuite(tests) };
};

export const saveTests = async (baseUrl: string, suite: TestSuite): Promise<void> => {
  const response = await fetch(`${baseUrl}/server/morphir-tests.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(suite),
  });
  if (!response.ok) throw new Error(`Saving test cases failed: ${response.status} ${response.statusText}`);
};
