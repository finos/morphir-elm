@echo off

rem Morphir CLI wrapper for Windows — downloads and caches the correct version
rem of the morphir binary, then executes it.
rem
rem Version resolution order:
rem   1. MORPHIR_VERSION environment variable
rem   2. .morphir-version file (in project root or .config\)
rem   3. DEFAULT_MORPHIR_VERSION (built into this script)
rem
rem Usage:
rem   morphir.bat make
rem   morphir.bat --version
rem   set MORPHIR_VERSION=2.100.0 & morphir.bat make

setlocal enabledelayedexpansion

if "!DEFAULT_MORPHIR_VERSION!"=="" set "DEFAULT_MORPHIR_VERSION=2.100.0"

if "!GITHUB_RELEASE_CDN!"=="" set "GITHUB_RELEASE_CDN="

set "MORPHIR_REPO=finos/morphir-elm"
set "MORPHIR_REPO_URL=https://github.com/%MORPHIR_REPO%"

rem --- Version resolution ---

if "!MORPHIR_VERSION!"=="" (
  if exist ".morphir-version" (
    set /p MORPHIR_VERSION=<.morphir-version
  ) else (
    if exist ".config\morphir-version" (
      set /p MORPHIR_VERSION=<.config\morphir-version
    )
  )
)

if "!MORPHIR_VERSION!"=="" set "MORPHIR_VERSION=%DEFAULT_MORPHIR_VERSION%"

rem --- Platform detection ---

set "PLATFORM=windows-amd64"
if /I "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
  echo Error: Windows ARM64 is not currently supported. 1>&2
  exit /b 1
)

set "BINARY_NAME=morphir-%PLATFORM%.exe"

rem --- Cache directory ---

if "!MORPHIR_DOWNLOAD_DIR!"=="" (
  if "!XDG_CACHE_HOME!"=="" (
    set "MORPHIR_DOWNLOAD_DIR=%USERPROFILE%\.cache\morphir\download\!MORPHIR_VERSION!"
  ) else (
    set "MORPHIR_DOWNLOAD_DIR=!XDG_CACHE_HOME!\morphir\download\!MORPHIR_VERSION!"
  )
)

set "MORPHIR=!MORPHIR_DOWNLOAD_DIR!\!BINARY_NAME!"

rem --- Download if needed ---

if not exist "!MORPHIR!" (
  rem Determine tag — add v prefix if not present
  set "MORPHIR_TAG=!MORPHIR_VERSION!"
  if not "!MORPHIR_VERSION:~0,1!"=="v" set "MORPHIR_TAG=v!MORPHIR_VERSION!"

  set "MORPHIR_DOWNLOAD_URL=!GITHUB_RELEASE_CDN!!MORPHIR_REPO_URL!/releases/download/!MORPHIR_TAG!/!BINARY_NAME!"

  echo Downloading morphir !MORPHIR_VERSION! for %PLATFORM%... 1>&2
  echo   !MORPHIR_DOWNLOAD_URL! 1>&2

  if not exist "!MORPHIR_DOWNLOAD_DIR!" mkdir "!MORPHIR_DOWNLOAD_DIR!"

  set "MORPHIR_TEMP_FILE=!MORPHIR_DOWNLOAD_DIR!\morphir-download.tmp"

  curl -f -L -o "!MORPHIR_TEMP_FILE!" "!MORPHIR_DOWNLOAD_URL!"
  if !errorlevel! neq 0 (
    echo Error: Failed to download morphir. 1>&2
    if exist "!MORPHIR_TEMP_FILE!" del "!MORPHIR_TEMP_FILE!"
    exit /b 1
  )

  move /y "!MORPHIR_TEMP_FILE!" "!MORPHIR!" >nul

  echo Cached morphir !MORPHIR_VERSION! at !MORPHIR! 1>&2
)

rem --- Execute ---

"!MORPHIR!" %*
exit /b !errorlevel!
