// Elm names the extension derives without compiling: the module a source declares and the
// canonical form of a package name. Kept apart from the compiler so workspace discovery does not
// load the Elm worker.

function isElmIdentifierCharacter(character: string | undefined): boolean {
  return character !== undefined && /[A-Za-z0-9_]/u.test(character);
}

function skipElmTrivia(source: string, start: number): number | undefined {
  let offset = start;

  while (offset < source.length) {
    const character = source[offset];
    if (character === "\uFEFF" || /[\t\n\f\r ]/u.test(character ?? "")) {
      offset += 1;
      continue;
    }
    if (source.startsWith("--", offset)) {
      const lineEnd = source.indexOf("\n", offset + 2);
      offset = lineEnd === -1 ? source.length : lineEnd + 1;
      continue;
    }
    if (source.startsWith("{-", offset)) {
      let depth = 1;
      offset += 2;
      while (offset < source.length && depth > 0) {
        if (source.startsWith("{-", offset)) {
          depth += 1;
          offset += 2;
        } else if (source.startsWith("-}", offset)) {
          depth -= 1;
          offset += 2;
        } else {
          offset += 1;
        }
      }
      if (depth > 0) {
        return undefined;
      }
      continue;
    }
    break;
  }

  return offset;
}

function keywordEnd(
  source: string,
  offset: number,
  keyword: string
): number | undefined {
  const end = offset + keyword.length;
  return source.startsWith(keyword, offset) &&
    !isElmIdentifierCharacter(source[end])
    ? end
    : undefined;
}

function modulePathEnd(
  source: string,
  start: number
): { readonly end: number; readonly name: string } | undefined {
  let offset = start;
  const segments: string[] = [];

  for (;;) {
    if (!/[A-Z]/u.test(source[offset] ?? "")) {
      return undefined;
    }
    const segmentStart = offset;
    offset += 1;
    while (isElmIdentifierCharacter(source[offset])) {
      offset += 1;
    }
    segments.push(source.slice(segmentStart, offset));
    if (source[offset] !== ".") {
      break;
    }
    offset += 1;
  }

  return { end: offset, name: segments.join(".") };
}

/** The module a source without a declared header defines: its file stem, else `Main`. */
export function fallbackModuleName(fileName: string): string {
  const extension = fileName.lastIndexOf(".");
  const stem = extension > 0 ? fileName.slice(0, extension) : fileName;
  const modulePath = modulePathEnd(stem, 0);
  return modulePath !== undefined && modulePath.end === stem.length
    ? modulePath.name
    : "Main";
}

export function sourceModuleName(source: string): string | undefined {
  let offset = skipElmTrivia(source, 0);
  if (offset === undefined) {
    return undefined;
  }

  let declarationKind: "effect" | "normal" | "port" = "normal";
  const portEnd = keywordEnd(source, offset, "port");
  const effectEnd = keywordEnd(source, offset, "effect");
  if (portEnd !== undefined || effectEnd !== undefined) {
    declarationKind = portEnd === undefined ? "effect" : "port";
    offset = skipElmTrivia(source, portEnd ?? effectEnd ?? offset);
    if (offset === undefined) {
      return undefined;
    }
  }

  const moduleEnd = keywordEnd(source, offset, "module");
  if (moduleEnd === undefined) {
    return undefined;
  }
  offset = skipElmTrivia(source, moduleEnd);
  if (offset === undefined) {
    return undefined;
  }

  const modulePath = modulePathEnd(source, offset);
  if (modulePath === undefined) {
    return undefined;
  }
  offset = skipElmTrivia(source, modulePath.end);
  if (offset === undefined) {
    return undefined;
  }
  const expectedSuffix = declarationKind === "effect" ? "where" : "exposing";
  return keywordEnd(source, offset, expectedSuffix) === undefined
    ? undefined
    : modulePath.name;
}

export interface NormalizedPackageIdentity {
  readonly canonicalName: string;
  readonly workerName: string;
  readonly key: string;
}

function elmNameFromString(value: string): readonly string[] {
  return Array.from(value.matchAll(/[a-zA-Z][a-z]*|[0-9]+/gu), ([word]) =>
    word.toLowerCase()
  );
}

function elmPathFromString(value: string): readonly (readonly string[])[] {
  return value.split(/[^\w\s]+/u).map(elmNameFromString);
}

function structuralPackageIdentity(
  value: unknown
): readonly (readonly string[])[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  const path = value.map((name) => {
    if (
      !Array.isArray(name) ||
      name.length === 0 ||
      !name.every(
        (word) => typeof word === "string" && /^(?:[a-z]+|[0-9]+)$/u.test(word)
      )
    ) {
      return undefined;
    }
    return name as readonly string[];
  });
  return path.every((name): name is readonly string[] => name !== undefined)
    ? path
    : undefined;
}

function samePackageIdentity(
  left: readonly (readonly string[])[],
  right: readonly (readonly string[])[]
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (name, pathIndex) =>
        name.length === right[pathIndex]?.length &&
        name.every((word, wordIndex) => word === right[pathIndex]?.[wordIndex])
    )
  );
}

/**
 * Removes the Unicode `White_Space` characters at both ends, as Rust `str::trim` does, so every
 * provider reads an explicit name alike. `String.prototype.trim` also removes U+FEFF and keeps
 * U+0085.
 */
export function trimWhiteSpace(value: string): string {
  return value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, "");
}

export type ExplicitPackageName =
  | { readonly kind: "normal"; readonly normalForm: string }
  | { readonly kind: "no-segments" }
  | { readonly kind: "empty-segment"; readonly segment: string };

/**
 * The normal form of a package name a request states: `.` and `/` both separate package path
 * segments, as in Morphir, and each segment is its Elm words joined with `-`.
 */
export function explicitPackageName(name: string): ExplicitPackageName {
  const pieces = name
    .split(/[./]/u)
    .map(trimWhiteSpace)
    .filter((piece) => piece.length > 0);
  if (pieces.length === 0) {
    return { kind: "no-segments" };
  }
  const path = pieces.map(elmNameFromString);
  const emptyIndex = path.findIndex((words) => words.length === 0);
  if (emptyIndex !== -1) {
    return { kind: "empty-segment", segment: pieces[emptyIndex] as string };
  }
  return {
    kind: "normal",
    normalForm: path.map((words) => words.join("-")).join("/"),
  };
}

export function normalizePackageIdentity(
  value: unknown
): NormalizedPackageIdentity | undefined {
  const path =
    typeof value === "string"
      ? value.split("/").map(elmNameFromString)
      : structuralPackageIdentity(value);
  if (path === undefined || structuralPackageIdentity(path) === undefined) {
    return undefined;
  }
  const canonicalName = path.map((name) => name.join("-")).join("/");
  const workerName = path.map((name) => name.join(" ")).join("/");
  if (
    (typeof value === "string" && value !== canonicalName) ||
    !samePackageIdentity(path, elmPathFromString(workerName))
  ) {
    return undefined;
  }
  return { canonicalName, workerName, key: JSON.stringify(path) };
}
