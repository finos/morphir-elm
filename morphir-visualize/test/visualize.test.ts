import { describe, expect, it } from "bun:test";
import { IRIndex, isSdkReference } from "../src/ir/index";
import { buildLogic, complexityOf, findNode, pathTo } from "../src/logic/logic";
import { simulate } from "../src/eval/simulate";
import { edgeLabelFor, layoutGraph } from "../src/logic/graph";
import { describePattern, describeValue } from "../src/logic/describe";
import { defaultData, shapeOf } from "../src/data/shape";
import { casesFor, withCases } from "../src/data/testSuite";
import { fqnKey, humanize } from "../src/ir/names";

const sdk = (mod: string, name: string) => [[["morphir"], ["s", "d", "k"]], [[mod]], [name]];
const intType = ["Reference", {}, sdk("basics", "int"), []];
const stringType = ["Reference", {}, sdk("string", "string"), []];
const v = (name: string) => ["Variable", {}, [name]];
const lit = (n: number) => ["Literal", {}, ["WholeNumberLiteral", n]];
const str = (s: string) => ["Literal", {}, ["StringLiteral", s]];
const apply = (fn: unknown, ...args: unknown[]) => args.reduce((acc, a) => ["Apply", {}, acc, a], fn);
const ref = (mod: string, name: string) => ["Reference", {}, sdk(mod, name)];

const pkg = [["my"], ["pkg"]];
const mod = [["rules"]];

const classifyBody = [
  "IfThenElse", {},
  apply(ref("basics", "lessThan"), v("age"), lit(18)),
  str("Minor"),
  [
    "IfThenElse", {},
    apply(ref("basics", "lessThan"), v("age"), lit(65)),
    str("Adult"),
    str("Senior"),
  ],
];

const fn = (name: string[], body: unknown) => [
  name,
  { access: "Public", value: { doc: "", value: { inputTypes: [[["age"], {}, intType]], outputType: stringType, body } } },
];

const ir = {
  formatVersion: 3,
  distribution: [
    "Library",
    pkg,
    [],
    {
      modules: [
        [
          mod,
          {
            access: "Public",
            value: {
              types: [
                [
                  ["status"],
                  {
                    access: "Public",
                    value: {
                      doc: "",
                      value: ["CustomTypeDefinition", [], { access: "Public", value: [[["active"], []], [["closed"], [[["reason"], stringType]]]] }],
                    },
                  },
                ],
              ],
              values: [
                fn(["classify"], classifyBody),
                fn(["describe", "age"], apply(["Reference", {}, [pkg, mod, ["classify"]]], v("age"))),
              ],
              doc: null,
            },
          },
        ],
      ],
    },
  ],
};

describe("IRIndex", () => {
  const index = IRIndex.fromJson(ir);

  it("lists functions and resolves them by key", () => {
    expect(index.functions.map((f) => f.key)).toEqual(["My.Pkg:Rules:classify", "My.Pkg:Rules:describeAge"]);
    expect(index.getFunction("My.Pkg:Rules:classify")?.def.inputs).toHaveLength(1);
  });

  it("tracks callers", () => {
    expect(index.calledBy("My.Pkg:Rules:classify").map((f) => f.key)).toEqual(["My.Pkg:Rules:describeAge"]);
  });

  it("rejects unsupported format versions", () => {
    expect(() => IRIndex.fromJson({ ...ir, formatVersion: 2 })).toThrow(/format version/);
  });
});

