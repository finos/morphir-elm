import type { FQName, Name, Path } from "./types";

const capitalize = (s: string): string => (s.length === 0 ? s : s[0].toUpperCase() + s.slice(1));

export const nameKey = (name: Name): string => name.join("_");

export const toCamelCase = (name: Name): string =>
  name.map((w, i) => (i === 0 ? w : capitalize(w))).join("");

export const toTitleCase = (name: Name): string => name.map(capitalize).join("");

export const pathToString = (path: Path): string => path.map(toTitleCase).join(".");

/** Canonical key for a fully-qualified name, e.g. `Pkg.Name:Some.Module:myFunction`. */
export const fqnKey = ([pkg, mod, local]: FQName): string =>
  `${pathToString(pkg)}:${pathToString(mod)}:${toCamelCase(local)}`;

/** Words of a name, merging runs of single letters into abbreviations (`["s","d","k"]` → `SDK`). */
const words = (name: Name): string[] => {
  const result: string[] = [];
  let abbreviation = "";
  for (const w of name) {
    if (w.length === 1) {
      abbreviation += w;
    } else {
      if (abbreviation) result.push(abbreviation.toUpperCase());
      abbreviation = "";
      result.push(w);
    }
  }
  if (abbreviation) result.push(abbreviation.toUpperCase());
  return result;
};

/** Business-friendly label, e.g. `["cancelation","ratio"]` → `Cancelation ratio`. */
export const humanize = (name: Name): string => capitalize(words(name).join(" "));

/** Lower-case phrase suitable for the middle of a sentence. */
export const humanizeInline = (name: Name): string =>
  words(name)
    .map((x) => (x.length > 1 && x === x.toUpperCase() ? x : x.toLowerCase()))
    .join(" ");

export const humanizePath = (path: Path): string => path.map(humanize).join(" › ");
