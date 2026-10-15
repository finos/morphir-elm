---
name: morphir-modeling
description: Capture business or regulatory rules (interest caps, capital ratios, liquidity metrics, pricing, netting) as a deterministic, tested Morphir model using the morphir MCP server. Use when the user wants to turn a written rule into verifiable logic.
---

# Morphir modeling

Requires the `morphir` MCP server (tools `addModule` and `setTestCases`). If those tools are not available, tell the user to set it up following `integrations/README.md` and stop.

## Workflow

1. **Clarify first.** Restate the rule in your own words and ask about anything ambiguous: thresholds, units, rounding, boundaries, which party or product it applies to, and the effective date. Do not write code until the user confirms.
2. **Model the domain with types.** Use custom types for the concepts in the rule (`type Tier = Retail | Institutional`), not strings or booleans.
3. **Write the logic with `addModule`.** If it returns an error, read the compiler message, fix the code and call it again. Never present a model that was not accepted.
4. **Test with `setTestCases`.** At least one case per branch and per boundary value. Write each description so a compliance reader understands why the expected output is right.
5. **Report.** Summarise what was modelled, the assumptions you made, and which rule text each function implements.

## Rules for the Elm code

- Pure functions only. Pass dates and other context in as arguments.
- Prefer positional arguments to records in custom type constructors.
- Only `elm/core` imports.
- Implement only what was asked. No helper or demo functions.

## Encoding test values as JSON

Constructors are arrays: `["Retail"]`, `["Just", 5]`. Records are objects. Numbers, strings and booleans are plain JSON.
