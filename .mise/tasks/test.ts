#!/usr/bin/env bun
//MISE description="Run all tests"
//MISE depends=["test:unit", "test:integration"]

import { log } from "./_lib.ts";

// Note: test:morphir-ir is commented out in the original gulpfile
// Add it to depends array when ready to enable

log("test", "All tests completed");
