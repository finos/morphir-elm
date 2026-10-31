import { LitElement, html, css, nothing } from "lit";
import type { IRIndex } from "../ir/index";
import { humanize } from "../ir/names";
import { buildLogic, pathTo } from "../logic/logic";
import { casesFor, countCases, withCases, type TestCase, type TestSuite } from "../data/testSuite";
import { loadProject, saveTests } from "../api";
import type { FocusDetail } from "./logic-view";
import { sharedStyles } from "./styles";
import "./logic-view";
import "./drilldown-panel";
import "./testcase-editor";
import type { Simulation } from "../eval/simulate";
import "../shoelace";

/**
 * Complete business-user experience: function navigator, central logic view, drill-down side panel,
 * test-case editor, breadcrumb and back/forward history.
 *
 * Either set `index` (and optionally `tests`) directly, or set `src` to the base URL of a server that
 * provides `/server/morphir-ir.json` and `/server/morphir-tests.json` (as `morphir visualize` does).
 * Add the `hash-routing` attribute to keep the focus in the URL hash.
 */
export class MorphirApp extends LitElement {
  static properties = {
    src: { type: String },
    hashRouting: { type: Boolean, attribute: "hash-routing" },
    index: { attribute: false },
    tests: { attribute: false },
    current: { state: true },
    selectedId: { state: true },
    sim: { state: true },
    testsOpen: { state: true },
    filter: { state: true },
    error: { state: true },
    status: { state: true },
    historyPos: { state: true },
  };

