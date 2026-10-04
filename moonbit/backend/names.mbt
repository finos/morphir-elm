///|
let reserved_words : Array[String] = [
  "if", "then", "else", "case", "of", "let", "in", "type", "module", "where", "import",
  "exposing", "as", "port", "alias", "infix", "effect",
]

///|
let constraint_prefixes : Array[String] = [
  "number", "comparable", "appendable", "compappend",
]

///|
/// Names are ASCII by the v4 name grammar, so only `a`..`z` change.
fn upper_first(word : String) -> String {
  let buffer = StringBuilder::new()
  let mut first = true
  for c in word {
    if first && c >= 'a' && c <= 'z' {
      buffer.write_char((c.to_int() - 32).unsafe_to_char())
    } else {
      buffer.write_char(c)
    }
    first = false
  }
  buffer.to_string()
}

///|
fn escape_reserved(name : String) -> String {
  if reserved_words.contains(name) {
    name + "_"
  } else {
    name
  }
}

///|
pub fn value_name(name : @ir.Name) -> String {
  let buffer = StringBuilder::new()
  for i, segment in name.to_segments() {
    match segment {
      Word(word) =>
        buffer.write_string(if i == 0 { word } else { upper_first(word) })
      Initialism(letters) =>
        buffer.write_string(if i == 0 { letters.to_lower() } else { letters })
    }
  }
  escape_reserved(buffer.to_string())
}

///|
pub fn type_name(name : @ir.Name) -> String {
  let buffer = StringBuilder::new()
  for segment in name.to_segments() {
    match segment {
      Word(word) => buffer.write_string(upper_first(word))
      Initialism(letters) => buffer.write_string(letters)
    }
  }
  buffer.to_string()
}

///|
pub fn module_name(package_name : @ir.Path, module : @ir.Path) -> Array[String] {
  package_name.to_names().map(type_name) + module.to_names().map(type_name)
}

///|
fn constraint_of(
  attributes : @ir.TypeAttributes,
  at : String,
) -> String? raise ElmGenerationError {
  let classes : Array[String] = match attributes.constraints.get("typeclass") {
    None => return None
    Some(Text(name)) => [name]
    Some(Array(items)) =>
      items.map(item => {
        match item {
          Text(name) => name
          _ =>
            refuse(
              "unsupported_constraint", at, "typeclass entries must be text",
            )
        }
      })
    Some(_) =>
      refuse("unsupported_constraint", at, "typeclass must be text or a list")
  }
  classes.sort()
  match classes {
    [single] if constraint_prefixes.contains(single) => Some(single)
    ["appendable", "comparable"] => Some("compappend")
    _ =>
      refuse(
        "unsupported_constraint",
        at,
        "Elm has no class for " + classes.join(", "),
      )
  }
}

///|
/// An unconstrained variable keeps its name. Elm reads a name that starts with a class
/// prefix as constrained, which is the classic-IR fallback.
fn type_variable_name(name : @ir.Name, constraint : String?) -> String {
  let base = value_name(name)
  match constraint {
    Some(prefix) =>
      if base.has_prefix(prefix) {
        base
      } else {
        prefix + upper_first(base)
      }
    None => base
  }
}
