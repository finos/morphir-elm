/**
 * Centralized Elm worker module.
 *
 * Bun can import CommonJS modules natively — no createRequire needed.
 * This gives the bundler a static import it can resolve at compile time,
 * which is required for bun build --compile to work.
 */

// @ts-ignore — Elm-compiled CJS module, no type declarations
import ElmCLI from "./Morphir.Elm.CLI.cjs";

export const worker = ElmCLI.Elm.Morphir.Elm.CLI.init();

/**
 * Generator worker — loaded lazily because Generator.elm compilation
 * is currently broken (missing dependent modules).
 */
export async function getGeneratorWorker() {
  // @ts-ignore — Elm-compiled CJS module
  const ElmGenerator = await import("./Morphir.Elm.Generator.cjs");
  return ElmGenerator.default.Elm.Morphir.Elm.Generator.init();
}
