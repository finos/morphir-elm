# Using Morphir from any agent harness

The Morphir MCP server (`morphir-mcp`) speaks plain MCP over stdio, so any harness that supports MCP can use it with any model. The server carries its own usage instructions and its tool schemas avoid constructs that some model APIs reject, so no harness-specific code is involved.

Prerequisites: Node.js 24, and [Elm](https://guide.elm-lang.org/install/elm.html) on `PATH` (or pass `--elm-command <path>`).

The server is started with `--root-dir`, the folder where the Morphir project (`morphir.json`, `src/`, `morphir-ir.json`) is created. Use the project folder you open in the harness.

## Per-harness setup

Copy the file from this folder into your project at the same relative path, or paste its contents into the harness config.

| Harness | File to create | Source in this folder |
|---|---|---|
| Claude Code | `.mcp.json` (or `claude mcp add morphir -- npx -y -p morphir-elm morphir-mcp --root-dir .`) | [claude-code/.mcp.json](claude-code/.mcp.json) |
| Cursor | `.cursor/mcp.json` | [cursor/.cursor/mcp.json](cursor/.cursor/mcp.json) |
| VS Code / GitHub Copilot | `.vscode/mcp.json` | [vscode/.vscode/mcp.json](vscode/.vscode/mcp.json) |
| Gemini CLI | `.gemini/settings.json` | [gemini/.gemini/settings.json](gemini/.gemini/settings.json) |
| OpenAI Codex CLI | `.codex/config.toml` (trusted projects) or `~/.codex/config.toml` (or `codex mcp add morphir -- npx -y -p morphir-elm morphir-mcp --root-dir .`) | [codex/.codex/config.toml](codex/.codex/config.toml) |
| opencode | `opencode.json` | [opencode/opencode.json](opencode/opencode.json) |

Other MCP-capable harnesses (Windsurf, Cline, Goose, Zed, Continue, ...) take the same three values: command `npx`, args `-y -p morphir-elm morphir-mcp --root-dir <project folder>`, transport stdio. Look up where the harness keeps its MCP server list.

Windows: some harnesses cannot launch `npx` directly. Use `"command": "cmd"` with `"args": ["/c", "npx", "-y", "-p", "morphir-elm", "morphir-mcp", "--root-dir", "."]`.

If the harness starts the server from a different working directory than your project, replace `.` with an absolute path.

## Optional: the skill

[`skills/morphir-modeling`](../skills/morphir-modeling/SKILL.md) is a portable [Agent Skills](https://agentskills.io) `SKILL.md` that adds the clarify, model, test, report workflow on top of the tools. Harnesses that support skills load it from their own folder, for example `.claude/skills/`, `.cursor/skills/`, `.github/skills/` or `.gemini/skills/`. Harnesses without skill support still get the same guidance from the server's instructions, so the skill is a convenience, not a requirement.

## Verify an install without any harness

```
node integrations/smoke-test.mjs npx -y -p morphir-elm morphir-mcp --root-dir ./scratch
```

It lists the tools, checks the schemas, adds a valid and an invalid module, and records a test case. Run it from a checkout after `npm install`.

## Known limits

- Tests recorded with `setTestCases` run with the v1 CLI (`morphir-elm test`). The v2 `morphir` command has no test subcommand yet, and the server has no tool to run them.
- Tool calls run `elm make` and `morphir make`. Large models can exceed a harness's default tool timeout (Codex: 60 s), hence the raised values in the Codex example.
