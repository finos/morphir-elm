// Facts about the finos/morphir-elm module that the tasks and tests share.

/** The version in moonbit/moon.mod, which is also the extension's version. */
export function moduleVersion(moonMod: string): string {
  const match = /^version\s*=\s*"([^"]+)"\s*$/m.exec(moonMod);
  if (match === null) {
    throw new Error("moonbit/moon.mod has no version");
  }
  return match[1];
}

/** The released module's file name. */
export function wasmArtifactName(version: string): string {
  return `morphir-elm-${version}.wasm`;
}

/** One line in the format `sha256sum --check` reads. */
export function checksumLine(sha256: string, filename: string): string {
  if (!/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error(`'${sha256}' is not a lowercase SHA-256`);
  }
  return `${sha256}  ${filename}\n`;
}
