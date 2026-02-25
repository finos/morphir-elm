/**
 * JS glue layer for the Morphir WASM interpreter component.
 *
 * Bridges WIT exports to the Elm Worker that runs the actual Morphir interpreter.
 * Handles conversion between WIT's flat indexed morphir-value and the nested
 * JSON format that the Elm Value codec uses.
 */

import { Elm } from "../build/Morphir.Interpreter.js";

// ---------------------------------------------------------------------------
// FQName conversion
// ---------------------------------------------------------------------------

/**
 * Convert a WIT fq-name record to the JSON format the Elm Worker's
 * decodeFQNameFromJson expects: { packagePath, modulePath, localName } with
 * dot-separated string paths.
 *
 * Note: the Worker's decodeFQNameFromJson uses Path.fromString / Name.fromString,
 * which accept dot-separated strings — this is NOT the same as the IR codec's
 * FQName encoding (which is nested arrays). The Worker has its own simpler format.
 */
function fqNameToWorkerJson(fqName) {
  return {
    packagePath: fqName.packagePath,
    modulePath: fqName.modulePath,
    localName: fqName.localName,
  };
}

/**
 * Convert a WIT fq-name record to the Elm IR codec FQName JSON format:
 * [packagePath, modulePath, localName] where packagePath and modulePath are
 * arrays of Names (arrays of strings), and localName is a Name (array of strings).
 *
 * WIT gives us dot-separated strings, so we split on dots and wrap each segment
 * as a single-element Name (the Elm Name.fromString splits on camelCase boundaries,
 * but for our purposes we pass the raw segments).
 */
function fqNameToCodecJson(fqName) {
  const pkgParts = fqName.packagePath
    ? fqName.packagePath.split(".").map((s) => [s])
    : [];
  const modParts = fqName.modulePath
    ? fqName.modulePath.split(".").map((s) => [s])
    : [];
  const localParts = fqName.localName ? [fqName.localName] : [];
  return [pkgParts, modParts, localParts];
}

/**
 * Convert Elm IR codec FQName JSON [packagePath, modulePath, localName]
 * back to a WIT fq-name record with dot-separated strings.
 *
 * packagePath: [[seg1parts], [seg2parts], ...] -> join each name's parts with
 * camelCase, then join segments with dots.
 */
function codecJsonToFqName(json) {
  // json = [path, path, name]
  // path = list of names, name = list of strings
  const pathToString = (path) =>
    path.map((name) => name.join("")).join(".");
  return {
    packagePath: pathToString(json[0]),
    modulePath: pathToString(json[1]),
    localName: json[2].join(""),
  };
}

// ---------------------------------------------------------------------------
// morphir-value <-> JSON conversion
//
// WIT morphir-value is a flat indexed tree:
//   { root: u32, nodes: list<morphir-node> }
//
// Elm expects nested JSON via ValueCodec.decodeValue with unit attributes ([]):
//   ["Literal", [], ["BoolLiteral", true]]
//   ["List", [], [item1, item2, ...]]
//   ["Tuple", [], [elem1, elem2, ...]]
//   ["Record", [], [[name, value], ...]]
//   ["Constructor", [], [pkgPath, modPath, localName]]
//   ["Unit", []]
// ---------------------------------------------------------------------------

const UNIT_ATTR = [];

/**
 * Convert a WIT flat indexed morphir-value to nested Elm IR JSON.
 */
function morphirValueToJson(morphirValue) {
  const { root, nodes } = morphirValue;

  function convert(index) {
    const node = nodes[index];
    const tag = node.tag;
    const val = node.val;

    switch (tag) {
      case "bool-val":
        return ["Literal", UNIT_ATTR, ["BoolLiteral", val]];

      case "int-val":
        // WIT s64 comes as bigint in JS; Elm expects a JSON number
        return [
          "Literal",
          UNIT_ATTR,
          ["WholeNumberLiteral", typeof val === "bigint" ? Number(val) : val],
        ];

      case "float-val":
        return ["Literal", UNIT_ATTR, ["FloatLiteral", val]];

      case "string-val":
        return ["Literal", UNIT_ATTR, ["StringLiteral", val]];

      case "decimal-val":
        return ["Literal", UNIT_ATTR, ["DecimalLiteral", val]];

      case "char-val":
        return ["Literal", UNIT_ATTR, ["CharLiteral", val]];

      case "list-val":
        return ["List", UNIT_ATTR, val.map(convert)];

      case "tuple-val":
        return ["Tuple", UNIT_ATTR, val.map(convert)];

      case "record-val":
        return [
          "Record",
          UNIT_ATTR,
          val.map((field) => [[field.name], convert(field.value)]),
        ];

      case "constructor-val":
        return [
          "Constructor",
          UNIT_ATTR,
          fqNameToCodecJson(val.fqn),
        ];

      case "unit-val":
        return ["Unit", UNIT_ATTR];

      default:
        throw new Error(`Unknown morphir-node tag: ${tag}`);
    }
  }

  return convert(root);
}

