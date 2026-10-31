import { LitElement, html, css, nothing, svg } from "lit";
import type { IRIndex } from "../ir/index";
import { humanize, humanizePath } from "../ir/names";
import { describeType } from "../logic/describe";
import { buildLogic, children, complexityOf, findNode, pathTo, type LogicNode } from "../logic/logic";
import { layoutGraph, type Graph, type GraphNode } from "../logic/graph";
import type { Simulation } from "../eval/simulate";
import { sharedStyles } from "./styles";

export type FocusDetail = { readonly functionKey: string; readonly nodeId: string };

/** Asks the host to make a node the root of the graph. */
export const fireFocus = (el: HTMLElement, detail: FocusDetail): void => {
  el.dispatchEvent(new CustomEvent<FocusDetail>("focus-change", { detail, bubbles: true, composed: true }));
};

/** Tells the host which node the user selected (shown in the details panel). */
export const fireSelect = (el: HTMLElement, detail: FocusDetail): void => {
  el.dispatchEvent(new CustomEvent<FocusDetail>("select-node", { detail, bubbles: true, composed: true }));
};

const DEFAULT_DEPTH = 3;

/**
 * Left-to-right graph of one function's logic. Click a node to select it; double-click (or use the
 * details panel) to make it the root. Deep branches start collapsed and can be expanded in place.
 *
 * Properties: `index`, `functionKey`, `focusId` (root of the graph, default `root`), `selectedId`.
 * Set `trace` (a `Simulation`) to highlight the path a simulated run takes. Fires `select-node` and `focus-change`.
 */
export class MorphirLogicView extends LitElement {
  static properties = {
    index: { attribute: false },
    functionKey: { attribute: "function-key" },
    focusId: { attribute: "focus-id" },
    selectedId: { attribute: "selected-id" },
    trace: { attribute: false },
    scale: { state: true },
    depthLimit: { state: true },
    toggled: { state: true },
    offsets: { state: true },
    pan: { state: true },
  };

