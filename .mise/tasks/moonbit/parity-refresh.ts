#!/usr/bin/env bun
//MISE description="Regenerate the Elm parity data with the pinned morphir-elm 2.100.0"
//MISE depends=["moonbit:deps"]

import { moon } from "./_moon.ts";

await moon(["run", "scripts/elm-parity-refresh.mbtx"]);
