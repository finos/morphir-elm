# Agent skills

Shared skills follow the [Agent Skills specification](https://agentskills.io/specification).
Their instructions use ordinary file access, terminal commands, and available tracker connectors.

## OpenSpec across agents

The `openspec-*` skills come from the OpenSpec CLI; each records the generating version as `generatedBy`.
`openspec init` wrote one copy for each agent directory, and `openspec update` regenerates them. Do not edit
them, and do not replace them with links. To change the version, install it, run `openspec update`, and commit
the result. [OpenSpec](../AGENTS.md#openspec) gives the install command.

| Agent | Skill directory |
|---|---|
| Claude Code | `.claude/skills/openspec-*/` |
| Codex, Antigravity, Muse Code and other `.agents` readers | `.agents/skills/openspec-*/` |
| GitHub Copilot | `.github/skills/openspec-*/` |
| Cursor | `.cursor/skills/openspec-*/` |
| Grok Build | `.grok/skills/openspec-*/` |
| Devin Desktop (formerly Windsurf) | `.devin/skills/openspec-*/` |
| Gemini CLI | `.gemini/skills/openspec-*/` |
| OpenCode | `.opencode/skills/openspec-*/` |

The `.agents/skills/` copy names both invocation forms (`$openspec-apply-change` for Codex,
`/openspec-apply-change` for other agents). The other copies name only the slash form. The Copilot cloud
coding-agent files (`.github/workflows/copilot-setup-steps.yml` and `.github/agents/openspec.agent.md`) are not
installed, and `openspec/config.yaml` records `cloudAgent: false`.
