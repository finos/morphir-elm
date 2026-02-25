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
 * is currently broken (missing dependent modules). Uses a computed
 * import path so the bundler doesn't try to resolve it at compile time.
 */
export async function getGeneratorWorker() {
  const modulePath = [".", "Morphir.Elm.Generator.cjs"].join("/");
  // @ts-ignore — Elm-compiled CJS module, dynamic path
  const ElmGenerator = await import(modulePath);
  return (ElmGenerator.default ?? ElmGenerator).Elm.Morphir.Elm.Generator.init();
}
