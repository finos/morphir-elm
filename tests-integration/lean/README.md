# Lean backend example: verifying business logic

This example shows how business logic written in Elm can be verified with the [Lean 4](https://lean-lang.org)
theorem prover through the Morphir IR:

```
model/ (Elm) --morphir make--> morphir-ir.json --morphir lean-gen--> generated/ (Lean) <--imports-- proofs/ (Lean)
                               morphir-tests.json ------------------^
```

- `model/src/Morphir/Example/Lean/Pricing.elm` is a small pricing model (tier and volume discounts, order validation).
- `model/morphir-tests.json` holds Morphir test cases for the model. They pass in Morphir's own interpreter
  (`morphir-elm test`).
- `generated/` is produced by the Lean backend and is not checked in. It is a Lake package containing one Lean module
  per Morphir module, `Morphir/SDK.lean` (the Lean implementation of the Morphir SDK) and, under `Tests/`, the test
  cases turned into `#guard` checks. Building it runs the checks, so the generated Lean code and the SDK
  implementation are cross-checked against the results Morphir expects.
- `proofs/PricingProofs.lean` states business rules as theorems (the discount never exceeds the cap, higher tiers never
  get smaller discounts, valid line items never have a negative total, validated orders are never empty, ...) and
  proves them against the generated code.

If the model changes in a way that violates one of the rules, regenerating the Lean code makes the proofs fail.

## Running it

Requires a Lean toolchain (install [elan](https://github.com/leanprover/elan); the version is pinned in
`lean-toolchain`) and a built CLI (`mise run build:cli2`).

```powershell
cd tests-integration/lean/model
node ../../../cli2/lib/morphir.js make -o morphir-ir.json
cd ..
node ../../cli2/lib/morphir.js lean-gen -i model/morphir-ir.json -o generated
cd generated
lake build
cd ../proofs
lake build
```

`lean-gen` picks up `morphir-tests.json` from the directory of the IR file; use `--tests <path>` to point it
elsewhere. The CLI v1 equivalent of the generation step is `morphir-elm gen -t Lean`, which does not include tests.
