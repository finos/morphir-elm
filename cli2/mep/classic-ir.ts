// Converts the classic IR (format 3) that the Elm worker writes to Morphir IR 4.0.0 JSON. The conversion is
// finos/morphir-ir's own migration, built from moonbit/classic-ir to JavaScript and committed in generated/.
import { classic_to_v4 } from "./generated/classic-ir.js";

const ERROR_PREFIX = "error: ";

/** The v4 JSON text of classic IR. Throws when the migration refuses the IR. */
export function classicToV4(ir: unknown): string {
  const answer = classic_to_v4(JSON.stringify(ir));
  if (answer.startsWith(ERROR_PREFIX)) {
    throw new Error(`classic IR conversion failed: ${answer.slice(ERROR_PREFIX.length)}`);
  }
  return answer;
}
