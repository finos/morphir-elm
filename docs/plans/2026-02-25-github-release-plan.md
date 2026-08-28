# GitHub Release Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a GitHub Actions workflow that builds and releases CLI binaries, WASM interpreter artifacts, and install scripts to GitHub Releases, triggered by tag push or manual dispatch.

**Architecture:** Single workflow file with two triggers (tag push, workflow_dispatch). Parses the tag to determine if it's a default-branch release or branch prerelease. Builds platform-specific CLI binaries via `bun build --compile`, the interpreter WASM component, packages all artifacts, and creates a GitHub Release.

**Tech Stack:** GitHub Actions, mise, Bun, Elm, extism-js (Extism plugin)

**Design doc:** `docs/plans/2026-02-25-github-release-design.md`

---

### Task 1: Create the workflow file

**Files:**
- Create: `.github/workflows/github-release.yml`

**Step 1: Write the workflow**

```yaml
name: GitHub Release

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch to release from'
        required: true
        type: string
      version:
        description: 'Version number (e.g., 0.1.0)'
        required: true
        type: string

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      # --- Determine tag and checkout ---

      - name: Determine tag (tag push)
        if: github.event_name == 'push'
        run: echo "TAG_NAME=${GITHUB_REF#refs/tags/}" >> $GITHUB_ENV

      - name: Determine tag (workflow_dispatch)
        if: github.event_name == 'workflow_dispatch'
        run: |
          BRANCH="${{ github.event.inputs.branch }}"
          VERSION="${{ github.event.inputs.version }}"
          DEFAULT_BRANCH="${{ github.event.repository.default_branch }}"
          if [ "$BRANCH" = "$DEFAULT_BRANCH" ]; then
            echo "TAG_NAME=v${VERSION}" >> $GITHUB_ENV
          else
            echo "TAG_NAME=v${BRANCH}-${VERSION}" >> $GITHUB_ENV
          fi
          echo "RELEASE_BRANCH=${BRANCH}" >> $GITHUB_ENV

      - uses: actions/checkout@v4
        if: github.event_name == 'push'
        with:
          ref: ${{ env.TAG_NAME }}

      - uses: actions/checkout@v4
        if: github.event_name == 'workflow_dispatch'
        with:
          ref: ${{ github.event.inputs.branch }}
          fetch-depth: 0

      - name: Create and push tag (workflow_dispatch)
        if: github.event_name == 'workflow_dispatch'
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git tag "${{ env.TAG_NAME }}"
          git push origin "${{ env.TAG_NAME }}"

      # --- Determine prerelease status ---

      - name: Check if prerelease
        run: |
          TAG="${{ env.TAG_NAME }}"
          # Strip the leading 'v'
          TAG_BODY="${TAG#v}"
          # If it's pure semver (digits and dots only), it's a latest release
          if echo "$TAG_BODY" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$'; then
            echo "IS_PRERELEASE=false" >> $GITHUB_ENV
          else
            echo "IS_PRERELEASE=true" >> $GITHUB_ENV
          fi

      # --- Setup build tools ---

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install mise
        uses: jdx/mise-action@v2
        with:
          experimental: true

      - name: Cache Bun
        uses: actions/cache@v4
        with:
          path: ~/.bun/install/cache
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lock') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Cache Elm
        uses: actions/cache@v4
        with:
          path: ~/.elm
          key: ${{ runner.os }}-elm-${{ hashFiles('**/elm.json') }}
          restore-keys: |
            ${{ runner.os }}-elm-

      - name: Install dependencies
        run: bun ci

      # --- Build ---

      - name: Build interpreter WASM (Extism plugin)
        run: mise run build:interpreter-wasm

      - name: Build CLI binaries (all platforms)
        run: mise run build:cli-binaries

      # --- Package artifacts ---

      - name: Package release artifacts
        run: |
          PKG=packages/morphir-interpreter-wasm
          BINARIES=dist/binaries

          # CLI binaries (already in dist/binaries/ from build:cli-binaries)
          cp "$BINARIES/morphir-linux-amd64" .
          cp "$BINARIES/morphir-linux-arm64" .
          cp "$BINARIES/morphir-darwin-arm64" .
          cp "$BINARIES/morphir-windows-amd64.exe" .

          # Extism plugin (released as interpreter.wasm for install scripts)
          cp "$PKG/build/plugin.wasm" interpreter.wasm

          # WASM tarball (plugin + README)
          mkdir -p _release/morphir-interpreter
          cp "$PKG/build/plugin.wasm" _release/morphir-interpreter/
          cp "$PKG/README.md" _release/morphir-interpreter/ 2>/dev/null || true
          tar -czf morphir-interpreter-wasm.tar.gz -C _release morphir-interpreter/
          rm -rf _release

      # --- Release ---

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ env.TAG_NAME }}
          name: ${{ env.TAG_NAME }}
          files: |
            morphir-linux-amd64
            morphir-linux-arm64
            morphir-darwin-arm64
            morphir-windows-amd64.exe
            interpreter.wasm
            morphir-interpreter-wasm.tar.gz
            scripts/install.sh
            scripts/install.ps1
          generate_release_notes: true
          draft: false
          prerelease: ${{ env.IS_PRERELEASE == 'true' }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Key details for the implementer:**
- The `softprops/action-gh-release` is at `@v2` (the existing npm-release.yml uses `@v1` — we use the newer version).
- The prerelease check regex: `^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$` matches pure semver like `2.101.0` or `2.101.0-beta.1` but NOT `vnext-0.1.0` (which has a non-semver prefix).
- The `workflow_dispatch` creates and pushes the tag automatically. The tag push event will NOT re-trigger this workflow because GitHub Actions doesn't trigger on tags created within a workflow run.
- The checkout for tag push uses the tag ref directly. The checkout for dispatch uses the branch ref.
- Uses `actions/checkout@v4`, `actions/setup-node@v4`, and `jdx/mise-action@v2`; mise installs Bun and the native Elm tools from `mise.toml`.
- CLI binaries are cross-compiled on ubuntu-latest using `bun build --compile --target`. Bun supports cross-compilation without needing the target OS.
- Install scripts are included directly from `scripts/` — they don't need to be packaged.

**Step 2: Commit**

```bash
git add .github/workflows/github-release.yml
git commit -m "Add GitHub release workflow for CLI binaries and WASM interpreter artifacts"
```

---

### Task 2: Test with a dry run

Since we can't actually trigger the workflow without pushing to the remote, verify the workflow YAML is valid.

**Step 1: Validate YAML syntax**

Run: `cat .github/workflows/github-release.yml | python3 -c "import sys,yaml; yaml.safe_load(sys.stdin); print('Valid YAML')"` (or `yq` if available)

If no YAML parser is available, at minimum verify:
- No tab characters (YAML requires spaces)
- Proper indentation
- All `${{ }}` expressions are properly quoted

**Step 2: Verify the workflow appears in the repo**

Run: `ls -la .github/workflows/` — should show `github-release.yml` alongside the existing workflows.

**Step 3: Push the branch**

The workflow will be testable once it's on the remote. Push the branch so the workflow is registered by GitHub Actions.

```bash
git push
```

**Step 4: Commit any fixes if validation found issues**

---

### Task 3: Test the workflow end-to-end

**Step 1: Create a test tag on the current branch**

Since we're on `vnext`, push a test prerelease tag:

```bash
git tag vnext-0.0.1-test
git push origin vnext-0.0.1-test
```

**Step 2: Monitor the workflow run**

```bash
gh run list --workflow=github-release.yml --limit=1
gh run watch <run-id>
```

**Step 3: Verify the release was created**

```bash
gh release view vnext-0.0.1-test
```

Expected: A prerelease with 9 artifacts:
- `morphir-linux-amd64`, `morphir-linux-arm64`, `morphir-darwin-arm64`, `morphir-windows-amd64.exe`
- `interpreter.wasm`, `morphir-interpreter-wasm.tar.gz`
- `install.sh`, `install.ps1`

**Step 4: Clean up test release and tag**

```bash
gh release delete vnext-0.0.1-test --yes
git push origin --delete vnext-0.0.1-test
git tag -d vnext-0.0.1-test
```

**Step 5: Fix any issues found and commit**

```bash
git add .github/workflows/github-release.yml
git commit -m "Fix github-release workflow issues from test run"
```
