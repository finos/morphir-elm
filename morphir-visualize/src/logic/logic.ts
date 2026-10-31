import type { FQName, Pattern, Value } from "../ir/types";
import type { FunctionEntry, IRIndex } from "../ir/index";
import { isSdkReference, referencedValues } from "../ir/index";
import { humanize } from "../ir/names";
import { describePattern, describeValue } from "./describe";

/**
 * A business-oriented view of a function body. Control flow (decisions, case analysis, intermediate
 * calculations) becomes structure; everything else is an "outcome" described in plain language.
 */
export type LogicNode = Outcome | Decision | Cases | Steps;

type Base = {
  /** Stable path-like identifier, unique within a function (e.g. `root.no.case1`). */
  readonly id: string;
  /** Short description used in headings and breadcrumbs. */
  readonly label: string;
};

export type Outcome = Base & {
  readonly kind: "outcome";
  readonly text: string;
  readonly calls: readonly FQName[];
};

export type Rule = { readonly when: string; readonly then: LogicNode };

/** An if / else-if / else chain flattened into ordered rules (first match wins). */
export type Decision = Base & {
  readonly kind: "decision";
  readonly rules: readonly Rule[];
  readonly otherwise: LogicNode;
};

export type Cases = Base & {
  readonly kind: "cases";
  readonly subject: string;
  readonly branches: readonly { readonly when: string; readonly then: LogicNode }[];
};

export type Steps = Base & {
  readonly kind: "steps";
  readonly steps: readonly { readonly name: string; readonly node: LogicNode }[];
  readonly result: LogicNode;
};

export type Complexity = { readonly decisions: number; readonly depth: number; readonly level: "simple" | "moderate" | "complex" };

export const children = (node: LogicNode): readonly LogicNode[] => {
  switch (node.kind) {
    case "outcome":
      return [];
    case "decision":
      return [...node.rules.map((r) => r.then), node.otherwise];
    case "cases":
      return node.branches.map((b) => b.then);
    case "steps":
      return [...node.steps.map((s) => s.node), node.result];
  }
};

const decisionPoints = (node: LogicNode): number => {
  const own = node.kind === "decision" ? node.rules.length : node.kind === "cases" ? Math.max(node.branches.length - 1, 0) : 0;
  return own + children(node).reduce((sum, c) => sum + decisionPoints(c), 0);
};

const depthOf = (node: LogicNode): number => 1 + children(node).reduce((m, c) => Math.max(m, depthOf(c)), 0) - (node.kind === "outcome" ? 1 : 0);

export const complexityOf = (node: LogicNode): Complexity => {
  const decisions = decisionPoints(node);
  const depth = depthOf(node);
  const level = decisions <= 2 ? "simple" : decisions <= 7 ? "moderate" : "complex";
  return { decisions, depth, level };
};

export const findNode = (root: LogicNode, id: string): LogicNode | undefined => {
  if (root.id === id) return root;
  for (const c of children(root)) {
    if (id === c.id || id.startsWith(`${c.id}.`)) return findNode(c, id);
  }
  return undefined;
};

/** Nodes from the root down to (and including) the node with the given id. */
export const pathTo = (root: LogicNode, id: string): readonly LogicNode[] => {
  if (root.id === id) return [root];
  for (const c of children(root)) {
    if (id === c.id || id.startsWith(`${c.id}.`)) return [root, ...pathTo(c, id)];
  }
  return [root];
};

/** Functions in this package that a node's expressions call, excluding the function itself. */
export const callsOf = (node: LogicNode, index: IRIndex, self?: FunctionEntry): readonly FunctionEntry[] => {
  const found = new Map<string, FunctionEntry>();
  const visit = (n: LogicNode): void => {
    if (n.kind === "outcome") {
      for (const fqn of n.calls) {
        const entry = !isSdkReference(fqn) ? index.getFunctionByFQName(fqn) : undefined;
        if (entry && entry.key !== self?.key) found.set(entry.key, entry);
      }
    }
    children(n).forEach(visit);
  };
  visit(node);
  return [...found.values()];
};

const sentence = (text: string): string => (text.length === 0 ? text : text[0].toUpperCase() + text.slice(1));

export const buildLogic = (def: FunctionEntry["def"], index?: IRIndex): LogicNode => {
  const build = (value: Value, id: string): LogicNode => {
    const describe = (v: Value) => describeValue(v, index);

    switch (value.kind) {
      case "IfThenElse": {
        const rules: Rule[] = [];
        let current: Value = value;
        while (current.kind === "IfThenElse") {
          const n = rules.length;
          rules.push({ when: describe(current.condition), then: build(current.then, `${id}.rule${n}`) });
          current = current.else;
        }
        return { kind: "decision", id, label: `Decision: ${rules[0].when}`, rules, otherwise: build(current, `${id}.otherwise`) };
      }

      case "PatternMatch": {
        const subject = describe(value.subject);
        return {
          kind: "cases",
          id,
          label: `Depends on ${subject}`,
          subject,
          branches: value.cases.map(([pattern, body], i) => ({
            when: describePattern(pattern),
            then: build(body, `${id}.case${i}`),
          })),
        };
      }

      case "LetDefinition":
      case "LetRecursion":
      case "Destructure": {
        const steps: { name: string; node: LogicNode }[] = [];
        let current: Value = value;
        while (current.kind === "LetDefinition" || current.kind === "LetRecursion" || current.kind === "Destructure") {
          const n = steps.length;
          const stepId = `${id}.step${n}`;
          if (current.kind === "LetDefinition") {
            steps.push({ name: humanize(current.name), node: build(current.def.body, stepId) });
          } else if (current.kind === "LetRecursion") {
            current.defs.forEach(([name, d], k) => steps.push({ name: humanize(name), node: build(d.body, `${id}.step${n + k}`) }));
          } else {
            steps.push({ name: sentence(describePattern(current.pattern)), node: build(current.value, stepId) });
          }
          current = current.body;
        }
        return { kind: "steps", id, label: `${steps.length} intermediate ${steps.length === 1 ? "calculation" : "calculations"}`, steps, result: build(current, `${id}.result`) };
      }

      default:
        return {
          kind: "outcome",
          id,
          label: sentence(describe(value)),
          text: sentence(describe(value)),
          calls: referencedValues(value),
        };
    }
  };
  return build(def.body, "root");
};
