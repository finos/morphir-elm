import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import type { IRIndex } from "../ir/index";
import { humanize, humanizePath } from "../ir/names";
import { buildLogic, callsOf, complexityOf, findNode, pathTo, type LogicNode } from "../logic/logic";
import { branchesOf, edgeLabelFor } from "../logic/graph";
import { fireFocus, fireSelect } from "./logic-view";
import { sharedStyles } from "./styles";
import "../shoelace";

const KIND_LABEL: Record<LogicNode["kind"], string> = {
  outcome: "Result",
  decision: "Decision",
  cases: "Depends on",
  steps: "Calculation steps",
};

/**
 * Details for the node selected in the graph: what it does, how it is reached, where it leads, its
 * complexity and related functions. "Make root" re-roots the graph on the node.
 *
 * Properties: `index`, `functionKey`, `focusId` (graph root), `selectedId`. Fires `focus-change` and `select-node`.
 */
export class MorphirDrilldownPanel extends LitElement {
  static properties = {
    index: { attribute: false },
    functionKey: { attribute: "function-key" },
    focusId: { attribute: "focus-id" },
    selectedId: { attribute: "selected-id" },
  };

  declare index: IRIndex | undefined;
  declare functionKey: string | undefined;
  declare focusId: string;
  declare selectedId: string | undefined;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      section {
        margin-bottom: 12px;
      }
      sl-details {
        margin-bottom: 8px;
      }
      sl-details::part(base) {
        border-radius: var(--mv-radius);
        border-color: var(--mv-border);
        background: var(--mv-surface);
      }
      sl-details::part(header) {
        padding: 8px 12px;
      }
      sl-details::part(summary) {
        font-weight: 600;
        font-size: 0.85rem;
      }
      sl-details::part(content) {
        padding: 0 12px 12px;
      }
      h3 {
        margin: 0 0 6px;
        font-size: 0.8rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--mv-muted);
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 6px;
      }
      .item {
        width: 100%;
        text-align: left;
        display: flex;
        gap: 8px;
        align-items: center;
        background: var(--mv-surface);
      }
      .item .title {
        flex: 1;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        text-align: center;
      }
      .stat {
        background: var(--mv-surface);
        border: 1px solid var(--mv-border);
        border-radius: var(--mv-radius);
        padding: 8px 4px;
      }
      .kind {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mv-muted);
      }
      .reached {
        color: var(--mv-accent);
        margin: 2px 0 6px;
      }
      .text {
        margin: 0 0 8px;
        font-size: 1rem;
        line-height: 1.4;
      }
      .actions {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .item .when {
        flex: 1;
        min-width: 0;
      }
      .item .then {
        display: block;
        color: var(--mv-muted);
      }
      .stat b {
        display: block;
        font-size: 1.3rem;
      }
      .stat span {
        font-size: 0.75rem;
        color: var(--mv-muted);
      }
    `,
  ];

  private moveTo(functionKey: string, nodeId = "root"): void {
    fireFocus(this, { functionKey, nodeId });
  }

  private select(functionKey: string, nodeId: string): void {
    fireSelect(this, { functionKey, nodeId });
  }

  private item(title: string, onClick: () => void, badge?: TemplateResult): TemplateResult {
    return html`<li><button type="button" class="item" @click=${onClick}><span class="title">${title}</span>${badge ?? nothing}</button></li>`;
  }

  render() {
    const entry = this.index && this.functionKey ? this.index.getFunction(this.functionKey) : undefined;
    if (!this.index || !entry) return nothing;

    const full = buildLogic(entry.def, this.index);
    const root = findNode(full, this.focusId) ?? full;
    const node = findNode(root, this.selectedId ?? "") ?? root;
    const rootTrail = pathTo(full, root.id);
    const parentOfRoot = rootTrail.length > 1 ? rootTrail[rootTrail.length - 2] : undefined;
    const reached = node.id === root.id ? undefined : edgeLabelFor(root, node.id);
    const c = complexityOf(node);
    const branches = branchesOf(node);
    const calls = callsOf(node, this.index, entry);
    const callers = this.index.calledBy(entry.key);

    return html`
      <section>
        <div class="kind">${KIND_LABEL[node.kind]}</div>
        ${reached ? html`<div class="reached">${reached}</div>` : nothing}
        <p class="text">${node.kind === "outcome" ? node.text : node.label}</p>
        <div class="actions">
          <button type="button" class="primary" ?disabled=${node.id === root.id || node.kind === "outcome"} title="Show only this part of the logic" @click=${() => this.moveTo(entry.key, node.id)}>
            Make root
          </button>
          ${parentOfRoot
            ? html`<button type="button" title="Show the part of the logic this view sits inside" @click=${() => this.moveTo(entry.key, parentOfRoot.id)}>↑ Zoom out</button>`
            : nothing}
        </div>
      </section>

      ${branches.length > 0
        ? html`<sl-details summary="Leads to" open>
            <ul>
              ${branches.map(
                (b) => html`<li>
                  <button type="button" class="item" @click=${() => this.select(entry.key, b.node.id)}>
                    <span class="when">${b.label}<span class="then">→ ${b.node.kind === "outcome" ? b.node.text : b.node.label}</span></span>
                  </button>
                </li>`,
              )}
            </ul>
          </sl-details>`
        : nothing}

      <sl-details summary=${node.id === root.id ? "Complexity of this view" : "Complexity of this part"} open>
        <div class="stats">
          <div class="stat"><b>${c.decisions}</b><span>decisions</span></div>
          <div class="stat"><b>${c.depth}</b><span>levels deep</span></div>
          <div class="stat"><b><span class="badge ${c.level}">${c.level}</span></b></div>
        </div>
      </sl-details>

      <sl-details summary="Uses these calculations">
        ${calls.length === 0
          ? html`<span class="muted">None.</span>`
          : html`<ul>${calls.map((f) => this.item(humanize(f.name), () => this.moveTo(f.key), html`<span class="muted">${humanizePath(f.modulePath)}</span>`))}</ul>`}
      </sl-details>

      <sl-details summary="Used by">
        ${callers.length === 0
          ? html`<span class="muted">Not used by other logic.</span>`
          : html`<ul>${callers.map((f) => this.item(humanize(f.name), () => this.moveTo(f.key), html`<span class="muted">${humanizePath(f.modulePath)}</span>`))}</ul>`}
      </sl-details>
    `;
  }
}

if (!customElements.get("morphir-drilldown-panel")) customElements.define("morphir-drilldown-panel", MorphirDrilldownPanel);
