import { LitElement, html, css, nothing } from "lit";
import type { IRIndex } from "../ir/index";
import type { TestCase } from "../data/testSuite";
import { defaultData } from "../data/shape";
import { humanize } from "../ir/names";
import { matchesExpected, simulate, type Simulation } from "../eval/simulate";
import { sharedStyles } from "./styles";
import "../shoelace";
import "./value-input";

const compact = (v: unknown): string => {
  const s = JSON.stringify(v);
  return s.length > 90 ? `${s.slice(0, 87)}…` : s;
};

/**
 * What-if form and saved test cases for one function. Changing an input re-runs the logic in the
 * browser and fires `simulation-change` so a graph can highlight the path taken. Saved cases show
 * whether they currently pass.
 *
 * Properties: `index`, `functionKey`, `cases`. Fires `cases-change` (detail: the new list of cases)
 * and `simulation-change` (detail: a `Simulation`, or undefined when there is nothing to run).
 */
export class MorphirTestcaseEditor extends LitElement {
  static properties = {
    index: { attribute: false },
    functionKey: { attribute: "function-key" },
    cases: { attribute: false },
    draft: { state: true },
  };


  declare index: IRIndex | undefined;
  declare functionKey: string | undefined;
  declare cases: readonly TestCase[];
  declare draft: TestCase | undefined;
  private draftFor: string | undefined;
  private sim: Simulation | undefined;
  private simKey: unknown;
  private emitted: Simulation | undefined | null = null;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .cols {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
        gap: 12px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .cols {
          grid-template-columns: 1fr;
        }
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
      .inputs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 10px 16px;
      }
      .result {
        margin: 10px 0 0;
        padding: 8px 10px;
        border-radius: var(--mv-radius);
        background: var(--mv-accent-soft);
        display: flex;
        gap: 8px;
        align-items: baseline;
        flex-wrap: wrap;
      }
      .result.error {
        background: #fff4d6;
      }
      .result b {
        font-size: 1rem;
      }
      .pass {
        color: var(--mv-yes);
        font-weight: 600;
      }
      .fail {
        color: var(--mv-no);
        font-weight: 600;
      }
      .case.active {
        border-color: var(--mv-accent);
      }
      h3 {
        margin: 0 0 8px;
        font-size: 0.8rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--mv-muted);
      }
      .case {
        background: var(--mv-surface);
        border: 1px solid var(--mv-border);
        border-radius: var(--mv-radius);
        padding: 8px 10px;
        margin-bottom: 8px;
        display: grid;
        gap: 4px;
      }
      .case header {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .case header strong {
        flex: 1;
      }
      .kv {
        font-size: 0.85rem;
        display: grid;
        grid-template-columns: 90px 1fr;
        gap: 6px;
      }
      code {
        font-family: ui-monospace, monospace;
        word-break: break-all;
      }
      form {
        display: grid;
        gap: 12px;
        background: var(--mv-surface);
        border: 1px solid var(--mv-border);
        border-radius: var(--mv-radius);
        padding: 12px;
      }
      form label.title {
        display: grid;
        gap: 4px;
        font-weight: 600;
      }
      fieldset {
        border: 0;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 4px;
      }
      legend {
        font-weight: 600;
        padding: 0;
        margin-bottom: 4px;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
    `,
  ];

  constructor() {
    super();
    this.cases = [];
  }

  private newDraft(): TestCase | undefined {
    const entry = this.index && this.functionKey ? this.index.getFunction(this.functionKey) : undefined;
    if (!this.index || !entry) return undefined;
    return {
      description: "",
      inputs: entry.def.inputs.map(([, tpe]) => defaultData(this.index as IRIndex, tpe)),
      expectedOutput: defaultData(this.index, entry.def.output),
    };
  }

  willUpdate(): void {
    if (this.draftFor !== this.functionKey || (!this.draft && this.index)) {
      this.draftFor = this.functionKey;
      this.draft = this.newDraft();
    }
    const entry = this.index && this.functionKey ? this.index.getFunction(this.functionKey) : undefined;
    if (this.draft !== this.simKey) {
      this.simKey = this.draft;
      this.sim = this.index && entry && this.draft ? simulate(this.index, entry, this.draft.inputs) : undefined;
    }
  }

  protected updated(): void {
    if (this.sim !== this.emitted) {
      this.emitted = this.sim;
      this.dispatchEvent(new CustomEvent("simulation-change", { detail: this.sim, bubbles: true, composed: true }));
    }
  }

  private verdict(entry: NonNullable<ReturnType<IRIndex["getFunction"]>>, tc: TestCase): boolean | undefined {
    if (!this.index) return undefined;
    return matchesExpected(this.index, entry, simulate(this.index, entry, tc.inputs), tc.expectedOutput);
  }

  private emit(cases: readonly TestCase[]): void {
    this.dispatchEvent(new CustomEvent("cases-change", { detail: cases, bubbles: true, composed: true }));
  }

  private load(tc: TestCase): void {
    this.draft = { ...tc };
  }

  private add(e: Event): void {
    e.preventDefault();
    if (!this.draft) return;
    this.emit([...this.cases, { ...this.draft, description: this.draft.description.trim() || `Test case ${this.cases.length + 1}` }]);
    this.draft = this.newDraft();
  }

  render() {
    const entry = this.index && this.functionKey ? this.index.getFunction(this.functionKey) : undefined;
    const draft = this.draft;
    if (!this.index || !entry || !draft) return html`<span class="muted">Choose a function to try it out and manage its test cases.</span>`;
    const index = this.index;
    const sim = this.sim;
    const expectedOk = sim ? matchesExpected(index, entry, sim, draft.expectedOutput) : undefined;

    const verdictBadge = (ok: boolean | undefined) =>
      ok === undefined ? html`<span class="badge" title="The simulator cannot run this case">not run</span>` : ok ? html`<span class="pass">✓ passes</span>` : html`<span class="fail">✗ fails</span>`;

    return html`<div class="cols">
      <div>
        <sl-details summary="Try it out: change the inputs and watch the flow" open>
          <div class="inputs">
            ${entry.def.inputs.map(
              ([name, tpe], k) => html`<fieldset>
                <legend>${humanize(name)}</legend>
                <morphir-value-input
                  .index=${index}
                  .type=${tpe}
                  .value=${draft.inputs[k]}
                  @value-change=${(e: CustomEvent) => (this.draft = { ...draft, inputs: draft.inputs.map((x, j) => (j === k ? e.detail : x)) })}
                ></morphir-value-input>
              </fieldset>`,
            )}
          </div>
          ${sim?.error
            ? html`<div class="result error" role="status">Cannot simulate this yet: ${sim.error}</div>`
            : sim
              ? html`<div class="result" role="status">Result: <b>${sim.text}</b></div>`
              : nothing}
        </sl-details>

        <sl-details summary="Save as a test case">
          <form @submit=${(e: Event) => this.add(e)}>
            <label class="title"
              >What does this example show?
              <input type="text" placeholder="e.g. Customer under 18 is declined" .value=${draft.description} @input=${(e: Event) => (this.draft = { ...draft, description: (e.target as HTMLInputElement).value })} />
            </label>
            <fieldset>
              <legend>Expected result</legend>
              <morphir-value-input
                .index=${index}
                .type=${entry.def.output}
                .value=${draft.expectedOutput}
                @value-change=${(e: CustomEvent) => (this.draft = { ...draft, expectedOutput: e.detail })}
              ></morphir-value-input>
            </fieldset>
            ${sim?.result !== undefined ? html`<div>With these inputs the logic gives ${expectedOk === undefined ? "a result" : expectedOk ? html`the expected result <span class="pass">✓</span>` : html`a different result <span class="fail">✗</span>`}.</div>` : nothing}
            <div class="actions">
              <button class="primary" type="submit">Add test case</button>
              <button type="button" @click=${() => (this.draft = this.newDraft())}>Reset</button>
            </div>
          </form>
        </sl-details>
      </div>

      <sl-details summary="Saved test cases (${this.cases.length})" open>
        ${this.cases.length === 0 ? html`<p class="muted">No test cases yet. Describe an example on the left and save it.</p>` : nothing}
        ${this.cases.map(
          (tc, i) => html`<div class="case ${JSON.stringify(tc.inputs) === JSON.stringify(draft.inputs) && JSON.stringify(tc.expectedOutput) === JSON.stringify(draft.expectedOutput) ? "active" : ""}">
            <header>
              <strong>${tc.description || `Test case ${i + 1}`}</strong>
              ${verdictBadge(this.verdict(entry, tc))}
              <button type="button" title="Put these values in the form and show the path they take" @click=${() => this.load(tc)}>Show flow</button>
              <button type="button" aria-label="Delete test case ${i + 1}" @click=${() => this.emit(this.cases.filter((_, k) => k !== i))}>Delete</button>
            </header>
            ${entry.def.inputs.map(([name], k) => html`<div class="kv"><span class="muted">${humanize(name)}</span><code>${compact(tc.inputs[k])}</code></div>`)}
            <div class="kv"><span class="muted">Expected</span><code>${compact(tc.expectedOutput)}</code></div>
          </div>`,
        )}
      </sl-details>
    </div>`;
  }
}

if (!customElements.get("morphir-testcase-editor")) customElements.define("morphir-testcase-editor", MorphirTestcaseEditor);
