///|
test "a mapped reference to another package is recorded for elm.json" {
  let options = {
    ..Options::default(),
    mapping: Mapping::builtin().with_overrides(
      Map::from_array([
        (
          "acme/common:money#add",
          MappingEntry::Function("Money.add", Some("Money")),
        ),
      ]),
    ),
    packages: Map::from_array([
      ("acme/common", { name: "acme/common", version: "1.0.0", }),
    ]),
  }
  let value = defined(
    "total",
    Public,
    None,
    ExpressionBody([], int_type(), sdk("acme/common:money#add")),
  )
  let output = generate_module(options, module_with([value]))
  assert_true(output.foreign_packages.contains("acme/common"))
}
