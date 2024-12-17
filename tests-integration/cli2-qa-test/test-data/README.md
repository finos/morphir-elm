# Test Data Explanation

This folder contains projects for two different types of tests.

The first project, `rentals` is a simple elm project based on morphir-examples.
The integration tests using this project are located at `/tests-integration/cli2-qa-test/cli2QA.test.ts` 

The remaining projects, `business-terms` and `rentals-decomposed` exist to demonstrate, and test, creating dependencies through the new property `dependencies` on the morphir.json structure. 

`business-terms` has been previously compiled and the whole purpose is to expose a `morphir-ir.json` that will be included on the `rentals-decomposed` project, during the setup of the integration tests.

