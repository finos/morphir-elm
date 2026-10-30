# Agent instructions (GitHub Copilot and shared catalog)

Repository-wide agent guidance lives in the root [AGENTS.md](../AGENTS.md). This file covers tools and skills
that live under `.github/`.

### OpenSpec

**Location**: `openspec/` and the `openspec-*` skills in each agent's skill directory

[OpenSpec](https://github.com/Fission-AI/OpenSpec) is a spec-driven change workflow. A change in
`openspec/changes/<name>/` holds `proposal.md`, `design.html`, spec deltas and `tasks.md`. Archiving the change
merges its deltas into `openspec/specs/`. The project schema `openspec/schemas/html-design/` makes the design an
HTML review page; the CLI parses the other files, so they stay Markdown. See the root
[AGENTS.md](../AGENTS.md#specs-and-plans-are-html-documents). The skills are `openspec-explore`, `openspec-propose`, `openspec-apply-change`,
`openspec-update-change`, `openspec-sync-specs` and `openspec-archive-change`. Invoke them as
`/openspec-propose`, or as `$openspec-propose` in Codex.

The skills run the `openspec` CLI. Install the version that generated them, which each skill records as
`generatedBy` (now 1.14.3): `mise use -g npm:@fission-ai/openspec@1.14.3`. Do not add it to a project
`mise.toml` that CI installs: each job would download it.

The CLI generates the skills: do not edit them. To change the version, install the new version, run
`openspec update`, and commit the regenerated files. The
[skill catalog](skills/README.md#openspec-across-agents) lists the directory for each agent.
