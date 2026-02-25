# Morphir installer for Windows
# Downloads and installs morphir CLI binaries and/or WASM interpreter artifacts
# from GitHub Releases.
#
# Usage:
#   irm https://raw.githubusercontent.com/finos/morphir-elm/vnext/scripts/install.ps1 | iex
#   .\install.ps1 -Cli -Wasm -Wit
#   .\install.ps1 -Version "v0.1.0" -InstallDir "C:\tools\morphir"
#
# Parameters:
#   -Cli           Install the morphir CLI binary (default if no options given)
#   -Wasm          Install the WASM interpreter component (interpreter.wasm)
#   -Wit           Install the WIT interface definitions
#   -All           Install everything
#   -Version       Specific release tag (default: latest)
#   -InstallDir    Directory to install binaries (default: $env:LOCALAPPDATA\morphir\bin)
#   -WasmDir       Directory for WASM/WIT artifacts (default: $env:LOCALAPPDATA\morphir\share)

param(
    [switch]$Cli,
    [switch]$Wasm,
    [switch]$Wit,
    [switch]$All,
    [string]$Version = "",
    [string]$InstallDir = "",
    [string]$WasmDir = ""
)

$ErrorActionPreference = "Stop"
$Repo = "finos/morphir-elm"

if (-not $InstallDir) {
    $InstallDir = Join-Path $env:LOCALAPPDATA "morphir\bin"
}
if (-not $WasmDir) {
    $WasmDir = Join-Path $env:LOCALAPPDATA "morphir\share"
}

# Default to CLI only if nothing specified
if (-not $Cli -and -not $Wasm -and -not $Wit -and -not $All) {
    $Cli = $true
}
if ($All) {
    $Cli = $true
    $Wasm = $true
    $Wit = $true
}

function Resolve-Version {
    if ($Version) {
        return $Version
    }

    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers @{ "User-Agent" = "morphir-installer" }
        return $release.tag_name
    }
    catch {
        Write-Error "Could not determine latest release version: $_"
        exit 1
    }
}

function Download-Asset {
    param(
        [string]$Tag,
        [string]$Asset,
        [string]$Dest
    )

    $url = "https://github.com/$Repo/releases/download/$Tag/$Asset"
    Write-Host "Downloading $Asset..."

    try {
        Invoke-WebRequest -Uri $url -OutFile $Dest -UseBasicParsing
    }
    catch {
        Write-Error "Failed to download $url : $_"
        exit 1
    }
}

function Main {
    $tag = Resolve-Version
    Write-Host "Installing morphir $tag..."

    if ($Cli) {
        $binaryName = "morphir-windows-amd64.exe"
        $tmp = [System.IO.Path]::GetTempFileName()

        Download-Asset -Tag $tag -Asset $binaryName -Dest $tmp

        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        $destPath = Join-Path $InstallDir "morphir.exe"
        Move-Item -Path $tmp -Destination $destPath -Force

        Write-Host "Installed morphir CLI to $destPath"

        # Check if install dir is in PATH
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$InstallDir*") {
            Write-Host ""
            Write-Host "Note: $InstallDir is not in your PATH."
            Write-Host "Add it with:"
            Write-Host "  `$env:PATH = `"$InstallDir;`$env:PATH`""
            Write-Host ""
            Write-Host "Or permanently:"
            Write-Host "  [Environment]::SetEnvironmentVariable('PATH', `"$InstallDir;`$([Environment]::GetEnvironmentVariable('PATH', 'User'))`", 'User')"
        }
    }

    if ($Wasm) {
        $tmp = [System.IO.Path]::GetTempFileName()
        Download-Asset -Tag $tag -Asset "interpreter.wasm" -Dest $tmp

        New-Item -ItemType Directory -Path $WasmDir -Force | Out-Null
        $destPath = Join-Path $WasmDir "interpreter.wasm"
        Move-Item -Path $tmp -Destination $destPath -Force

        Write-Host "Installed interpreter.wasm to $destPath"
    }

    if ($Wit) {
        $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) "morphir-wit-$(Get-Random)"
        New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
        $tmpFile = Join-Path $tmpDir "wit.tar.gz"

        Download-Asset -Tag $tag -Asset "morphir-interpreter-wit.tar.gz" -Dest $tmpFile

        New-Item -ItemType Directory -Path $WasmDir -Force | Out-Null
        tar -xzf $tmpFile -C $WasmDir
        Remove-Item -Path $tmpDir -Recurse -Force

        Write-Host "Installed WIT definitions to $WasmDir\wit\"
    }

    Write-Host ""
    Write-Host "Done!"
}

Main
