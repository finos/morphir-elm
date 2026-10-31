import { LitElement, html, css, nothing, type TemplateResult } from "lit";
import type { Type } from "../ir/types";
import type { IRIndex } from "../ir/index";
import { defaultData, shapeOf } from "../data/shape";
import { humanize, toCamelCase } from "../ir/names";
import { describeType } from "../logic/describe";

const capitalizeFirst = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
import { sharedStyles } from "./styles";

/**
 * Type-driven editor for a value in the test-data JSON format.
 *
 * Properties: `index`, `type`, `value`. Fires `value-change` (detail: the new value).
 */
export class MorphirValueInput extends LitElement {
  static properties = {
    index: { attribute: false },
    type: { attribute: false },
    value: { attribute: false },
    depth: { type: Number },
  };

  declare index: IRIndex | undefined;
  declare type: Type | undefined;
  declare value: unknown;
  declare depth: number;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .group {
        display: grid;
        gap: 6px;
        padding: 8px 10px;
        border-left: 3px solid var(--mv-border);
        background: rgba(0, 0, 0, 0.02);
        border-radius: 0 6px 6px 0;
      }
      .field {
        display: grid;
        grid-template-columns: minmax(80px, 140px) 1fr;
        gap: 8px;
        align-items: start;
      }
      .field > label {
        padding-top: 5px;
        font-size: 0.9rem;
        color: var(--mv-muted);
      }
      .row {
        display: flex;
        gap: 6px;
        align-items: start;
      }
      .row > :first-child {
        flex: 1;
      }
      input[type="number"],
      input[type="text"] {
        width: 100%;
        box-sizing: border-box;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
        font-family: ui-monospace, monospace;
        min-height: 3.5em;
      }
    `,
  ];

  constructor() {
    super();
    this.depth = 0;
  }

  private emit(value: unknown): void {
    this.value = value;
    this.dispatchEvent(new CustomEvent("value-change", { detail: value, bubbles: false, composed: true }));
  }

  private child(tpe: Type, value: unknown, onChange: (v: unknown) => void): TemplateResult {
    return html`<morphir-value-input
      .index=${this.index}
      .type=${tpe}
      .value=${value}
      .depth=${this.depth + 1}
      @value-change=${(e: CustomEvent) => {
        e.stopPropagation();
        onChange(e.detail);
      }}
    ></morphir-value-input>`;
  }

  render() {
    if (!this.index || !this.type) return nothing;
    const index = this.index;
    const shape = shapeOf(index, this.type);
    const v = this.value;

    switch (shape.kind) {
      case "bool":
        return html`<select aria-label="Yes or no" @change=${(e: Event) => this.emit((e.target as HTMLSelectElement).value === "yes")}>
          <option value="yes" ?selected=${v === true}>Yes</option>
          <option value="no" ?selected=${v !== true}>No</option>
        </select>`;

      case "int":
      case "float":
        return html`<input
          type="number"
          step=${shape.kind === "int" ? "1" : "any"}
          .value=${typeof v === "number" ? String(v) : ""}
          @input=${(e: Event) => {
            const raw = (e.target as HTMLInputElement).value;
            if (raw === "") return;
            const n = Number(raw);
            this.emit(shape.kind === "int" ? Math.trunc(n) : n);
          }}
        />`;

      case "string":
      case "decimal":
      case "char":
        return html`<input
          type="text"
          maxlength=${shape.kind === "char" ? "1" : nothing}
          inputmode=${shape.kind === "decimal" ? "decimal" : nothing}
          .value=${typeof v === "string" ? v : ""}
          @input=${(e: Event) => this.emit((e.target as HTMLInputElement).value)}
        />`;

      case "maybe": {
        const present = v !== null && v !== undefined;
        return html`<div class="group">
          <label
            ><input
              type="checkbox"
              .checked=${present}
              @change=${(e: Event) => this.emit((e.target as HTMLInputElement).checked ? defaultData(index, shape.item) : null)}
            />
            Has a value</label
          >
          ${present ? this.child(shape.item, v, (x) => this.emit(x)) : nothing}
        </div>`;
      }

      case "list": {
        const items = Array.isArray(v) ? v : [];
        return html`<div class="group">
          ${items.length === 0 ? html`<span class="muted">Empty list</span>` : nothing}
          ${items.map(
            (item, i) => html`<div class="row">
              ${this.child(shape.item, item, (x) => this.emit(items.map((y, k) => (k === i ? x : y))))}
              <button type="button" aria-label="Remove item ${i + 1}" @click=${() => this.emit(items.filter((_, k) => k !== i))}>✕</button>
            </div>`,
          )}
          <div><button type="button" @click=${() => this.emit([...items, defaultData(index, shape.item)])}>+ Add item</button></div>
        </div>`;
      }

      case "tuple": {
        const items = Array.isArray(v) ? v : [];
        return html`<div class="group">
          ${shape.elements.map(
            (e, i) => html`<div class="field">
              <label>Part ${i + 1}</label>
              ${this.child(e, items[i], (x) => this.emit(shape.elements.map((_, k) => (k === i ? x : items[k]))))}
            </div>`,
          )}
        </div>`;
      }

      case "record": {
        const record = typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
        return html`<div class="group">
          ${shape.fields.map((f) => {
            const key = toCamelCase(f.name);
            return html`<div class="field">
              <label>${humanize(f.name)}</label>
              ${this.child(f.tpe, record[key], (x) => this.emit({ ...record, [key]: x }))}
            </div>`;
          })}
        </div>`;
      }

      case "custom": {
        const current = Array.isArray(v) ? v : [];
        const selected = shape.constructors.find((c) => toCamelCase(c.name) === current[0]) ?? shape.constructors[0];
        if (!selected) return html`<span class="muted">No options</span>`;
        const select = (name: string) => {
          const c = shape.constructors.find((x) => toCamelCase(x.name) === name);
          if (c) this.emit([toCamelCase(c.name), ...c.args.map((a) => defaultData(index, a.tpe, this.depth + 1))]);
        };
        return html`<div class="group">
          <select aria-label="Choose an option" @change=${(e: Event) => select((e.target as HTMLSelectElement).value)}>
            ${shape.constructors.map(
              (c) => html`<option value=${toCamelCase(c.name)} ?selected=${c === selected}>${humanize(c.name)}</option>`,
            )}
          </select>
          ${selected.args.map(
            (a, i) => html`<div class="field">
              <label>${/^arg\d*$/.test(a.name.join(""))  ? capitalizeFirst(describeType(a.tpe, index)) : humanize(a.name)}</label>
              ${this.child(a.tpe, current[i + 1], (x) => this.emit(current.map((y, k) => (k === i + 1 ? x : y))))}
            </div>`,
          )}
        </div>`;
      }

      case "json":
        return html`<textarea
          aria-label="Value as JSON"
          .value=${JSON.stringify(v ?? null)}
          @change=${(e: Event) => {
            try {
              this.emit(JSON.parse((e.target as HTMLTextAreaElement).value));
            } catch {
              (e.target as HTMLTextAreaElement).setCustomValidity("Not valid JSON");
              (e.target as HTMLTextAreaElement).reportValidity();
            }
          }}
        ></textarea>`;
    }
  }
}

if (!customElements.get("morphir-value-input")) customElements.define("morphir-value-input", MorphirValueInput);
