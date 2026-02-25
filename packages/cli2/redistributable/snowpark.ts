/**
 * Snowpark redistributable files embedded as strings.
 * These are written to disk during snowpark-gen code generation.
 */
export const files: Record<string, string> = {
  "decorations/elm.json": `{
    "type": "application",
    "source-directories": [
        "src"
    ],
    "elm-version": "0.19.1",
    "dependencies": {
        "direct": {
            "elm/browser": "1.0.2",
            "elm/core": "1.0.5",
            "elm/html": "1.0.0"
        },
        "indirect": {
            "elm/json": "1.1.3",
            "elm/time": "1.0.0",
            "elm/url": "1.0.0",
            "elm/virtual-dom": "1.0.3"
        }
    },
    "test-dependencies": {
        "direct": {},
        "indirect": {}
    }
}
`,
  "decorations/morphir.json": `{
    "name": "SnowparkGenCustomization",
    "sourceDirectory": "src"
}
`,
  "decorations/src/SnowparkGenCustomization/Decorations.elm": `module SnowparkGenCustomization.Decorations exposing (..)

type GenerationCustomization =
   InlineElement
   | CacheResult
`,
};
