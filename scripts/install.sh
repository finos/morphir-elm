#!/usr/bin/env bash
set -euo pipefail

# Morphir installer for Unix systems (Linux, macOS)
# Downloads and installs morphir CLI binaries and/or WASM interpreter artifacts
# from GitHub Releases.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/finos/morphir-elm/vnext/scripts/install.sh | bash
#   curl -fsSL ... | bash -s -- --cli --wasm --wit
#   curl -fsSL ... | bash -s -- --version v0.1.0 --install-dir /usr/local/bin
#
# Options:
#   --cli           Install the morphir CLI binary (default if no options given)
#   --wasm          Install the WASM interpreter component (interpreter.wasm)
#   --wit           Install the WIT interface definitions (morphir-interpreter-wit.tar.gz)
#   --all           Install everything
#   --version TAG   Specific release tag (default: latest)
#   --install-dir   Directory to install binaries (default: ~/.local/bin)
#   --wasm-dir      Directory for WASM/WIT artifacts (default: ~/.local/share/morphir)

REPO="finos/morphir-elm"
INSTALL_DIR="${HOME}/.local/bin"
WASM_DIR="${HOME}/.local/share/morphir"
VERSION=""
INSTALL_CLI=false
INSTALL_WASM=false
INSTALL_WIT=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cli)        INSTALL_CLI=true; shift ;;
    --wasm)       INSTALL_WASM=true; shift ;;
    --wit)        INSTALL_WIT=true; shift ;;
    --all)        INSTALL_CLI=true; INSTALL_WASM=true; INSTALL_WIT=true; shift ;;
    --version)    VERSION="$2"; shift 2 ;;
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    --wasm-dir)   WASM_DIR="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --cli           Install the morphir CLI binary (default)"
      echo "  --wasm          Install the WASM interpreter component"
      echo "  --wit           Install the WIT interface definitions"
      echo "  --all           Install everything"
      echo "  --version TAG   Specific release tag (default: latest)"
      echo "  --install-dir   Binary install directory (default: ~/.local/bin)"
      echo "  --wasm-dir      WASM/WIT artifact directory (default: ~/.local/share/morphir)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Default to CLI only if nothing specified
if ! $INSTALL_CLI && ! $INSTALL_WASM && ! $INSTALL_WIT; then
  INSTALL_CLI=true
fi

# Detect platform
detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "$os" in
    linux)  os="linux" ;;
    darwin) os="darwin" ;;
    *)
      echo "Error: Unsupported OS: $os" >&2
      exit 1
      ;;
  esac

  case "$arch" in
    x86_64|amd64)   arch="amd64" ;;
    aarch64|arm64)   arch="arm64" ;;
    *)
      echo "Error: Unsupported architecture: $arch" >&2
      exit 1
      ;;
  esac

  echo "${os}-${arch}"
}

# Resolve version tag
resolve_version() {
  if [[ -n "$VERSION" ]]; then
    echo "$VERSION"
    return
  fi

  # Get latest release tag
  local latest
  if command -v gh &>/dev/null; then
    latest=$(gh release view --repo "$REPO" --json tagName -q .tagName 2>/dev/null || true)
  fi

  if [[ -z "$latest" ]]; then
    latest=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')
  fi

  if [[ -z "$latest" ]]; then
    echo "Error: Could not determine latest release version" >&2
    exit 1
  fi

  echo "$latest"
}

# Download a release asset
download_asset() {
  local tag="$1" asset="$2" dest="$3"
  local url="https://github.com/${REPO}/releases/download/${tag}/${asset}"

  echo "Downloading ${asset}..."
  if command -v curl &>/dev/null; then
    curl -fsSL -o "$dest" "$url"
  elif command -v wget &>/dev/null; then
    wget -q -O "$dest" "$url"
  else
    echo "Error: Neither curl nor wget found" >&2
    exit 1
  fi
}

# Main
main() {
  local tag platform

  tag=$(resolve_version)
  echo "Installing morphir ${tag}..."

  if $INSTALL_CLI; then
    platform=$(detect_platform)
    local binary_name="morphir-${platform}"
    local tmp
    tmp=$(mktemp)

    download_asset "$tag" "$binary_name" "$tmp"
    mkdir -p "$INSTALL_DIR"
    mv "$tmp" "${INSTALL_DIR}/morphir"
    chmod +x "${INSTALL_DIR}/morphir"
    echo "Installed morphir CLI to ${INSTALL_DIR}/morphir"

    # Check if install dir is in PATH
    if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
      echo ""
      echo "Note: ${INSTALL_DIR} is not in your PATH."
      echo "Add it with:"
      echo "  export PATH=\"${INSTALL_DIR}:\$PATH\""
    fi
  fi

  if $INSTALL_WASM; then
    local tmp
    tmp=$(mktemp)
    download_asset "$tag" "interpreter.wasm" "$tmp"
    mkdir -p "$WASM_DIR"
    mv "$tmp" "${WASM_DIR}/interpreter.wasm"
    echo "Installed interpreter.wasm to ${WASM_DIR}/interpreter.wasm"
  fi

  if $INSTALL_WIT; then
    local tmp
    tmp=$(mktemp -d)
    download_asset "$tag" "morphir-interpreter-wit.tar.gz" "${tmp}/wit.tar.gz"
    mkdir -p "$WASM_DIR"
    tar -xzf "${tmp}/wit.tar.gz" -C "$WASM_DIR"
    rm -rf "$tmp"
    echo "Installed WIT definitions to ${WASM_DIR}/wit/"
  fi

  echo ""
  echo "Done!"
}

main
