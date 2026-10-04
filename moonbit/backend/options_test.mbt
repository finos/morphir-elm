///|
fn options_code(json : Json) -> String {
  try {
    ignore(@elm.Options::from_json(json))
    ""
  } catch {
    Refused(problem) => problem.code
    _ => "other"
  }
}

///|
test "defaults match the spec" {
  let options = @elm.Options::default()
  assert_eq(options.profile, Model)
  assert_eq(options.placeholders, Refuse)
  assert_eq(options.width, 120)
  assert_eq(options.elm_package, {
    name: "finos/morphir-elm",
    version: "22.0.2",
  })
  assert_eq(options.elm_package.range(), "22.0.2 <= v < 23.0.0")
  assert_true(options.warnings.is_empty())
}

///|
test "all options read from a table" {
  let json : Json = {
    "profile": "literal",
    "placeholders": "debug-todo",
    "width": 80,
    "elm_package": "finos/morphir-elm 21.0.1",
    "mapping": { "morphir/SDK:basics#max": {} },
    "packages": { "acme/common": { "package": "acme/common 1.0.0" } },
  }
  let options = @elm.Options::from_json(json)
  assert_eq(options.profile, Literal)
  assert_eq(options.placeholders, DebugTodo)
  assert_eq(options.width, 80)
  assert_eq(options.elm_package.version, "21.0.1")
  assert_eq(
    options.packages.get("acme/common"),
    Some({ name: "acme/common", version: "1.0.0", }),
  )
  // A literal profile ignores the mapping and says so.
  assert_eq(options.warnings, [
    "backends.elm.mapping is ignored by the literal profile",
  ])
}

///|
test "invalid options are refused" {
  assert_eq(options_code({ "colour": "red" }), "elm.invalid_option")
  assert_eq(options_code({ "profile": "fancy" }), "elm.invalid_option")
  assert_eq(options_code({ "width": 0 }), "elm.invalid_option")
  assert_eq(
    options_code({ "elm_package": "morphir-elm" }),
    "elm.invalid_option",
  )
  assert_eq(
    options_code({ "packages": { "acme/common": { "source": "../src" } } }),
    "elm.invalid_option",
  )
  assert_eq(
    options_code({ "mapping": { "bad": { "function": "f" } } }),
    "elm.invalid_mapping",
  )
}

///|
test "validate_options raises for engines" {
  @elm.validate_options({})
  let failed = try {
    @elm.validate_options({ "profile": 1 })
    false
  } catch {
    _ => true
  }
  assert_true(failed)
}

///|
fn package_ref_code(text : String) -> String {
  try {
    ignore(@elm.ElmPackageRef::parse(text, "backends.elm.elm_package"))
    ""
  } catch {
    Refused(problem) => problem.code
    _ => "other"
  }
}

///|
test "package versions must be numeric" {
  assert_eq(package_ref_code("acme/pkg x.y.z"), "elm.invalid_option")
  assert_eq(package_ref_code("/ 1.2.3"), "elm.invalid_option")
  assert_eq(package_ref_code("a/b 1.2"), "elm.invalid_option")
  assert_eq(package_ref_code("a/b 1.-2.3"), "elm.invalid_option")
  assert_eq(package_ref_code("a/b 1.2.3"), "")
}
