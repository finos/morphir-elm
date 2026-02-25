# WASM Interpreter Component Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose the Morphir interpreter as a WebAssembly Component Model component using ComponentizeJS.

**Architecture:** Compile the existing Elm interpreter to JS, wrap it with a thin JS glue layer that implements WIT-exported functions, then use `jco componentize` to produce a `.wasm` component and `jco transpile` for browser output. The WIT interface uses typed values (index-based flat tree) instead of JSON strings.

**Tech Stack:** Elm 0.19.1, ComponentizeJS (`@bytecodealliance/jco`), WIT (Component Model IDL), Bun (task runner), mise (build orchestration)

**Design doc:** `docs/plans/2026-02-25-wasm-interpreter-design.md`

---

### Task 1: Create package scaffolding

**Files:**
- Create: `packages/morphir-interpreter-wasm/package.json`
- Create: `packages/morphir-interpreter-wasm/.gitignore`

**Step 1: Create package.json**

```json
{
  "name": "@morphir/interpreter-wasm",
  "version": "0.0.0",
  "private": true,
  "description": "Morphir interpreter as a WebAssembly Component Model component",
  "type": "module",
  "devDependencies": {
    "@bytecodealliance/jco": "^1.9.0",
    "@bytecodealliance/componentize-js": "^0.14.0"
  }
}
```

**Step 2: Create .gitignore**

```
build/
elm-stuff/
```

**Step 3: Install dependencies**

Run: `bun install` (from repo root)
Expected: Dependencies resolve successfully

**Step 4: Commit**

```bash
git add packages/morphir-interpreter-wasm/package.json packages/morphir-interpreter-wasm/.gitignore
git commit -m "Add morphir-interpreter-wasm package scaffolding"
```

---

### Task 2: Create WIT definition

**Files:**
- Create: `packages/morphir-interpreter-wasm/wit/interpreter.wit`

**Step 1: Write the WIT file**

```wit
package morphir:interpreter;

interface types {
    record fq-name {
        package-path: string,
        module-path: string,
        local-name: string,
    }

    record morphir-value {
        root: u32,
        nodes: list<morphir-node>,
    }

    variant morphir-node {
        bool-val(bool),
        int-val(s64),
        float-val(f64),
        string-val(string),
        decimal-val(string),
        char-val(char),
        list-val(list<u32>),
        tuple-val(list<u32>),
        record-val(list<field-ref>),
        constructor-val(constructor-ref),
        unit-val,
    }

    record field-ref {
        name: string,
        value: u32,
    }

    record constructor-ref {
        fqn: fq-name,
        args: list<u32>,
    }

    variant eval-error {
        invalid-ir(string),
        reference-not-found(fq-name),
        argument-error(string),
        pattern-mismatch(string),
        type-error(string),
        variable-not-found(string),
        other(string),
    }

    resource ir-store {
        constructor(ir-json: string, uri: option<string>);
        uri: func() -> string;
        evaluate: func(fqn: fq-name, args: list<morphir-value>) -> result<morphir-value, eval-error>;
        reload: func(ir-json: string) -> result<_, eval-error>;
    }
}

interface eval {
    use types.{fq-name, morphir-value, eval-error};
    evaluate: func(ir-json: string, fqn: fq-name, args: list<morphir-value>) -> result<morphir-value, eval-error>;
}

world interpreter {
    export types;
    export eval;
}
```

**Step 2: Commit**

```bash
git add packages/morphir-interpreter-wasm/wit/interpreter.wit
git commit -m "Add WIT interface definition for morphir interpreter"
```

---

### Task 3: Create Elm entry point

**Files:**
- Create: `packages/morphir-interpreter-wasm/elm.json`
- Create: `packages/morphir-interpreter-wasm/src/Morphir/Interpreter/Worker.elm`

The Elm module is a `Platform.worker` that uses ports to communicate with the JS glue layer. It receives commands (load IR, evaluate) via inbound ports and sends results via outbound ports. The JS glue handles conversion between WIT typed values and JSON — the Elm side works with standard JSON-encoded Morphir values.

**Step 1: Create elm.json**

Model after `packages/cli/elm.json`. Use `"type": "application"` with source directories pointing to both the shared `../../src` and local `src`. Copy the same dependency set from `packages/cli/elm.json` — the interpreter needs the same IR and SDK modules. Trim any browser-only deps (`elm/browser`, `elm/html`, `elm/svg`, `elm/url`, `elm/http`, `mdgriffith/elm-ui`, `dosarf/elm-tree-view`, `rundis/elm-bootstrap`, `fabhof/elm-ui-datepicker`, `lattyware/elm-fontawesome`, `perzanko/elm-loading`, `elm-explorations/markdown`, `dillonkearns/elm-markdown`, `elm-community/array-extra`, `@types/d3`-related).

