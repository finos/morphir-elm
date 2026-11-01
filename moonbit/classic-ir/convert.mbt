///|
/// The prefix of the answer when the conversion fails. IR JSON always starts with `{`.
pub const ERROR_PREFIX : String = "error: "

///|
/// Converts classic Morphir IR JSON (format 1, 2 or 3) to Morphir IR 4.0.0 JSON. The answer is the v4 JSON text, or
/// `ERROR_PREFIX` and the reason.
///
/// morphir-elm writes the inferred type of each value input next to its declared type (`[name, attribute, type]` in
/// `inputTypes`), and the format 3 migration refuses an input whose two types differ. The conversion sets the
/// attribute to the declared type first, as the parity tests do; the v4 IR has no value attributes to keep.
pub fn classic_to_v4(text : String) -> String {
  try {
    let json = @json.parse(text)
    declared_input_types(json)
    @ir_json.write(
      @migration.to_current(@versioned_json.read(json.stringify())),
    )
  } catch {
    error => ERROR_PREFIX + error.to_string()
  } noraise {
    v4 => v4
  }
}

///|
fn declared_input_types(json : Json) -> Unit {
  match json {
    Object(fields) =>
      for key, field in fields {
        if key == "inputTypes" && field is Array(inputs) {
          for input in inputs {
            if input is Array(parts) && parts.length() == 3 {
              parts[1] = parts[2]
            }
          }
        }
        declared_input_types(field)
      }
    Array(items) =>
      for item in items {
        declared_input_types(item)
      }
    _ => ()
  }
}

///|
fn main {

}