/**
 * Convert nested Elm IR JSON (from ValueCodec.encodeValue) to WIT flat indexed
 * morphir-value. Traverses the nested JSON, assigning indices to each node.
 */
function jsonToMorphirValue(json) {
  const nodes = [];

  function convert(value) {
    const kind = value[0];
    // value[1] is the attributes (ignored — unit for RawValue)

    switch (kind) {
      case "Literal": {
        const literal = value[2];
        const litKind = literal[0];
        const litVal = literal[1];
        let node;
        switch (litKind) {
          case "BoolLiteral":
            node = { tag: "bool-val", val: litVal };
            break;
          case "WholeNumberLiteral":
            node = { tag: "int-val", val: BigInt(litVal) };
            break;
          case "FloatLiteral":
            node = { tag: "float-val", val: litVal };
            break;
          case "StringLiteral":
            node = { tag: "string-val", val: litVal };
            break;
          case "DecimalLiteral":
            node = { tag: "decimal-val", val: litVal };
            break;
          case "CharLiteral":
            node = { tag: "char-val", val: litVal };
            break;
          default:
            throw new Error(`Unknown literal kind: ${litKind}`);
        }
        const idx = nodes.length;
        nodes.push(node);
        return idx;
      }

      case "List": {
        const items = value[2];
        const childIndices = items.map(convert);
        const idx = nodes.length;
        nodes.push({ tag: "list-val", val: childIndices });
        return idx;
      }

      case "Tuple": {
        const elements = value[2];
        const childIndices = elements.map(convert);
        const idx = nodes.length;
        nodes.push({ tag: "tuple-val", val: childIndices });
        return idx;
      }

      case "Record": {
        const fields = value[2];
        // Each field is [name, value] where name is a Name (array of strings)
        const fieldRefs = fields.map((field) => {
          const fieldName = field[0];
          const fieldValue = field[1];
          const valueIdx = convert(fieldValue);
          return { name: fieldName.join(""), value: valueIdx };
        });
        const idx = nodes.length;
        nodes.push({ tag: "record-val", val: fieldRefs });
        return idx;
      }

      case "Constructor": {
        const fqNameJson = value[2];
        const fqn = codecJsonToFqName(fqNameJson);
        // Constructor args would come from Apply nodes wrapping this,
        // but the raw encoded form is just the constructor reference.
        // In the flat representation we store it with empty args.
        const idx = nodes.length;
        nodes.push({
          tag: "constructor-val",
          val: { fqn, args: [] },
        });
        return idx;
      }

      case "Unit": {
        const idx = nodes.length;
        nodes.push({ tag: "unit-val", val: undefined });
        return idx;
      }

      case "Apply": {
        // Apply nodes are used for constructor application in Morphir IR.
        // ["Apply", attrs, function, argument]
        // We need to unwrap nested Apply(Apply(Constructor, arg1), arg2) into
        // a single constructor-val with collected args.
        return convertApply(value);
      }

      default:
        // For other value types (Variable, Reference, Field, Lambda, etc.)
        // that shouldn't appear in evaluation results, throw an error.
        throw new Error(
          `Unsupported value kind for WIT conversion: ${kind}`
        );
    }
  }

  /**
   * Unwrap nested Apply nodes that represent constructor application.
   * Pattern: Apply(Apply(Constructor(fqn), arg1), arg2) -> constructor-val(fqn, [arg1, arg2])
   * If the function is not a constructor, we fall back to a generic handling.
   */
  function convertApply(applyNode) {
    const args = [];
    let current = applyNode;

    // Walk down the Apply chain collecting arguments right-to-left
    while (current[0] === "Apply") {
      args.unshift(current[3]); // argument is index 3
      current = current[2]; // function is index 2
    }

    if (current[0] === "Constructor") {
      const fqNameJson = current[2];
      const fqn = codecJsonToFqName(fqNameJson);
      const argIndices = args.map(convert);
      const idx = nodes.length;
      nodes.push({
        tag: "constructor-val",
        val: { fqn, args: argIndices },
      });
      return idx;
    }

    // If it's not constructor application, this is an unsupported pattern
    // for WIT value conversion (lambdas, partial application, etc.)
    throw new Error(
      `Unsupported Apply target for WIT conversion: ${current[0]}`
    );
  }

  const root = convert(json);
  return { root, nodes };
}

// ---------------------------------------------------------------------------
// Elm app management
// ---------------------------------------------------------------------------

/**
 * Create an Elm Worker app and return helpers for synchronous port communication.
 */