Required deps (keep these):
- `elm/core`, `elm/json`, `elm/parser`, `elm/regex`, `elm/time`
- `TSFoster/elm-uuid`, `chain-partners/elm-bignum`, `cuducos/elm-format-number`
- `elm-community/graph`, `elm-community/list-extra`, `elm-community/maybe-extra`
- `justinmimbs/date`, `matthewsj/elm-ordering`, `pzp1997/assoc-list`
- `rtfeldman/elm-iso8601-date-strings`, `stil4m/elm-syntax`, `waratuman/json-extra`

Include required indirect deps that these pull in.

**Step 2: Create Worker.elm**

```elm
port module Morphir.Interpreter.Worker exposing (main)

import Dict exposing (Dict)
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Morphir.IR.Distribution exposing (Distribution)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.FormatVersion.Codec as DistributionCodec
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.SDK as SDK
import Morphir.IR.Value as Value
import Morphir.Value.Error exposing (Error(..))
import Morphir.Value.Interpreter as Interpreter


-- PORTS (inbound)


port loadIR : (Decode.Value -> msg) -> Sub msg


port evaluateFunction : (Decode.Value -> msg) -> Sub msg


-- PORTS (outbound)


port loadIRResult : Encode.Value -> Cmd msg


port evaluateFunctionResult : Encode.Value -> Cmd msg


-- MODEL


type alias Model =
    { distribution : Maybe Distribution
    , uri : String
    }


type Msg
    = LoadIR Decode.Value
    | EvaluateFunction Decode.Value


-- INIT


init : () -> ( Model, Cmd Msg )
init _ =
    ( { distribution = Nothing, uri = "default" }, Cmd.none )


-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        LoadIR jsonValue ->
            case Decode.decodeValue decodeLoadRequest jsonValue of
                Ok ( irJson, uri ) ->
                    case Decode.decodeString DistributionCodec.decodeVersionedDistribution irJson of
                        Ok dist ->
                            ( { model
                                | distribution = Just dist
                                , uri = uri
                              }
                            , loadIRResult (encodeOk (Encode.string uri))
                            )

                        Err err ->
                            ( model
                            , loadIRResult (encodeEvalError "invalid-ir" (Decode.errorToString err))
                            )

                Err err ->
                    ( model
                    , loadIRResult (encodeEvalError "invalid-ir" (Decode.errorToString err))
                    )

        EvaluateFunction jsonValue ->
            case model.distribution of
                Nothing ->
                    ( model
                    , evaluateFunctionResult (encodeEvalError "other" "No IR loaded")
                    )

                Just dist ->
                    case Decode.decodeValue decodeEvalRequest jsonValue of
                        Ok ( fqn, args ) ->
                            let
                                result =
                                    Interpreter.evaluateFunctionValue
                                        SDK.nativeFunctions
                                        dist
                                        fqn
                                        (List.map Just args)
                            in
                            case result of
                                Ok value ->
                                    ( model
                                    , evaluateFunctionResult (encodeOk (encodeRawValue value))
                                    )

                                Err error ->
                                    ( model
                                    , evaluateFunctionResult (encodeError error)
                                    )

                        Err err ->
                            ( model
                            , evaluateFunctionResult (encodeEvalError "argument-error" (Decode.errorToString err))
                            )


-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ loadIR LoadIR
        , evaluateFunction EvaluateFunction
        ]


-- MAIN


main : Program () Model Msg
main =
    Platform.worker
        { init = init
        , update = update
        , subscriptions = subscriptions
        }


-- DECODERS


decodeLoadRequest : Decoder ( String, String )
decodeLoadRequest =
    Decode.map2 Tuple.pair
        (Decode.field "irJson" Decode.string)
        (Decode.field "uri" Decode.string)


decodeEvalRequest : Decoder ( FQName, List Value.RawValue )
decodeEvalRequest =
    Decode.map2 Tuple.pair
        (Decode.field "fqn" decodeFQN)
        (Decode.field "args" (Decode.list decodeRawValue))


decodeFQN : Decoder FQName
decodeFQN =
    Decode.map3
        (\pkg mod name -> ( pkg, mod, name ))
        (Decode.field "packagePath" (Decode.string |> Decode.map parsePath))
        (Decode.field "modulePath" (Decode.string |> Decode.map parsePath))
        (Decode.field "localName" (Decode.string |> Decode.map Name.fromString))


parsePath : String -> List Name.Name
parsePath s =
    s |> String.split "." |> List.map Name.fromString |> Path.fromList


{- Decode a RawValue from JSON. The JS glue converts the flat indexed
   morphir-value into nested JSON matching the Morphir IR value codec format
   before sending it through the port.
-}
decodeRawValue : Decoder Value.RawValue
decodeRawValue =
    Decode.lazy (\_ -> decodeRawValueHelp)


decodeRawValueHelp : Decoder Value.RawValue
decodeRawValueHelp =
    -- Use the existing IR value codec format. The JS glue inflates the
    -- flat indexed morphir-value into this nested JSON structure.
    -- Implementation note: check what Morphir.IR.Value.Codec exposes.
    -- If no standalone decoder exists, build one matching the JSON format
    -- used by the Distribution codec for values.
    Decode.fail "TODO: wire up to existing Value codec or implement"


-- ENCODERS


encodeRawValue : Value.RawValue -> Encode.Value
encodeRawValue value =
    -- Encode to the nested JSON format. The JS glue will flatten this
    -- into the indexed morphir-value representation for WIT.
    -- Implementation note: check what Morphir.IR.Value.Codec exposes.
    Encode.null


encodeFQN : FQName -> Encode.Value
encodeFQN ( pkg, mod, name ) =
    Encode.object
        [ ( "packagePath", Encode.string (pkg |> List.map Name.toTitleCase |> String.join ".") )
        , ( "modulePath", Encode.string (mod |> List.map Name.toTitleCase |> String.join ".") )
        , ( "localName", Encode.string (Name.toCamelCase name) )
        ]


encodeOk : Encode.Value -> Encode.Value
encodeOk value =
    Encode.object
        [ ( "tag", Encode.string "ok" )
        , ( "value", value )
        ]


encodeEvalError : String -> String -> Encode.Value
encodeEvalError variant message =
    Encode.object
        [ ( "tag", Encode.string "err" )
        , ( "variant", Encode.string variant )
        , ( "message", Encode.string message )
        ]


encodeEvalErrorWithFQN : String -> FQName -> Encode.Value
encodeEvalErrorWithFQN variant fqn =
    Encode.object
        [ ( "tag", Encode.string "err" )
        , ( "variant", Encode.string variant )
        , ( "fqn", encodeFQN fqn )
        ]


encodeError : Error -> Encode.Value
encodeError error =
    case error of
        VariableNotFound name ->
            encodeEvalError "variable-not-found" (Name.toCamelCase name)

        ReferenceNotFound fqn ->
            encodeEvalErrorWithFQN "reference-not-found" fqn

        NoArgumentToPassToLambda ->
            encodeEvalError "argument-error" "No argument to pass to lambda"

        LambdaArgumentDidNotMatch _ _ ->
            encodeEvalError "pattern-mismatch" "Lambda argument did not match pattern"

        BindPatternDidNotMatch _ _ ->
            encodeEvalError "pattern-mismatch" "Bind pattern did not match"

        _ ->
            encodeEvalError "other" ("Evaluation error: " ++ errorToString error)


errorToString : Error -> String
errorToString error =
    -- Manual error stringification (Debug.toString won't work in --optimize)
    case error of
        VariableNotFound name ->
            "Variable not found: " ++ Name.toCamelCase name

        ReferenceNotFound ( pkg, mod, name ) ->
            "Reference not found: "
                ++ (pkg |> List.map Name.toTitleCase |> String.join ".")
                ++ ":"
                ++ (mod |> List.map Name.toTitleCase |> String.join ".")
                ++ ":"
                ++ Name.toCamelCase name

        NoArgumentToPassToLambda ->
            "No argument to pass to lambda"

        _ ->
            "Unknown evaluation error"
```