  declare src: string | undefined;
  declare hashRouting: boolean;
  declare index: IRIndex | undefined;
  declare tests: TestSuite;
  declare current: FocusDetail | undefined;
  declare selectedId: string | undefined;
  declare sim: Simulation | undefined;
  declare testsOpen: boolean;
  declare filter: string;
  declare error: string | undefined;
  declare status: string | undefined;
  declare historyPos: number;
  private history: FocusDetail[] = [];

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        height: 100%;
        min-height: 480px;
        background: var(--mv-bg);
      }
      .app {
        display: grid;
        grid-template-columns: 200px minmax(0, 1fr) 300px;
        grid-template-rows: auto minmax(0, 1fr) auto;
        grid-template-areas: "top top top" "nav main side" "nav tests tests";
        height: 100%;
      }
      .top {
        grid-area: top;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        background: var(--mv-surface);
        border-bottom: 1px solid var(--mv-border);
      }
      .brand {
        font-weight: 700;
      }
      nav.crumbs {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        align-items: center;
        min-width: 0;
      }
      nav.crumbs button {
        border: 0;
        background: none;
        padding: 2px 4px;
        color: var(--mv-accent);
      }
      nav.crumbs .current {
        font-weight: 600;
        padding: 2px 4px;
      }
      nav.crumbs .sep {
        color: var(--mv-muted);
      }
      aside {
        overflow: auto;
        padding: 10px;
      }
      .nav {
        grid-area: nav;
        border-right: 1px solid var(--mv-border);
        background: var(--mv-surface);
      }
      .side {
        grid-area: side;
        border-left: 1px solid var(--mv-border);
      }
      main {
        grid-area: main;
        overflow: hidden;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      main morphir-logic-view {
        flex: 1;
        min-height: 0;
      }
      .nav input[type="search"] {
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 10px;
      }
      .nav h4 {
        margin: 12px 0 4px;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--mv-muted);
      }
      .nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .nav li button {
        width: 100%;
        text-align: left;
        border: 0;
        border-radius: 6px;
        background: none;
        display: flex;
        gap: 6px;
      }
      .nav li button span:first-child {
        flex: 1;
      }
      .nav li button[aria-current="true"] {
        background: var(--mv-accent-soft);
        color: var(--mv-accent);
        font-weight: 600;
      }
      .tests {
        grid-area: tests;
        border-top: 1px solid var(--mv-border);
        background: var(--mv-bg);
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .tests-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--mv-surface);
        border: 0;
        border-radius: 0;
        width: 100%;
        text-align: left;
        font-weight: 600;
      }
      .tests-body[hidden] {
        display: none;
      }
      .tests-body {
        height: 270px;
        overflow: auto;
        padding: 10px 12px;
      }
      .error {
        margin: 16px;
        padding: 12px 16px;
        background: var(--mv-no-soft);
        color: var(--mv-no);
        border-radius: var(--mv-radius);
      }
      .status {
        font-size: 0.8rem;
        color: var(--mv-muted);
      }
      @media (max-width: 1100px) {
        .app {
          grid-template-columns: 220px minmax(0, 1fr);
          grid-template-areas: "top top" "nav main" "nav side" "nav tests";
          grid-template-rows: auto 1fr auto auto;
        }
        .side {
          border-left: 0;
          border-top: 1px solid var(--mv-border);
        }
      }
      @media (max-width: 700px) {
        .app {
          grid-template-columns: 1fr;
          grid-template-areas: "top" "nav" "main" "side" "tests";
          grid-template-rows: auto auto 1fr auto auto;
        }
        .nav {
          max-height: 200px;
          border-right: 0;
        }
      }
    `,
  ];

  constructor() {
    super();
    this.hashRouting = false;
    this.tests = [];
    this.testsOpen = true;
    this.filter = "";
    this.historyPos = -1;
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("hashchange", this.onHashChange);
    window.addEventListener("keydown", this.onKeyDown);
    if (this.src !== undefined && !this.index) void this.load();
  }

  disconnectedCallback(): void {
    window.removeEventListener("hashchange", this.onHashChange);
    window.removeEventListener("keydown", this.onKeyDown);
    super.disconnectedCallback();
  }

  willUpdate(changed: Map<string, unknown>): void {
    if (changed.has("index") && this.index && !this.current) {
      const initial = this.fromHash() ?? (this.index.functions[0] ? { functionKey: this.index.functions[0].key, nodeId: "root" } : undefined);
      if (initial) this.navigate(initial, false);
    }
  }

  async load(): Promise<void> {
    try {
      const project = await loadProject(this.src ?? "");
      this.tests = project.tests;
      this.index = project.index;
      this.error = undefined;
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  private fromHash(): FocusDetail | undefined {
    if (!this.hashRouting || !this.index) return undefined;
    const [key, nodeId] = decodeURIComponent(location.hash.replace(/^#\/?/, "")).split("|");
    return key && this.index.getFunction(key) ? { functionKey: key, nodeId: nodeId || "root" } : undefined;
  }

  private onHashChange = (): void => {
    const target = this.fromHash();
    if (target && (target.functionKey !== this.current?.functionKey || target.nodeId !== this.current?.nodeId)) this.navigate(target, true);
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.altKey && e.key === "ArrowLeft") this.go(-1);
    if (e.altKey && e.key === "ArrowRight") this.go(1);
  };

  /** Moves focus; when `record` is false the back/forward stack is left untouched. */
  private navigate(target: FocusDetail, record: boolean): void {
    if (this.current?.functionKey === target.functionKey && this.current.nodeId === target.nodeId) return;
    if (this.current?.functionKey !== target.functionKey) this.sim = undefined;
    this.current = target;
    this.selectedId = target.nodeId;
    if (record) {
      this.history = [...this.history.slice(0, this.historyPos + 1), target];
      this.historyPos = this.history.length - 1;
    } else if (this.history.length === 0) {
      this.history = [target];
      this.historyPos = 0;
    }
    if (this.hashRouting) {
      const hash = `#/${encodeURIComponent(`${target.functionKey}|${target.nodeId}`)}`;
      if (location.hash !== hash) history.replaceState(null, "", hash);
    }
  }

  private go(delta: number): void {
    const pos = this.historyPos + delta;
    if (pos < 0 || pos >= this.history.length) return;
    this.historyPos = pos;
    this.current = undefined;
    this.navigate(this.history[pos], false);
  }

  private async persist(suite: TestSuite): Promise<void> {
    this.tests = suite;
    this.dispatchEvent(new CustomEvent("tests-change", { detail: suite, bubbles: true, composed: true }));
    if (this.src === undefined) return;
    try {
      this.status = "Saving…";
      await saveTests(this.src, suite);
      this.status = "Saved";
    } catch (e) {
      this.status = undefined;
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  private onCasesChange(e: CustomEvent<readonly TestCase[]>): void {
    e.stopPropagation();
    const entry = this.current && this.index?.getFunction(this.current.functionKey);
    if (entry) void this.persist(withCases(this.tests, entry.fqn, e.detail));
  }

  private renderCrumbs() {
    const entry = this.current && this.index?.getFunction(this.current.functionKey);
    if (!this.index || !entry || !this.current) return nothing;
    const trail = pathTo(buildLogic(entry.def, this.index), this.current.nodeId);
    const key = this.current.functionKey;
    return html`<nav class="crumbs" aria-label="Where you are">
      ${trail.map((n, i) => {
        const last = i === trail.length - 1;
        const label = i === 0 ? humanize(entry.name) : n.label;
        return html`${i > 0 ? html`<span class="sep">›</span>` : nothing}${last
          ? html`<span class="current" aria-current="page">${label}</span>`
          : html`<button type="button" @click=${() => this.navigate({ functionKey: key, nodeId: n.id }, true)}>${label}</button>`}`;
      })}
    </nav>`;
  }

  private renderNav() {
    if (!this.index) return nothing;
    const q = this.filter.trim().toLowerCase();
    return html`
      <input type="search" placeholder="Find logic…" aria-label="Find logic" .value=${this.filter} @input=${(e: Event) => (this.filter = (e.target as HTMLInputElement).value)} />
      ${this.index.modules().map((m) => {
        const fns = m.functions.filter((f) => !q || humanize(f.name).toLowerCase().includes(q) || m.label.toLowerCase().includes(q));
        return fns.length === 0
          ? nothing
          : html`<h4>${m.label}</h4>
              <ul>
                ${fns.map((f) => {
                  const n = countCases(this.tests, f.fqn);
                  return html`<li>
                    <button type="button" aria-current=${f.key === this.current?.functionKey ? "true" : "false"} @click=${() => this.navigate({ functionKey: f.key, nodeId: "root" }, true)}>
                      <span>${humanize(f.name)}</span>${n > 0 ? html`<span class="badge" title="${n} test cases">${n} ✓</span>` : nothing}
                    </button>
                  </li>`;
                })}
              </ul>`;
      })}
    `;
  }

  render() {
    if (this.error && !this.index) return html`<div class="error" role="alert">${this.error}</div>`;
    if (!this.index) return html`<div class="error" style="background:none;color:inherit">Loading…</div>`;
    if (this.index.functions.length === 0) {
      return html`<div class="error" style="background:none;color:inherit" role="status">
        This project has no business logic to show: its Morphir IR contains types but no functions. Check that
        <code>morphir-ir.json</code> is up to date (run <code>morphir-elm make</code>) and that your modules expose functions.
      </div>`;
    }
    const entry = this.current && this.index.getFunction(this.current.functionKey);
    const onFocus = (e: CustomEvent<FocusDetail>) => {
      e.stopPropagation();
      this.navigate(e.detail, true);
    };

    const onSelect = (e: CustomEvent<FocusDetail>) => {
      e.stopPropagation();
      this.selectedId = e.detail.nodeId;
    };

    return html`<div class="app" @focus-change=${onFocus} @select-node=${onSelect}>
      <header class="top">
        <span class="brand">Morphir Visualize</span>
        <button type="button" aria-label="Back" title="Back (Alt+←)" ?disabled=${this.historyPos <= 0} @click=${() => this.go(-1)}>←</button>
        <button type="button" aria-label="Forward" title="Forward (Alt+→)" ?disabled=${this.historyPos >= this.history.length - 1} @click=${() => this.go(1)}>→</button>
        ${this.renderCrumbs()}
        <span class="status">${this.status ?? ""}</span>
      </header>
      <aside class="nav" aria-label="All logic">${this.renderNav()}</aside>
      <main>
        ${this.error ? html`<div class="error" role="alert" style="margin:0 0 12px">${this.error}</div>` : nothing}
        <morphir-logic-view .index=${this.index} .functionKey=${this.current?.functionKey} .focusId=${this.current?.nodeId ?? "root"} .selectedId=${this.selectedId} .trace=${this.sim}></morphir-logic-view>
      </main>
      <aside class="side" aria-label="Details">
        <morphir-drilldown-panel .index=${this.index} .functionKey=${this.current?.functionKey} .focusId=${this.current?.nodeId ?? "root"} .selectedId=${this.selectedId}></morphir-drilldown-panel>
      </aside>
      <section class="tests" aria-label="Test cases">
        <button type="button" class="tests-bar" aria-expanded=${this.testsOpen} @click=${() => (this.testsOpen = !this.testsOpen)}>
          ${this.testsOpen ? "▾" : "▸"} Test cases &amp; what-if
          ${entry ? html`<span class="badge">${casesFor(this.tests, entry.fqn).length} saved</span>` : nothing}
        </button>
        <div class="tests-body" ?hidden=${!this.testsOpen}>
          <morphir-testcase-editor
            .index=${this.index}
            .functionKey=${this.current?.functionKey}
            .cases=${entry ? casesFor(this.tests, entry.fqn) : []}
            @cases-change=${(e: CustomEvent<readonly TestCase[]>) => this.onCasesChange(e)}
            @simulation-change=${(e: CustomEvent<Simulation | undefined>) => {
              e.stopPropagation();
              this.sim = e.detail;
            }}
          ></morphir-testcase-editor>
        </div>
      </section>
    </div>`;
  }
}

if (!customElements.get("morphir-app")) customElements.define("morphir-app", MorphirApp);
