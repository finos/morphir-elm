#!/usr/bin/env bun
//MISE description="Run all tests"
//MISE depends=["test:unit", "test:integration"]

import { log } from "./_lib.ts";

// Note: test:morphir-ir is not yet included in the default test suite
// Add it to depends array when ready to enable

log("test", "All tests completed");
