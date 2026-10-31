///|
test "value names are lower camel case and keep initialisms" {
  assert_eq(
    value_name(@ir.Name::parse("requested-quantity")),
    "requestedQuantity",
  )
  assert_eq(value_name(@ir.Name::parse("value-in-USD")), "valueInUSD")
  assert_eq(value_name(@ir.Name::parse("SDK-version")), "sdkVersion")
}

///|
test "reserved words get a trailing underscore" {
  for
    word in [
      "if", "then", "else", "case", "of", "let", "in", "type", "module", "where",
      "import", "exposing", "as", "port", "alias", "infix", "effect",
    ] {
    assert_eq(value_name(@ir.Name::parse(word)), word + "_")
  }
}

///|
test "type and module names are upper camel case" {
  assert_eq(type_name(@ir.Name::parse("rental-request")), "RentalRequest")
  assert_eq(
    module_name(@ir.Path::parse("morphir/SDK"), @ir.Path::parse("basics")),
    ["Morphir", "SDK", "Basics"],
  )
  assert_eq(
    module_name(
      @ir.Path::parse("morphir/example/app"),
      @ir.Path::parse("rentals/model"),
    ),
    ["Morphir", "Example", "App", "Rentals", "Model"],
  )
}

///|
fn attributes_with(value : @ir.Data?) -> @ir.TypeAttributes {
  let constraints : Map[String, @ir.Data] = Map([])
  if value is Some(v) {
    constraints["typeclass"] = v
  }
  { source: None, constraints, extensions: Map([]), }
}

///|
test "constraints come from the typeclass attribute" {
  assert_eq(constraint_of(attributes_with(None), "p"), None)
  assert_eq(
    constraint_of(attributes_with(Some(Text("number"))), "p"),
    Some("number"),
  )
  assert_eq(
    constraint_of(
      attributes_with(Some(Array([Text("comparable"), Text("appendable")]))),
      "p",
    ),
    Some("compappend"),
  )
  let refused = try {
    ignore(constraint_of(attributes_with(Some(Text("hashable"))), "p"))
    ""
  } catch {
    Refused(problem) => problem.code
    _ => "other"
  }
  assert_eq(refused, "elm.unsupported_constraint")
}

///|
test "constrained variables get the Elm prefix and others keep their name" {
  assert_eq(type_variable_name(@ir.Name::parse("a"), Some("number")), "numberA")
  assert_eq(
    type_variable_name(@ir.Name::parse("number"), Some("number")),
    "number",
  )
  assert_eq(
    type_variable_name(@ir.Name::parse("comparable-key"), None),
    "comparableKey",
  )
  assert_eq(type_variable_name(@ir.Name::parse("a"), None), "a")
}