describe("logic model", () => {
  const index = IRIndex.fromJson(ir);
  const root = buildLogic(index.getFunction("My.Pkg:Rules:classify")!.def, index);

  it("flattens else-if chains into ordered rules", () => {
    if (root.kind !== "decision") throw new Error("expected decision");
    expect(root.rules.map((r) => r.when)).toEqual(["age is less than 18", "age is less than 65"]);
    expect(root.otherwise).toMatchObject({ kind: "outcome", text: "“Senior”" });
    expect(complexityOf(root)).toMatchObject({ decisions: 2, level: "simple" });
  });

  it("finds nodes and breadcrumb paths by id", () => {
    expect(findNode(root, "root.rule1")?.kind).toBe("outcome");
    expect(pathTo(root, "root.otherwise").map((n) => n.id)).toEqual(["root", "root.otherwise"]);
  });

  it("lays out a left-to-right graph with full, wrapped labels", () => {
    const g = layoutGraph(root, { depthLimit: 3, toggled: new Set() });
    expect(g.nodes.map((n) => n.id).sort()).toEqual(["root", "root.otherwise", "root.rule0", "root.rule1"]);
    expect(g.edges.map((e) => e.label).sort()).toEqual(["If age is less than 18", "If age is less than 65", "Otherwise"]);
    const byId = new Map(g.nodes.map((n) => [n.id, n]));
    expect(byId.get("root.rule0")!.x).toBeGreaterThan(byId.get("root")!.x);
    for (const e of g.edges) expect(e.lines.join(" ")).toBe(e.label);
    expect(edgeLabelFor(root, "root.otherwise")).toBe("Otherwise");
  });

  it("collapses nodes beyond the depth limit unless toggled", () => {
    const collapsed = layoutGraph(root, { depthLimit: 0, toggled: new Set() });
    expect(collapsed.nodes).toHaveLength(1);
    expect(collapsed.nodes[0]).toMatchObject({ collapsed: true, hidden: 3 });
    expect(layoutGraph(root, { depthLimit: 0, toggled: new Set(["root"]) }).nodes).toHaveLength(4);
  });

  it("describes expressions in plain language", () => {
    const body = index.getFunction("My.Pkg:Rules:describeAge")!.def.body;
    expect(describeValue(body, index)).toBe("classify of age");
  });
});

describe("sdk detection", () => {
  it("only treats Morphir.SDK as the SDK, not other packages starting with Morphir", () => {
    expect(isSdkReference([[["morphir"], ["s", "d", "k"]], [["basics"]], ["int"]])).toBe(true);
    expect(isSdkReference([[["morphir"], ["dapr"]], [["input"]], ["deal"]])).toBe(false);
  });
});

describe("simulation", () => {
  const index = IRIndex.fromJson(ir);
  const classify = index.getFunction("My.Pkg:Rules:classify")!;

  it("follows the branch the inputs select", () => {
    const minor = simulate(index, classify, [10]);
    expect(minor.text).toBe("“Minor”");
    expect([...minor.visited].sort()).toEqual(["root", "root.rule0"]);
    const senior = simulate(index, classify, [70]);
    expect([...senior.visited].sort()).toEqual(["root", "root.otherwise"]);
  });
});

describe("pattern wording", () => {
  const sdkFqn = (m: string, n: string) => [[["morphir"], ["s", "d", "k"]], [[m]], [n]] as const;
  const wild = { kind: "Wildcard" } as const;

  it("reads Maybe patterns as presence of a value", () => {
    expect(describePattern({ kind: "Constructor", fqn: sdkFqn("maybe", "nothing") as never, args: [] })).toBe("no value is present");
    const just = { kind: "Constructor", fqn: sdkFqn("maybe", "just") as never, args: [{ kind: "As", pattern: wild, name: ["d"] }] } as const;
    expect(describePattern(just)).toBe("a value is present (d)");
  });

  it("names bound constructor arguments and hides all-wildcard ones", () => {
    const fqn = [pkg, mod, ["open", "deal"]] as never;
    expect(describePattern({ kind: "Constructor", fqn, args: [wild, wild] })).toBe("Open deal");
    expect(describePattern({ kind: "Constructor", fqn, args: [{ kind: "As", pattern: wild, name: ["id"] }, wild] })).toBe("Open deal with id, any value");
  });
});

describe("test data", () => {
  const index = IRIndex.fromJson(ir);
  const statusType = { kind: "Reference", fqn: [pkg, mod, ["status"]], args: [] } as const;

  it("generates defaults in the DataCodec format", () => {
    expect(defaultData(index, { kind: "Reference", fqn: [[["morphir"], ["s", "d", "k"]], [["basics"]], ["int"]], args: [] })).toBe(0);
    expect(defaultData(index, statusType)).toEqual(["active"]);
  });

  it("classifies custom types", () => {
    expect(shapeOf(index, statusType).kind).toBe("custom");
  });

  it("replaces and removes cases for a function", () => {
    const fqn = [pkg, mod, ["classify"]] as const;
    const case1 = { inputs: [10], expectedOutput: "Minor", description: "child" };
    const suite = withCases([], fqn, [case1]);
    expect(casesFor(suite, fqn)).toEqual([case1]);
    expect(withCases(suite, fqn, [])).toEqual([]);
  });
});

describe("names", () => {
  it("humanizes and keys names", () => {
    expect(humanize(["cancelation", "ratio"])).toBe("Cancelation ratio");
    expect(humanize(["i", "r", "value"])).toBe("IR value");
    expect(fqnKey([[["my"], ["pkg"]], [["rules"]], ["describe", "age"]])).toBe("My.Pkg:Rules:describeAge");
  });
});