**Important notes for the implementer:**
- The `decodeRawValue` and `encodeRawValue` functions are stubs. Check what `src/Morphir/IR/Value/Codec.elm` exports. If it doesn't exist as a standalone module, look at how `Morphir.IR.Distribution.Codec` handles value encoding/decoding and extract the relevant parts. The JSON format must match what the JS glue produces/consumes.
- The `Error` type has many variants. The `encodeError` function covers the common ones; add cases as needed by reading `src/Morphir/Value/Error.elm`.
- `Debug.toString` is intentionally avoided — it doesn't work with `--optimize`.

**Step 3: Verify it compiles**

Run: `cd packages/morphir-interpreter-wasm && elm make src/Morphir/Interpreter/Worker.elm --output=/dev/null`
Expected: Compiles successfully (fix any import issues)

**Step 4: Commit**

```bash
git add packages/morphir-interpreter-wasm/elm.json packages/morphir-interpreter-wasm/src/
git commit -m "Add Elm Worker entry point for WASM interpreter"
```

---

### Task 4: Create JS glue layer

**Files:**
- Create: `packages/morphir-interpreter-wasm/src/interpreter.js`

The JS file implements the WIT exports by bridging to the compiled Elm module. It handles two key conversions:
1. **`fq-name`** (WIT record) ↔ JSON object (for Elm ports)
2. **`morphir-value`** (WIT flat indexed tree) ↔ nested JSON (for Elm's value codec)

**Step 1: Write interpreter.js**

```js
// Load the compiled Elm module
// After elm make --output build/Morphir.Interpreter.js, the module is available
// ComponentizeJS bundles this at componentize time
import { Elm } from "../build/Morphir.Interpreter.js";

// -- morphir-value conversion utilities --

/**
 * Convert a WIT morphir-value (flat indexed tree) to nested JSON
 * matching Morphir's IR value codec format for Elm consumption.
 */
function morphirValueToJson(morphirValue) {
  const { root, nodes } = morphirValue;

  function inflate(index) {
    const node = nodes[index];
    // node is a WIT variant: { tag: string, val: ... }
    switch (node.tag) {
      case "bool-val":
        return ["literal", [null], ["bool_literal", node.val]];
      case "int-val":
        return ["literal", [null], ["int_literal", Number(node.val)]];
      case "float-val":
        return ["literal", [null], ["float_literal", node.val]];
      case "string-val":
        return ["literal", [null], ["string_literal", node.val]];
      case "decimal-val":
        return ["literal", [null], ["decimal_literal", node.val]];
      case "char-val":
        return ["literal", [null], ["char_literal", node.val]];
      case "list-val":
        return ["list", [null], node.val.map((i) => inflate(i))];
      case "tuple-val":
        return ["tuple", [null], node.val.map((i) => inflate(i))];
      case "record-val":
        return [
          "record",
          [null],
          Object.fromEntries(
            node.val.map((f) => [f.name, inflate(f.value)])
          ),
        ];
      case "constructor-val": {
        const { fqn, args } = node.val;
        const fqnArray = [
          fqn["package-path"].split(".").map((s) => s.split(/(?=[A-Z])/)),
          fqn["module-path"].split(".").map((s) => s.split(/(?=[A-Z])/)),
          fqn["local-name"].split(/(?=[A-Z])/),
        ];
        return [
          "constructor",
          [null],
          fqnArray,
          ...args.map((i) => inflate(i)),
        ];
      }
      case "unit-val":
        return ["unit", [null]];
      default:
        throw new Error(`Unknown morphir-node tag: ${node.tag}`);
    }
  }

  return inflate(root);
}

/**
 * Convert nested Morphir IR value JSON to a WIT morphir-value (flat indexed tree).
 */
function jsonToMorphirValue(json) {
  const nodes = [];

  function flatten(value) {
    const index = nodes.length;
    nodes.push(null); // placeholder

    const tag = value[0];
    let node;

    switch (tag) {
      case "literal": {
        const lit = value[2];
        const [litType, litVal] = lit;
        switch (litType) {
          case "bool_literal":
            node = { tag: "bool-val", val: litVal };
            break;
          case "int_literal":
            node = { tag: "int-val", val: BigInt(litVal) };
            break;
          case "float_literal":
            node = { tag: "float-val", val: litVal };
            break;
          case "string_literal":
            node = { tag: "string-val", val: litVal };
            break;
          case "decimal_literal":
            node = { tag: "decimal-val", val: String(litVal) };
            break;
          case "char_literal":
            node = { tag: "char-val", val: litVal };
            break;
          default:
            throw new Error(`Unknown literal type: ${litType}`);
        }
        break;
      }
      case "list":
        node = { tag: "list-val", val: value[2].map((v) => flatten(v)) };
        break;
      case "tuple":
        node = { tag: "tuple-val", val: value[2].map((v) => flatten(v)) };
        break;
      case "record":
        node = {
          tag: "record-val",
          val: Object.entries(value[2]).map(([name, v]) => ({
            name,
            value: flatten(v),
          })),
        };
        break;
      case "constructor": {
        const fqnArray = value[2];
        const args = value.slice(3).map((v) => flatten(v));
        node = {
          tag: "constructor-val",
          val: {
            fqn: {
              "package-path": fqnArray[0].map((n) => n.join("")).join("."),
              "module-path": fqnArray[1].map((n) => n.join("")).join("."),
              "local-name": fqnArray[2].join(""),
            },
            args,
          },
        };
        break;
      }
      case "unit":
        node = { tag: "unit-val" };
        break;
      default:
        throw new Error(`Unknown value tag: ${tag}`);
    }

    nodes[index] = node;
    return index;
  }

  const root = flatten(json);
  return { root, nodes };
}

/**
 * Convert a WIT fq-name record to the JSON format Elm expects.
 */
function fqNameToJson(fqName) {
  return {
    packagePath: fqName["package-path"],
    modulePath: fqName["module-path"],
    localName: fqName["local-name"],
  };
}

/**
 * Convert Elm JSON fq-name to WIT fq-name record.
 */
function jsonToFqName(json) {
  return {
    "package-path": json.packagePath,
    "module-path": json.modulePath,
    "local-name": json.localName,
  };
}

// -- Elm app management --

function createApp() {
  const app = Elm.Morphir.Interpreter.Worker.init();
  let lastResult = null;

  app.ports.loadIRResult.subscribe((result) => {
    lastResult = result;
  });

  app.ports.evaluateFunctionResult.subscribe((result) => {
    lastResult = result;
  });

  function sendAndReceive(port, data) {
    lastResult = null;
    port.send(data);
    // In ComponentizeJS/SpiderMonkey, port callbacks fire synchronously
    if (lastResult === null) {
      throw new Error("No result received from Elm port");
    }
    return lastResult;
  }

  return { app, sendAndReceive };
}

/**
 * Convert Elm result JSON to WIT result with typed morphir-value and eval-error.
 */
function toWitResult(elmResult) {
  if (elmResult.tag === "ok") {
    return { tag: "ok", val: jsonToMorphirValue(elmResult.value) };
  } else {
    return { tag: "err", val: toWitEvalError(elmResult) };
  }
}

function toWitEvalError(elmError) {
  const variant = elmError.variant || "other";
  if (elmError.fqn) {
    return { tag: variant, val: jsonToFqName(elmError.fqn) };
  }
  return { tag: variant, val: elmError.message || "Unknown error" };
}

// -- WIT: eval interface --

export const eval_ = {
  evaluate(irJson, fqName, args) {
    const { app, sendAndReceive } = createApp();
    // Load IR
    const loadResult = sendAndReceive(app.ports.loadIR, {
      irJson,
      uri: "one-shot",
    });
    if (loadResult.tag !== "ok") {
      return { tag: "err", val: toWitEvalError(loadResult) };
    }
    // Convert typed args to JSON for Elm
    const jsonArgs = args.map((a) => morphirValueToJson(a));
    // Evaluate
    const evalResult = sendAndReceive(app.ports.evaluateFunction, {
      fqn: fqNameToJson(fqName),
      args: jsonArgs,
    });
    return toWitResult(evalResult);
  },
};

// -- WIT: types interface (ir-store resource) --

let storeCounter = 0;

export const types = {
  IrStore: class IrStore {
    #app;
    #sendAndReceive;
    #uri;

    constructor(irJson, uri) {
      const { app, sendAndReceive } = createApp();
      this.#app = app;
      this.#sendAndReceive = sendAndReceive;
      this.#uri = uri ?? `store-${++storeCounter}`;

      const result = sendAndReceive(app.ports.loadIR, {
        irJson,
        uri: this.#uri,
      });
      if (result.tag !== "ok") {
        throw new Error(result.message || "Failed to load IR");
      }
    }

    uri() {
      return this.#uri;
    }

    evaluate(fqName, args) {
      const jsonArgs = args.map((a) => morphirValueToJson(a));
      const result = this.#sendAndReceive(this.#app.ports.evaluateFunction, {
        fqn: fqNameToJson(fqName),
        args: jsonArgs,
      });
      return toWitResult(result);
    }

    reload(irJson) {
      const result = this.#sendAndReceive(this.#app.ports.loadIR, {
        irJson,
        uri: this.#uri,
      });
      if (result.tag !== "ok") {
        return { tag: "err", val: toWitEvalError(result) };
      }
      return { tag: "ok" };
    }
  },
};
```

**Important notes for the implementer:**
- The Morphir IR JSON value format (`["literal", [null], ["int_literal", 2]]`, etc.) must be verified against the actual codec. Check `src/Morphir/IR/Value/Codec.elm` and `src/Morphir/IR/Literal/Codec.elm`. The conversion functions may need adjustment to match the real format.
- The `eval` export name is a JS reserved word. `jco` may require `eval_` or handle the mapping automatically. Check `jco componentize` docs for how it maps WIT interface names to JS exports.
- The synchronous port communication assumption needs validation in Task 6. If Elm ports don't fire synchronously in SpiderMonkey, use `async`/`await` with ComponentizeJS `--async` flag.
- The `import` path `../build/Morphir.Interpreter.js` is resolved at componentize time, not runtime.

**Step 2: Commit**

```bash
git add packages/morphir-interpreter-wasm/src/interpreter.js
git commit -m "Add JS glue layer with morphir-value conversion"
```

---

### Task 5: Create mise build tasks

**Files:**
- Create: `.mise/tasks/build/interpreter-elm.ts`
- Create: `.mise/tasks/build/interpreter-wasm.ts`
- Create: `.mise/tasks/build/interpreter-browser.ts`

**Step 1: Create interpreter-elm build task**

```typescript
#!/usr/bin/env bun
//MISE description="Compile Elm interpreter worker to JS"

import { elmMake, mkdir, PATHS } from "../_lib.ts";
import { join } from "path";

const PKG = join(PATHS.root, "packages", "morphir-interpreter-wasm");

await mkdir(join(PKG, "build"));
await elmMake(
  ["src/Morphir/Interpreter/Worker.elm", "--optimize", "--output", "build/Morphir.Interpreter.js"],
  { cwd: PKG }
);
```

**Step 2: Create interpreter-wasm build task**

```typescript
#!/usr/bin/env bun
//MISE description="Build WASM component from JS + Elm"
//MISE depends=["build:interpreter-elm"]

import { exec } from "../_lib.ts";
import { join } from "path";

const PKG = join(import.meta.dir, "../../..", "packages", "morphir-interpreter-wasm");

await exec("npx", [
  "jco", "componentize",
  join(PKG, "src", "interpreter.js"),
  "--wit", join(PKG, "wit"),
  "--world-name", "interpreter",
  "--output", join(PKG, "build", "interpreter.wasm"),
]);
```

**Step 3: Create interpreter-browser build task**

```typescript
#!/usr/bin/env bun
//MISE description="Transpile WASM component to browser ESM"
//MISE depends=["build:interpreter-wasm"]

import { exec, mkdir } from "../_lib.ts";
import { join } from "path";

const PKG = join(import.meta.dir, "../../..", "packages", "morphir-interpreter-wasm");

await mkdir(join(PKG, "build", "browser"));
await exec("npx", [
  "jco", "transpile",
  join(PKG, "build", "interpreter.wasm"),
  "--out-dir", join(PKG, "build", "browser"),
]);
```

**Step 4: Make tasks executable**

Run: `chmod +x .mise/tasks/build/interpreter-elm.ts .mise/tasks/build/interpreter-wasm.ts .mise/tasks/build/interpreter-browser.ts`

**Step 5: Verify Elm build task works**

Run: `mise run build:interpreter-elm`
Expected: `build/Morphir.Interpreter.js` is created in `packages/morphir-interpreter-wasm/`

**Step 6: Commit**

```bash
git add .mise/tasks/build/interpreter-elm.ts .mise/tasks/build/interpreter-wasm.ts .mise/tasks/build/interpreter-browser.ts
git commit -m "Add mise build tasks for WASM interpreter"
```

---

### Task 6: Build and validate the WASM component

This is the integration point. Things will likely need adjustment.

**Step 1: Run the full WASM build**

Run: `mise run build:interpreter-wasm`

Expected: `packages/morphir-interpreter-wasm/build/interpreter.wasm` is created.

**If it fails:** Common issues:
- **Import resolution**: `jco componentize` needs to find the Elm JS output. The import path in `interpreter.js` may need adjustment. Try absolute paths or `--source-map` options.
- **Elm port sync**: If ports don't fire synchronously, restructure `interpreter.js` to use promises. ComponentizeJS supports `async` exports with `--async` flag.
- **Module format**: Elm's compiled output may not be ESM-compatible. You may need to wrap it or use a different import strategy (e.g., `eval` the file content and extract the `Elm` object).
- **SpiderMonkey compat**: Some Elm runtime JS may use Node-specific APIs. Check error messages.

**Step 2: Run the browser build**

Run: `mise run build:interpreter-browser`

Expected: `packages/morphir-interpreter-wasm/build/browser/` contains ESM files.

**Step 3: Inspect the component**

Run: `npx jco inspect packages/morphir-interpreter-wasm/build/interpreter.wasm`

Expected: Shows exported `eval` and `types` interfaces with `fq-name`, `morphir-value`, `morphir-node`, `eval-error` types.

**Step 4: Commit any fixes**

```bash
git add -A packages/morphir-interpreter-wasm/
git commit -m "Get WASM component building successfully"
```

---

### Task 7: Create test fixture

**Files:**
- Create: `packages/morphir-interpreter-wasm/test/fixtures/morphir.json`
- Create: `packages/morphir-interpreter-wasm/test/fixtures/src/TestModel/Basic.elm`
- Generate: `packages/morphir-interpreter-wasm/test/fixtures/morphir-ir.json`

**Step 1: Create a minimal Morphir project**

`morphir.json`:
```json
{
    "name": "TestModel",
    "sourceDirectory": "src",
    "exposedModules": ["TestModel.Basic"]
}
```

`src/TestModel/Basic.elm`:
```elm
module TestModel.Basic exposing (..)

addInts : Int -> Int -> Int
addInts a b =
    a + b

identity : a -> a
identity x =
    x

isPositive : Int -> Bool
isPositive n =
    n > 0
```

**Step 2: Compile the test fixture IR**

Run from repo root:
```bash
node packages/cli/morphir-elm-make.js -p packages/morphir-interpreter-wasm/test/fixtures -o packages/morphir-interpreter-wasm/test/fixtures/morphir-ir.json
```

Expected: `morphir-ir.json` is generated

**Step 3: Commit fixture (including the generated morphir-ir.json)**

```bash
git add packages/morphir-interpreter-wasm/test/fixtures/
git commit -m "Add test fixture for WASM interpreter integration tests"
```

---

### Task 8: Write integration tests

**Files:**
- Create: `packages/morphir-interpreter-wasm/test/interpreter.test.js`

Tests use the WIT typed values — no JSON strings in the test API.

**Step 1: Write tests**

```js
import { describe, test, expect, beforeAll } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

// Import from the jco-transpiled browser output for testing
const componentPath = join(import.meta.dir, "../build/browser/interpreter.js");

// -- Test helpers for building morphir-values --

function intVal(n) {
  return { root: 0, nodes: [{ tag: "int-val", val: BigInt(n) }] };
}

function boolVal(b) {
  return { root: 0, nodes: [{ tag: "bool-val", val: b }] };
}

function stringVal(s) {
  return { root: 0, nodes: [{ tag: "string-val", val: s }] };
}

function fqn(pkg, mod, name) {
  return {
    "package-path": pkg,
    "module-path": mod,
    "local-name": name,
  };
}

// -- Tests --

describe("morphir interpreter wasm component", () => {
  let component;
  let fixtureIR;

  beforeAll(async () => {
    component = await import(componentPath);
    fixtureIR = readFileSync(
      join(import.meta.dir, "fixtures/morphir-ir.json"),
      "utf-8"
    );
  });

  describe("eval.evaluate (one-shot)", () => {
    test("evaluates addInts(2, 3) = 5", () => {
      const result = component.eval.evaluate(
        fixtureIR,
        fqn("TestModel", "Basic", "addInts"),
        [intVal(2), intVal(3)]
      );
      expect(result.tag).toBe("ok");
      const resultNode = result.val.nodes[result.val.root];
      expect(resultNode.tag).toBe("int-val");
      expect(resultNode.val).toBe(5n);
    });

    test("evaluates isPositive(42) = true", () => {
      const result = component.eval.evaluate(
        fixtureIR,
        fqn("TestModel", "Basic", "isPositive"),
        [intVal(42)]
      );
      expect(result.tag).toBe("ok");
      const resultNode = result.val.nodes[result.val.root];
      expect(resultNode.tag).toBe("bool-val");
      expect(resultNode.val).toBe(true);
    });

    test("evaluates isPositive(-1) = false", () => {
      const result = component.eval.evaluate(
        fixtureIR,
        fqn("TestModel", "Basic", "isPositive"),
        [intVal(-1)]
      );
      expect(result.tag).toBe("ok");
      const resultNode = result.val.nodes[result.val.root];
      expect(resultNode.tag).toBe("bool-val");
      expect(resultNode.val).toBe(false);
    });

    test("returns reference-not-found for unknown function", () => {
      const result = component.eval.evaluate(
        fixtureIR,
        fqn("TestModel", "Basic", "nonExistent"),
        []
      );
      expect(result.tag).toBe("err");
      expect(result.val.tag).toBe("reference-not-found");
    });

    test("returns invalid-ir for bad JSON", () => {
      const result = component.eval.evaluate(
        "not valid json",
        fqn("TestModel", "Basic", "addInts"),
        []
      );
      expect(result.tag).toBe("err");
      expect(result.val.tag).toBe("invalid-ir");
    });
  });

  describe("types.IrStore (stateful)", () => {
    test("creates store with explicit URI and evaluates", () => {
      const store = new component.types.IrStore(fixtureIR, "test-model");
      expect(store.uri()).toBe("test-model");

      const result = store.evaluate(
        fqn("TestModel", "Basic", "addInts"),
        [intVal(10), intVal(20)]
      );
      expect(result.tag).toBe("ok");
      const resultNode = result.val.nodes[result.val.root];
      expect(resultNode.tag).toBe("int-val");
      expect(resultNode.val).toBe(30n);
    });

    test("creates store with default URI", () => {
      const store = new component.types.IrStore(fixtureIR, undefined);
      expect(store.uri()).toBeTruthy();
      expect(typeof store.uri()).toBe("string");
    });

    test("reload replaces IR and still works", () => {
      const store = new component.types.IrStore(fixtureIR, "reloadable");
      const reloadResult = store.reload(fixtureIR);
      expect(reloadResult.tag).toBe("ok");

      const result = store.evaluate(
        fqn("TestModel", "Basic", "addInts"),
        [intVal(1), intVal(1)]
      );
      expect(result.tag).toBe("ok");
    });

    test("evaluates multiple times with same store", () => {
      const store = new component.types.IrStore(fixtureIR, null);
      for (let i = 0; i < 5; i++) {
        const result = store.evaluate(
          fqn("TestModel", "Basic", "addInts"),
          [intVal(i), intVal(1)]
        );
        expect(result.tag).toBe("ok");
        const resultNode = result.val.nodes[result.val.root];
        expect(resultNode.tag).toBe("int-val");
        expect(resultNode.val).toBe(BigInt(i + 1));
      }
    });

    test("returns error for invalid IR on reload", () => {
      const store = new component.types.IrStore(fixtureIR, "bad-reload");
      const result = store.reload("garbage json");
      expect(result.tag).toBe("err");
      expect(result.val.tag).toBe("invalid-ir");
    });
  });
});
```

**Important notes for the implementer:**
- The exact WIT variant JS representation (`{ tag: "int-val", val: 5n }`) depends on how `jco transpile` maps WIT types to JS. Check the generated typings. BigInt (`5n`) is used for `s64`.
- The `fq-name` field names in JS may be camelCased by `jco` (e.g., `packagePath` instead of `package-path`). Check the generated bindings and adjust helpers.
- If the component exports use `eval_` instead of `eval`, adjust the test imports.

**Step 2: Run tests**

Run: `cd packages/morphir-interpreter-wasm && bun test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add packages/morphir-interpreter-wasm/test/
git commit -m "Add integration tests for WASM interpreter component"
```

---

### Task 9: Add test mise task

**Files:**
- Create: `.mise/tasks/test/interpreter-wasm.ts`

**Step 1: Create test task**

```typescript
#!/usr/bin/env bun
//MISE description="Run WASM interpreter integration tests"
//MISE depends=["build:interpreter-browser"]

import { exec } from "../_lib.ts";
import { join } from "path";

const PKG = join(import.meta.dir, "../../..", "packages", "morphir-interpreter-wasm");

await exec("bun", ["test"], { cwd: PKG });
```

**Step 2: Make executable**

Run: `chmod +x .mise/tasks/test/interpreter-wasm.ts`

**Step 3: Verify**

Run: `mise run test:interpreter-wasm`
Expected: Tests pass

**Step 4: Commit**

```bash
git add .mise/tasks/test/interpreter-wasm.ts
git commit -m "Add mise task for WASM interpreter tests"
```

---

### Task 10: Final validation and cleanup

**Step 1: Run full build from clean state**

```bash
mise run build:interpreter-elm
mise run build:interpreter-wasm
mise run build:interpreter-browser
```

All three should succeed.

**Step 2: Run tests**

Run: `mise run test:interpreter-wasm`
Expected: All tests pass

**Step 3: Inspect the WASM component**

Run: `npx jco inspect packages/morphir-interpreter-wasm/build/interpreter.wasm`
Expected: Shows `morphir:interpreter/eval` and `morphir:interpreter/types` exports with typed `morphir-value`, `fq-name`, and `eval-error`.

**Step 4: Verify existing project tests still pass**

Run: `mise run test:unit`
Expected: All 864 Elm tests still pass (no regression)

**Step 5: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "Final cleanup for WASM interpreter component"
```
