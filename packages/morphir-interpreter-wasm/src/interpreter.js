/**
 * Extism plugin glue for the Morphir WASM interpreter.
 *
 * JSON in:  Host.inputString()  -> { ir, fqn, args }
 * JSON out: Host.outputString() <- { ok, value } | { ok: false, error: { variant, message } }
 *
 * Expects Elm to be in scope (Elm.Morphir.Interpreter.Worker) from the bundle.
 */

const FQN_SEP = ":";

/**
 * Parse "package-path:module-path:localName" into { packagePath, modulePath, localName }.
 */
function fqNameStringToWorkerJson(fqnString) {
  const parts = fqnString.split(FQN_SEP);
  return {
    packagePath: parts[0] ?? "",
    modulePath: parts[1] ?? "",
    localName: parts[2] ?? "",
  };
}

/**
 * Create an Elm Worker app and return a function that sends one evaluate
 * payload and synchronously receives one evaluateResult.
 */
function createApp() {
  const app = Elm.Morphir.Interpreter.Worker.init();
  let pending = null;

  app.ports.evaluateResult.subscribe((result) => {
    if (pending) {
      pending(result);
      pending = null;
    }
  });

  function sendEvaluate(payload) {
    let result = null;
    pending = (v) => { result = v; };
    app.ports.evaluate.send(payload);
    if (result === null) {
      pending = null;
      throw new Error("Elm Worker did not respond synchronously on evaluateResult");
    }
    return result;
  }

  return { app, sendEvaluate };
}

/**
 * Run evaluation: single port call with { irJson, fqn, args }, return Elm result object.
 * ir: morphir IR as JSON (object or string)
 * fqn: "Package:Module:localName"
 * args: array of ValueCodec-encoded argument values (JSON)
 * Returns: { ok: true, value } or { ok: false, error: { variant, message } }
 */
function runEval(ir, fqn, args) {
  ensureElm();
  const { sendEvaluate } = createApp();
  const irData = typeof ir === "string" ? JSON.parse(ir) : ir;
  return sendEvaluate({
    irJson: irData,
    fqn: fqNameStringToWorkerJson(fqn),
    args,
  });
}

/**
 * Extism plugin export: read JSON input, run eval, write JSON output.
 * Exported as "evaluate" because "eval" is a reserved word in strict mode.
 */
function evaluate() {
  try {
    const inputJson = Host.inputString();
    const { ir, fqn, args } = JSON.parse(inputJson);
    if (ir == null || fqn == null || !Array.isArray(args)) {
      Host.outputString(
        JSON.stringify({
          ok: false,
          error: {
            variant: "argument-error",
            message: "Input must be { ir, fqn, args } with args an array",
          },
        })
      );
      return;
    }
    const result = runEval(ir, fqn, args);
    Host.outputString(JSON.stringify(result));
  } catch (e) {
    Host.outputString(
      JSON.stringify({
        ok: false,
        error: { variant: "other", message: e.message || String(e) },
      })
    );
  }
}

module.exports = { evaluate };
