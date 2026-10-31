# morphir-visualize

A business-user oriented view of Morphir logic, built as [Lit](https://lit.dev) web components.
Where `morphir-elm develop` shows the IR the way a developer sees it, this shows each function as plain-language
rules, lets you drill into complexity, and lets you author test cases from forms generated from the function's types.

## Run it

```bash
morphir-elm make          # produces morphir-ir.json
morphir visualize         # http://localhost:3000   (-p/--port, -o/--host, -i/--project-dir)
```

Test cases are read from and saved to `morphir-tests.json` in the project directory, in the same format that
`morphir-elm develop` uses.

## How it is laid out

- **Centre** – a left-to-right graph of the logic (laid out with [dagre](https://github.com/dagrejs/dagre)).
  Decisions, "depends on" matches and calculation steps branch to the right; each link is labelled with the full
  condition for taking it, and nothing is truncated. Branches deeper than three levels start collapsed (`+N`);
  use the circle on a node, *Expand all*, or *Fit* / zoom to manage large logic.
- **Left** – every function, grouped by module, with a search box and test-case counts.
- **Right** – *Details* for the selected node, as collapsible sections (built with
  [Shoelace](https://shoelace.style) `sl-details`): how it is reached, where it leads, complexity,
  calculations used, used by. Click a node to select it; *Make root* (or double-click) re-roots the graph on it.
- **Bottom** – *Test cases & what-if*. Change the inputs in the form and the logic runs in the browser: the path
  taken is highlighted in the graph (everything else is dimmed) and the result is shown. Saved test cases are listed
  with a pass/fail mark; *Show flow* loads one into the form. Logic using SDK functions the simulator does not know
  yet shows "Cannot simulate this yet" instead of a path.
- **Top** – back/forward history (also Alt+←/→) and a breadcrumb from the function down to the focused part.
  The focus is kept in the URL hash, so views can be bookmarked.

## Embedding

The package exports each component; they register themselves when imported.

```ts
import "./morphir-visualize.js";            // registers all elements
```

```html
<!-- the full experience, loading from a server that exposes /server/morphir-ir.json -->
<morphir-app src="http://localhost:3000"></morphir-app>
```

Compose smaller pieces yourself:

| Element | Properties | Events |
|---|---|---|
| `<morphir-logic-view>` | `index`, `function-key`, `focus-id` (root), `selected-id`, `trace` | `select-node`, `focus-change` |
| `<morphir-drilldown-panel>` | `index`, `function-key`, `focus-id` (root), `selected-id` | `select-node`, `focus-change` |
| `<morphir-testcase-editor>` | `index`, `function-key`, `cases` | `cases-change`, `simulation-change` |
| `<morphir-value-input>` | `index`, `type`, `value` | `value-change` |
| `<morphir-app>` | `src`, `index`, `tests`, `hash-routing` | `tests-change` |

`index` is an `IRIndex` (`IRIndex.fromJson(morphirIrJson)`), function keys look like `My.Pkg:Rules:classify`,
`trace` is the `Simulation` carried by `simulation-change` (see `simulate()` in `src/eval/simulate.ts`),
and `select-node` / `focus-change` carry `{ functionKey, nodeId }`.

## Development

```bash
mise run build:visualize          # bundles morphir-visualize/dist
bun test morphir-visualize        # unit tests
npx tsc -p morphir-visualize/tsconfig.json
```

Supports Morphir IR format version 3 (`Library` distributions). Test-case values use the data format of
`Morphir.IR.Type.DataCodec`; types without a form (for example `Dict`) fall back to a JSON text box.
Running a test case against the logic is not yet supported.
