import { css } from "lit";

export const sharedStyles = css`
  :host {
    --mv-bg: #f6f7f9;
    --mv-surface: #ffffff;
    --mv-border: #d9dde3;
    --mv-text: #1f2933;
    --mv-muted: #667085;
    --mv-accent: #2457c5;
    --mv-accent-soft: #e8efff;
    --mv-yes: #1b7f4b;
    --mv-yes-soft: #e6f6ed;
    --mv-no: #a33a2c;
    --mv-no-soft: #fbece9;
    --mv-radius: 8px;
    font-size: 13px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color: var(--mv-text);
  }
  button {
    font: inherit;
    cursor: pointer;
    border: 1px solid var(--mv-border);
    background: var(--mv-surface);
    color: var(--mv-text);
    border-radius: 6px;
    padding: 4px 10px;
  }
  button:hover:not([disabled]) {
    border-color: var(--mv-accent);
    color: var(--mv-accent);
  }
  button[disabled] {
    opacity: 0.45;
    cursor: default;
  }
  button.primary {
    background: var(--mv-accent);
    border-color: var(--mv-accent);
    color: #fff;
  }
  button.primary:hover:not([disabled]) {
    color: #fff;
    filter: brightness(1.1);
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 2px solid var(--mv-accent);
    outline-offset: 1px;
  }
  input,
  select,
  textarea {
    font: inherit;
    padding: 4px 8px;
    border: 1px solid var(--mv-border);
    border-radius: 6px;
    background: #fff;
    color: inherit;
  }
  .badge {
    display: inline-block;
    font-size: 0.75rem;
    padding: 1px 8px;
    border-radius: 999px;
    border: 1px solid var(--mv-border);
    background: var(--mv-bg);
    color: var(--mv-muted);
    white-space: nowrap;
  }
  .badge.simple {
    background: var(--mv-yes-soft);
    color: var(--mv-yes);
    border-color: transparent;
  }
  .badge.moderate {
    background: #fff4d6;
    color: #8a5a00;
    border-color: transparent;
  }
  .badge.complex {
    background: var(--mv-no-soft);
    color: var(--mv-no);
    border-color: transparent;
  }
  .muted {
    color: var(--mv-muted);
  }
`;
