///|
/// Checks that `text` has exactly `levels` levels and `nodes` values: it fits those limits and not one less of each.
fn assert_shape(text : String, levels : Int32, nodes : Int32) -> Unit raise {
  assert_true(within_shape(text, MaxDepth(levels), MaxNodes(nodes)))
  assert_false(within_shape(text, MaxDepth(levels - 1), MaxNodes(nodes)))
  assert_false(within_shape(text, MaxDepth(levels), MaxNodes(nodes - 1)))
}

///|
test "within_shape counts as the host and the Elm classic extension count" {
  // The same cases as cli2/mep/model.test.ts jsonShape.
  assert_shape("1", 1, 1)
  assert_shape("[]", 1, 1)
  assert_shape("{\"a\":[1,2]}", 3, 4)
  assert_shape("{}", 1, 1)
  assert_shape(" { \"a\" : { \"b\" : null } , \"c\" : true } ", 3, 4)
  assert_shape("[[[]],{},\"x\",-1.5e+3,false]", 3, 7)
}

///|
test "within_shape reads object keys and brackets in strings as text" {
  assert_shape("{\"[{\":\"}]\",\"k\\\"\":[\"\\\\\",\"\\\"]\"]}", 3, 5)
  assert_shape("[\"a,b\",\"c:d\"]", 2, 3)
}

///|
test "within_shape stops at the first level over the limit" {
  let deep = "[".repeat(1000000) + "]".repeat(1000000)
  assert_false(within_shape(deep, MaxDepth(128), MaxNodes(2000000)))
  assert_true(within_shape(deep, MaxDepth(1000000), MaxNodes(1000000)))
}
