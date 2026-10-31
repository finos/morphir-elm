import dagre from "@dagrejs/dagre";
import { children, type LogicNode } from "./logic";

/** A labelled link from a logic node to one of the nodes it leads to. */
export type Branch = { readonly label: string; readonly node: LogicNode };

/** The ordered ways control can leave a node, each with the plain-language condition for taking it. */
export const branchesOf = (node: LogicNode): readonly Branch[] => {
  switch (node.kind) {
    case "outcome":
      return [];
    case "decision":
      return [...node.rules.map((r) => ({ label: `If ${r.when}`, node: r.then })), { label: "Otherwise", node: node.otherwise }];
    case "cases":
      return node.branches.map((b) => ({ label: `When ${b.when}`, node: b.then }));
    case "steps":
      return [...node.steps.map((s) => ({ label: s.name, node: s.node })), { label: "Then", node: node.result }];
  }
};

export type Point = { readonly x: number; readonly y: number };

export type GraphNode = {
  readonly id: string;
  readonly logic: LogicNode;
  readonly lines: readonly string[];
  readonly depth: number;
  /** Top-left corner and size, in graph units. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly hasChildren: boolean;
  readonly collapsed: boolean;
  /** Number of nodes hidden below this one when collapsed. */
  readonly hidden: number;
};

export type GraphEdge = {
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly lines: readonly string[];
  readonly points: readonly Point[];
  /** Top-left corner and size of the label pill. */
  readonly lx: number;
  readonly ly: number;
  readonly lw: number;
  readonly lh: number;
};

export type Graph = {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly width: number;
  readonly height: number;
};

export const NODE_W = 230;
/** Horizontal room taken by the glyph, padding and the collapse toggle. */
const NODE_CHROME = 66;
const LINE_H = 16;
const NODE_PAD_Y = 8;
const LABEL_W = 170;
const LABEL_PAD_Y = 6;
const NODE_FONT = "13px system-ui, sans-serif";
const LABEL_FONT = "600 11.5px system-ui, sans-serif";
const MARGIN = 16;

let measureCtx: CanvasRenderingContext2D | null | undefined;
const measurer = (font: string): ((text: string) => number) => {
  if (measureCtx === undefined) measureCtx = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  const ctx = measureCtx;
  if (!ctx) return (t) => t.length * 6.4;
  ctx.font = font;
  return (t) => ctx.measureText(t).width;
};

/** Wraps text on word boundaries to at most `width` px; nothing is ever cut off. */
export const wrapText = (text: string, width: number, font: string): readonly string[] => {
  const measure = measurer(font);
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter((w) => w.length > 0)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
};

export type LayoutOptions = {
  /** Nodes at this depth or deeper start collapsed (the root is depth 0). */
  readonly depthLimit: number;
  /** Ids whose collapsed state is flipped relative to the depth limit. */
  readonly toggled: ReadonlySet<string>;
};

const titleOf = (node: LogicNode): string => {
  switch (node.kind) {
    case "outcome":
      return node.text;
    case "decision":
      return "Decision";
    default:
      return node.label;
  }
};

const countBelow = (node: LogicNode): number => children(node).reduce((n, c) => n + 1 + countBelow(c), 0);

/** Lays the logic tree out left to right (dagre); full text is wrapped inside nodes and edge labels. */
export const layoutGraph = (root: LogicNode, options: LayoutOptions): Graph => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 44, nodesep: 14, edgesep: 8, marginx: MARGIN, marginy: MARGIN });
  g.setDefaultEdgeLabel(() => ({}));

  const meta = new Map<string, Omit<GraphNode, "x" | "y">>();
  const edgeMeta: { from: string; to: string; label: string; lines: readonly string[]; lw: number; lh: number }[] = [];

  const visit = (node: LogicNode, depth: number): void => {
    const branches = branchesOf(node);
    const hasChildren = branches.length > 0;
    const collapsed = hasChildren && (depth >= options.depthLimit) !== options.toggled.has(node.id);
    const lines = wrapText(titleOf(node), NODE_W - NODE_CHROME, NODE_FONT);
    const measure = measurer(NODE_FONT);
    const w = Math.ceil(Math.max(...lines.map((l) => measure(l))) * 1.05 + NODE_CHROME);
    const h = NODE_PAD_Y * 2 + lines.length * LINE_H;
    meta.set(node.id, { id: node.id, logic: node, lines, depth, w, h, hasChildren, collapsed, hidden: collapsed ? countBelow(node) : 0 });
    g.setNode(node.id, { width: w, height: h });
    if (!hasChildren || collapsed) return;
    for (const b of branches) {
      const labelLines = wrapText(b.label, LABEL_W - 16, LABEL_FONT);
      const lw = Math.min(LABEL_W, Math.max(...labelLines.map((l) => measurer(LABEL_FONT)(l))) + 16);
      const lh = LABEL_PAD_Y * 2 + labelLines.length * 14;
      g.setEdge(node.id, b.node.id, { width: lw, height: lh, labelpos: "c" });
      edgeMeta.push({ from: node.id, to: b.node.id, label: b.label, lines: labelLines, lw, lh });
      visit(b.node, depth + 1);
    }
  };
  visit(root, 0);
  dagre.layout(g);

  const nodes = [...meta.values()].map((m) => {
    const p = g.node(m.id);
    return { ...m, x: p.x - m.w / 2, y: p.y - m.h / 2 };
  });
  const edges = edgeMeta.map((e) => {
    const label = g.edge(e.from, e.to);
    return { ...e, points: label.points as readonly Point[], lx: label.x - e.lw / 2, ly: label.y - e.lh / 2 };
  });
  const size = g.graph();
  return { nodes, edges, width: size.width ?? 0, height: size.height ?? 0 };
};

/** The condition under which `id` is reached from its parent, if it has one. */
export const edgeLabelFor = (root: LogicNode, id: string): string | undefined => {
  const visit = (node: LogicNode): string | undefined => {
    for (const b of branchesOf(node)) {
      if (b.node.id === id) return b.label;
      const found = visit(b.node);
      if (found !== undefined) return found;
    }
    return undefined;
  };
  return visit(root);
};
