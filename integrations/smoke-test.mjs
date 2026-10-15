#!/usr/bin/env node
// Smoke test for the Morphir MCP server, independent of any agent harness.
//
//   node integrations/smoke-test.mjs <command> [args...]
//
// Example (the same command you put in your harness config):
//   node integrations/smoke-test.mjs npx -y -p morphir-elm morphir-mcp --root-dir ./scratch
//
// It starts the server over stdio, lints the tool schemas for constructs that
// some model APIs reject, adds a module, adds a deliberately broken module, and
// records a test case. Exit code is non-zero if anything is off.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const [command, ...args] = process.argv.slice(2);
if (!command) {
    console.error("usage: node integrations/smoke-test.mjs <command> [args...]");
    process.exit(2);
}

let failed = false;
const check = (ok, label) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
    if (!ok) failed = true;
};

// Schema constructs that break Gemini / OpenAI strict mode / older harnesses.
function lint(schema, where, problems) {
    if (schema === null || typeof schema !== "object") return;
    if (Array.isArray(schema)) return schema.forEach((s, i) => lint(s, `${where}[${i}]`, problems));
    if ("$ref" in schema) problems.push(`${where}: uses $ref`);
    const typed = ["type", "anyOf", "oneOf", "enum", "const"].some(k => k in schema);
    if (!typed && !("properties" in schema)) problems.push(`${where}: no type`);
    for (const [k, v] of Object.entries(schema)) {
        if (k === "properties") for (const [name, sub] of Object.entries(v)) lint(sub, `${where}.${name}`, problems);
        else if (k === "items" || k === "anyOf" || k === "oneOf" || k === "additionalProperties") lint(v, `${where}.${k}`, problems);
    }
}

const client = new Client({ name: "morphir-smoke-test", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command, args, stderr: "inherit" }));

const { tools } = await client.listTools();
check(tools.length > 0, `server lists tools: ${tools.map(t => t.name).join(", ")}`);
const problems = [];
for (const t of tools) lint(t.inputSchema, t.name, problems);
check(problems.length === 0, `tool schemas are portable${problems.length ? ": " + problems.join("; ") : ""}`);
check(Boolean(client.getInstructions()), "server provides instructions");

const text = r => r.content.map(c => c.text).join("\n");

const good = await client.callTool({
    name: "addModule",
    arguments: {
        moduleName: "SmokeRates",
        content: "type Tier = Retail | Institutional\n\ncap : Tier -> Float -> Float\ncap tier rate =\n    case tier of\n        Retail -> min rate 0.36\n        Institutional -> rate\n"
    }
});
check(!good.isError && /added successfully/.test(text(good)), "addModule accepts a valid module");

const bad = await client.callTool({
    name: "addModule",
    arguments: { moduleName: "SmokeBad", content: "foo : Int\nfoo = \"x\"\n" }
});
check(bad.isError === true && /TYPE MISMATCH/.test(text(bad)), "addModule rejects an invalid module with isError and the compiler message");

const tests = await client.callTool({
    name: "setTestCases",
    arguments: {
        moduleName: "SmokeRates",
        functionName: "cap",
        testCases: [{ inputs: [["Retail"], 0.5], expectedOutput: 0.36, description: "retail rate is capped at 36%" }]
    }
});
check(!tests.isError, "setTestCases records a test case");

await client.close();
process.exit(failed ? 1 : 0);