  declare index: IRIndex | undefined;
  declare functionKey: string | undefined;
  declare focusId: string;
  declare selectedId: string | undefined;
  declare trace: Simulation | undefined;
  declare scale: number;
  declare depthLimit: number;
  declare toggled: ReadonlySet<string>;
  declare pan: { x: number; y: number };
  declare offsets: ReadonlyMap<string, { dx: number; dy: number }>;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }
      header {
        padding: 8px 14px;
        background: var(--mv-surface);
        border-bottom: 1px solid var(--mv-border);
      }
      h2 {
        margin: 0;
        font-size: 1.05rem;
        display: inline;
      }
      .where {
        margin-left: 8px;
      }
      .sig {
        margin-top: 2px;
        color: var(--mv-muted);
      }
      .sig b {
        color: var(--mv-text);
        font-weight: 600;
      }
      .toolbar {
        display: flex;
        gap: 4px;
        align-items: center;
        padding: 4px 14px;
        border-bottom: 1px solid var(--mv-border);
        background: var(--mv-bg);
      }
      .toolbar button {
        padding: 1px 8px;
      }
      .toolbar .spacer {
        flex: 1;
      }
      .legend {
        display: flex;
        gap: 10px;
        color: var(--mv-muted);
      }
      .legend i {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        margin-right: 3px;
        vertical-align: -1px;
        border: 1px solid var(--mv-border);
      }
      .canvas {
        flex: 1;
        min-height: 0;
        overflow: hidden;
        background: var(--mv-bg);
        cursor: grab;
      }
      .canvas.panning {
        cursor: grabbing;
        user-select: none;
      }
      .stage {
        position: relative;
        margin: 0;
      }
      .plane {
        position: absolute;
        left: 0;
        top: 0;
        transform-origin: 0 0;
      }
      svg {
        position: absolute;
        left: 0;
        top: 0;
        overflow: visible;
      }
      .edge {
        fill: none;
        stroke: #b6bdc9;
        stroke-width: 1.6;
        transition: stroke 0.15s;
      }
      .edge.on {
        stroke: var(--mv-accent);
        stroke-width: 2.4;
      }
      .edge.dim {
        opacity: 0.35;
      }
      .pill {
        position: absolute;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 0 8px;
        font-size: 11.5px;
        line-height: 14px;
        color: #475467;
        background: #fff;
        border: 1px solid #d9dde3;
        border-radius: 999px;
      }
      .pill.on {
        color: var(--mv-accent);
        border-color: var(--mv-accent);
        background: var(--mv-accent-soft);
        font-weight: 600;
      }
      .node {
        position: absolute;
        touch-action: none;
        user-select: none;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 22px 0 12px;
        font-size: 13px;
        line-height: 16px;
        background: #fff;
        border: 1px solid #d9dde3;
        border-left: 5px solid #98a2b3;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(16, 24, 40, 0.12);
        cursor: pointer;
        transition: box-shadow 0.15s, opacity 0.15s, border-color 0.15s;
      }
      .node .text {
        flex: 1;
        min-width: 0;
      }
      .node .glyph {
        color: #98a2b3;
        font-size: 11px;
      }
      .node.decision {
        border-left-color: #e0a526;
        background: #fffaeb;
      }
      .node.cases {
        border-left-color: #5b8def;
        background: #f3f7ff;
      }
      .node.steps {
        border-left-color: #8e6be0;
        background: #f7f3ff;
      }
      .node.outcome {
        border-left-color: #2f9e6b;
      }
      .node:hover {
        box-shadow: 0 4px 12px rgba(16, 24, 40, 0.18);
      }
      .node.taken {
        border-color: var(--mv-accent);
        box-shadow: 0 0 0 2px var(--mv-accent-soft), 0 2px 8px rgba(36, 87, 197, 0.3);
      }
      .node.selected {
        outline: 2.5px solid var(--mv-accent);
        outline-offset: 1px;
      }
      .node:focus-visible {
        outline: 3px solid var(--mv-accent);
      }
      .node.dim,
      .pill.dim {
        opacity: 0.4;
      }
      .toggle {
        position: absolute;
        right: -11px;
        top: 50%;
        transform: translateY(-50%);
        min-width: 22px;
        height: 22px;
        padding: 0 4px;
        border-radius: 999px;
        font-size: 11px;
        line-height: 1;
        background: #fff;
        z-index: 1;
      }
      .empty {
        padding: 24px;
      }
    `,
  ];

  constructor() {
    super();
    this.focusId = "root";
    this.scale = 1;
    this.depthLimit = DEFAULT_DEPTH;
    this.toggled = new Set();
    this.offsets = new Map();
    this.pan = { x: 0, y: 0 };
  }

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("functionKey") || changed.has("focusId")) {
      this.toggled = new Set();
      this.offsets = new Map();
      this.pan = { x: 0, y: 0 };
      this.depthLimit = DEFAULT_DEPTH;
    }
    if (changed.has("trace") && this.trace && !this.trace.error && this.index && this.functionKey) this.openTakenPath();
  }

  /** Expands collapsed nodes the simulated run passed through so the whole path is visible. */
  private openTakenPath(): void {
    const entry = this.index?.getFunction(this.functionKey ?? "");
    if (!entry || !this.trace) return;
    const root = findNode(buildLogic(entry.def, this.index), this.focusId);
    if (!root) return;
    const visited = this.trace.visited;
    const open = new Set(this.toggled);
    const walk = (node: LogicNode, depth: number): void => {
      if (!visited.has(node.id)) return;
      if (depth >= this.depthLimit && children(node).length > 0) open.add(node.id);
      children(node).forEach((c) => walk(c, depth + 1));
    };
    walk(root, 0);
    if (open.size !== this.toggled.size) this.toggled = open;
  }

  protected updated(changed: Map<string, unknown>): void {
    if ((changed.has("functionKey") || changed.has("focusId")) && this.graph) this.fit();
  }

  private graph: Graph | undefined;

  /** Scales the graph down to fit the available width (never above 100%). */
  fit(): void {
    const canvas = this.renderRoot.querySelector<HTMLElement>(".canvas");
    if (!canvas || !this.graph) return;
    this.pan = { x: 0, y: 0 };
    this.scale = Math.min(1, Math.max(0.85, Math.min((canvas.clientWidth - 4) / this.graph.width, (canvas.clientHeight - 4) / this.graph.height)));
  }

  private zoom(factor: number): void {
    this.scale = Math.min(2, Math.max(0.3, this.scale * factor));
  }

  private toggle(id: string): void {
    const next = new Set(this.toggled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.toggled = next;
  }

  private dragged = false;

  private startDrag(e: PointerEvent, node: GraphNode): void {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".toggle")) return;
    const start = { x: e.clientX, y: e.clientY };
    const base = this.offsets.get(node.id) ?? { dx: 0, dy: 0 };
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    this.dragged = false;
    const move = (m: PointerEvent): void => {
      const mx = m.clientX - start.x;
      const my = m.clientY - start.y;
      if (!this.dragged && Math.hypot(mx, my) < 4) return;
      this.dragged = true;
      const next = new Map(this.offsets);
      next.set(node.id, {
        dx: Math.max(-node.x, base.dx + mx / this.scale),
        dy: Math.max(-node.y, base.dy + my / this.scale),
      });
      this.offsets = next;
    };
    const up = (): void => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  /** Drags the empty background to move the whole graph (the "hand" tool). */
  private startPan(e: PointerEvent): void {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".node, .pill")) return;
    const canvas = e.currentTarget as HTMLElement;
    const start = { x: e.clientX, y: e.clientY, pan: this.pan };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add("panning");
    const move = (m: PointerEvent): void => {
      this.pan = { x: start.pan.x + m.clientX - start.x, y: start.pan.y + m.clientY - start.y };
    };
    const up = (): void => {
      canvas.classList.remove("panning");
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) this.zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
    else this.pan = { x: this.pan.x - e.deltaX, y: this.pan.y - e.deltaY };
  }

  private resetLayout(): void {
    this.offsets = new Map();
  }

  private select(node: GraphNode): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    if (this.functionKey) fireSelect(this, { functionKey: this.functionKey, nodeId: node.id });
  }

  private makeRoot(node: GraphNode): void {
    if (this.functionKey && node.id !== this.focusId) fireFocus(this, { functionKey: this.functionKey, nodeId: node.id });
  }

  private onNodeKey(e: KeyboardEvent, node: GraphNode): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.select(node);
    }
  }

  /** Applies user drag offsets; edges touching a moved node are re-routed and their labels follow. */
  private withOffsets(graph: Graph): Graph {
    if (this.offsets.size === 0) return graph;
    const off = (id: string) => this.offsets.get(id) ?? { dx: 0, dy: 0 };
    const nodes = graph.nodes.map((n) => ({ ...n, x: n.x + off(n.id).dx, y: n.y + off(n.id).dy }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = graph.edges.map((e) => {
      const a = byId.get(e.from);
      const b = byId.get(e.to);
      if (!a || !b || (off(e.from).dx === 0 && off(e.from).dy === 0 && off(e.to).dx === 0 && off(e.to).dy === 0)) return e;
      const s = { x: a.x + a.w, y: a.y + a.h / 2 };
      const t = { x: b.x, y: b.y + b.h / 2 };
      const mx = (s.x + t.x) / 2;
      return { ...e, points: [s, { x: mx, y: s.y }, { x: mx, y: t.y }, t], lx: mx - e.lw / 2, ly: (s.y + t.y) / 2 - e.lh / 2 };
    });
    const width = Math.max(graph.width, ...nodes.map((n) => n.x + n.w + 20));
    const height = Math.max(graph.height, ...nodes.map((n) => n.y + n.h + 20));
    return { ...graph, nodes, edges, width, height };
  }

  private renderGraph(rawGraph: Graph, root: LogicNode, selected: string) {
    const graph = this.withOffsets(rawGraph);
    const trace = this.trace && !this.trace.error ? this.trace : undefined;
    const taken = (id: string) => trace?.visited.has(id) ?? false;
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    const onPath = new Set(pathTo(root, selected).map((n) => n.id));
    const edgeOn = (from: string, to: string) => (trace ? taken(from) && taken(to) : onPath.has(from) && onPath.has(to));
    const point = (p: { x: number; y: number }) => `${p.x},${p.y}`;

    const edgePath = (pts: readonly { x: number; y: number }[]): string => {
      if (pts.length < 3) return `M${pts.map(point).join(" L")}`;
      const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      let d = `M${point(pts[0])} L${point(mid(pts[0], pts[1]))}`;
      for (let i = 1; i < pts.length - 1; i++) d += ` Q${point(pts[i])} ${point(mid(pts[i], pts[i + 1]))}`;
      return `${d} L${point(pts[pts.length - 1])}`;
    };

    const edges = graph.edges.map((e) => {
      const on = edgeOn(e.from, e.to);
      const dim = trace && !on;
      return svg`<path class="edge ${on ? "on" : ""} ${dim ? "dim" : ""}" d=${edgePath(e.points)} marker-end=${on ? "url(#arrow-on)" : "url(#arrow)"}></path>`;
    });

    const labels = graph.edges.map((e) => {
      const on = edgeOn(e.from, e.to);
      return html`<div class="pill ${on ? "on" : ""} ${trace && !on ? "dim" : ""}" style="left:${e.lx}px;top:${e.ly}px;width:${e.lw}px;height:${e.lh}px">${e.lines.join(" ")}</div>`;
    });

    const nodes = graph.nodes.map((n) => {
      const isTaken = taken(n.id);
      const glyph = n.logic.kind === "decision" ? "◆" : n.logic.kind === "cases" ? "▣" : n.logic.kind === "steps" ? "≡" : "●";
      const text = n.logic.kind === "outcome" ? n.logic.text : n.lines.join(" ");
      const classes = `node ${n.logic.kind} ${n.id === selected ? "selected" : ""} ${isTaken ? "taken" : ""} ${trace && !isTaken ? "dim" : ""}`;
      return html`<div class=${classes} style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px" tabindex="0" role="button" aria-pressed=${n.id === selected} aria-label=${text}
        @pointerdown=${(e: PointerEvent) => this.startDrag(e, n)} @click=${() => this.select(n)} @dblclick=${() => this.makeRoot(n)} @keydown=${(e: KeyboardEvent) => this.onNodeKey(e, n)}>
        <span class="glyph">${glyph}</span><span class="text">${text}</span>
        ${n.hasChildren
          ? html`<button type="button" class="toggle" title=${n.collapsed ? `Show ${n.hidden} more` : "Collapse"} aria-label=${n.collapsed ? `Show ${n.hidden} more` : "Collapse"}
              @click=${(e: Event) => {
                e.stopPropagation();
                this.toggle(n.id);
              }}>${n.collapsed ? `+${n.hidden}` : "−"}</button>`
          : nothing}
      </div>`;
    });

    const w = graph.width;
    const h = graph.height;
    return html`<div class="stage" style="width:${w * this.scale}px;height:${h * this.scale}px;transform:translate(${this.pan.x}px,${this.pan.y}px)">
      <div class="plane" style="width:${w}px;height:${h}px;transform:scale(${this.scale})">
        <svg width=${w} height=${h} aria-hidden="true">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#b6bdc9"></path></marker>
            <marker id="arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#2457c5"></path></marker>
          </defs>
          ${edges}
        </svg>
        ${labels}${nodes}
      </div>
    </div>`;
  }

  render() {
    const entry = this.index && this.functionKey ? this.index.getFunction(this.functionKey) : undefined;
    if (!this.index || !entry) return html`<div class="empty muted">Choose a function to see its logic.</div>`;

    const full = buildLogic(entry.def, this.index);
    const root = findNode(full, this.focusId) ?? full;
    const selected = findNode(root, this.selectedId ?? "")?.id ?? root.id;
    this.graph = layoutGraph(root, { depthLimit: this.depthLimit, toggled: this.toggled });
    const c = complexityOf(root);
    const index = this.index;

    return html`
      <header>
        <h2>${humanize(entry.name)}</h2>
        <span class="muted where">${humanizePath(entry.modulePath)}</span>
        <span class="badge ${c.level}">${c.level} · ${c.decisions} ${c.decisions === 1 ? "decision" : "decisions"}</span>
        <div class="sig">
          Needs ${entry.def.inputs.map(([name, tpe], i) => html`${i > 0 ? ", " : ""}<b>${humanize(name)}</b> (${describeType(tpe, index)})`)}
          · Produces <b>${describeType(entry.def.output, index)}</b>
        </div>
      </header>
      <div class="toolbar">
        <button type="button" aria-label="Zoom out" @click=${() => this.zoom(0.8)}>−</button>
        <button type="button" aria-label="Zoom in" @click=${() => this.zoom(1.25)}>+</button>
        <button type="button" @click=${() => this.fit()}>Fit</button>
        <button type="button" @click=${() => ((this.toggled = new Set()), (this.depthLimit = Number.POSITIVE_INFINITY))}>Expand all</button>
        <button type="button" @click=${() => ((this.toggled = new Set()), (this.depthLimit = DEFAULT_DEPTH))}>Collapse</button>
        ${this.offsets.size > 0 ? html`<button type="button" @click=${() => this.resetLayout()}>Reset layout</button>` : nothing}
        <span class="spacer"></span>
        <span class="legend">
          <span><i style="background:#fff7e0"></i>Decision</span>
          <span><i style="background:#e8efff"></i>Depends on</span>
          <span><i style="background:#f1eaff"></i>Calculation</span>
          <span><i style="background:#fff"></i>Result</span>
        </span>
      </div>
      <div class="canvas" @pointerdown=${(e: PointerEvent) => this.startPan(e)} @wheel=${(e: WheelEvent) => this.onWheel(e)}>${this.renderGraph(this.graph, root, selected)}</div>
    `;
  }
}

if (!customElements.get("morphir-logic-view")) customElements.define("morphir-logic-view", MorphirLogicView);