function createApp() {
  const app = Elm.Morphir.Interpreter.Worker.init();

  // Pending response holders keyed by port name
  const pending = {};

  // Subscribe to outbound ports
  app.ports.loadIRResult.subscribe((result) => {
    if (pending.loadIR) {
      pending.loadIR.resolve(result);
      pending.loadIR = null;
    }
  });

  app.ports.evaluateFunctionResult.subscribe((result) => {
    if (pending.evaluateFunction) {
      pending.evaluateFunction.resolve(result);
      pending.evaluateFunction = null;
    }
  });

  /**
   * Send data to an Elm inbound port and synchronously wait for the result
   * on the corresponding outbound port.
   *
   * In a WASM component context, Elm processes messages synchronously within
   * the same microtask when we send through a port, so the subscription
   * callback fires before we return.
   */
  function sendAndReceive(portName, data) {
    let result = null;
    pending[portName] = {
      resolve: (value) => {
        result = value;
      },
    };
    app.ports[portName].send(data);

    if (result === null) {
      throw new Error(
        `Elm Worker did not respond synchronously on port: ${portName}`
      );
    }
    return result;
  }

  return { app, sendAndReceive };
}

// ---------------------------------------------------------------------------
// Result / error conversion
// ---------------------------------------------------------------------------

/**
 * Convert the Elm Worker's result JSON to a WIT result.
 *
 * Elm sends: { ok: true, value: <encoded RawValue> }
 *       or:  { ok: false, error: { variant: "...", message: "..." } }
 *
 * WIT expects: result<morphir-value, eval-error>
 *   ok -> { tag: "ok", val: morphirValue }
 *   err -> { tag: "err", val: { tag: variant, val: ... } }
 */
function elmResultToWitResult(elmResult) {
  if (elmResult.ok) {
    return { tag: "ok", val: jsonToMorphirValue(elmResult.value) };
  }

  const { variant, message } = elmResult.error;
  let evalError;

  switch (variant) {
    case "reference-not-found":
      // The message is a string representation; we need a fq-name.
      // Since the Elm side only gives us a string message, we pass it
      // as a simple fq-name with the message as the local-name.
      evalError = {
        tag: "reference-not-found",
        val: { packagePath: "", modulePath: "", localName: message },
      };
      break;
    case "variable-not-found":
      evalError = { tag: "variable-not-found", val: message };
      break;
    case "argument-error":
      evalError = { tag: "argument-error", val: message };
      break;
    case "pattern-mismatch":
      evalError = { tag: "pattern-mismatch", val: message };
      break;
    case "type-error":
      evalError = { tag: "type-error", val: message };
      break;
    case "invalid-ir":
      evalError = { tag: "invalid-ir", val: message };
      break;
    default:
      evalError = { tag: "other", val: message };
      break;
  }

  return { tag: "err", val: evalError };
}

// ---------------------------------------------------------------------------
// WIT exports: eval interface
// ---------------------------------------------------------------------------

/**
 * Stateless evaluate: parse IR, evaluate a function, return result.
 * WIT signature: evaluate(ir-json: string, fqn: fq-name, args: list<morphir-value>)
 *                  -> result<morphir-value, eval-error>
 */
export const eval_ = {
  evaluate(irJson, fqn, args) {
    const { sendAndReceive } = createApp();

    // Load the IR
    const irData = JSON.parse(irJson);
    const loadResult = sendAndReceive("loadIR", { irJson: irData });
    if (!loadResult.ok) {
      return {
        tag: "err",
        val: { tag: "invalid-ir", val: loadResult.error.message },
      };
    }

    // Convert args from WIT morphir-value to Elm JSON
    const argsJson = args.map(morphirValueToJson);

    // Evaluate
    const evalResult = sendAndReceive("evaluateFunction", {
      fqn: fqNameToWorkerJson(fqn),
      args: argsJson,
    });

    return elmResultToWitResult(evalResult);
  },
};

// ---------------------------------------------------------------------------
// WIT exports: types interface (IrStore resource)
// ---------------------------------------------------------------------------

export const types = {
  IrStore: class IrStore {
    #app;
    #sendAndReceive;
    #uri;

    /**
     * constructor(ir-json: string, uri: option<string>)
     */
    constructor(irJson, uri) {
      const { sendAndReceive } = createApp();
      this.#sendAndReceive = sendAndReceive;
      this.#uri = uri ?? "memory://anonymous";

      // Load the IR
      const irData = JSON.parse(irJson);
      const result = sendAndReceive("loadIR", { irJson: irData });
      if (!result.ok) {
        throw new Error(`Failed to load IR: ${result.error.message}`);
      }
    }

    /**
     * uri() -> string
     */
    uri() {
      return this.#uri;
    }

    /**
     * evaluate(fqn: fq-name, args: list<morphir-value>)
     *   -> result<morphir-value, eval-error>
     */
    evaluate(fqn, args) {
      const argsJson = args.map(morphirValueToJson);

      const result = this.#sendAndReceive("evaluateFunction", {
        fqn: fqNameToWorkerJson(fqn),
        args: argsJson,
      });

      return elmResultToWitResult(result);
    }

    /**
     * reload(ir-json: string) -> result<_, eval-error>
     */
    reload(irJson) {
      const irData = JSON.parse(irJson);
      const result = this.#sendAndReceive("loadIR", { irJson: irData });

      if (result.ok) {
        return { tag: "ok", val: undefined };
      }

      return {
        tag: "err",
        val: { tag: "invalid-ir", val: result.error.message },
      };
    }
  },
};
