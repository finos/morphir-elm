// The agreed maxDepth and maxNodes limits on the model payload (bead morphir-ukvn.1.19). The MoonBit host and the
// Elm classic extension count the same way: the root value is level 1, and each JSON value (object, array, string,
// number, boolean or null, but not an object key) is one node.

///|
/// The nesting levels and the number of values of a JSON text, counted from the parsed tree.
fn shape_of(text : String) -> (Int32, Int32) {
  let json = @json.parse(text) catch { _ => abort("the payload is not JSON") }
  let mut levels = 0
  let mut nodes = 0
  let pending : Array[(Json, Int32)] = [(json, 1)]
  while pending.pop() is Some((value, level)) {
    nodes += 1
    if level > levels {
      levels = level
    }
    match value {
      Array(values) =>
        for child in values {
          pending.push((child, level + 1))
        }
      Object(fields) =>
        for _, child in fields {
          pending.push((child, level + 1))
        }
      _ => ()
    }
  }
  (levels, nodes)
}

///|
fn session_with_limits(
  operation : String,
  max_depth~ : Int32 = 128,
  max_nodes~ : Int32 = 100000,
) -> @mep.Session {
  let tuple : Json = {
    "operation": operation,
    "profile": "morphir-ir",
    "codec": "morphir-json",
    "envelopeVersion": "0.1.0-draft.1",
    "irVersion": "4.0.0",
  }
  let request : Json = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "morphir.initialize",
    "params": {
      "protocolVersions": ["0.2.0-draft.1"],
      "host": { "name": "test", "version": "1" },
      "modelTransport": {
        "tuples": [tuple],
        "limits": {
          "maxEncodedBytes": 5000000,
          "maxDecodedBytes": 1000000,
          "maxDepth": max_depth,
          "maxNodes": max_nodes,
        },
        "guarantees": [],
      },
    },
  }
  let session = @mep.Session::new()
  ignore(result_of(session.receive(request.stringify())))
  session
}

///|
/// The shape of the IR that compileModel writes for `shapes`.
fn compiled_shape() -> (Int32, Int32) {
  shape_of(payload_text(compiled_model()))
}

///|
fn compile_with_limits(
  max_depth~ : Int32 = 128,
  max_nodes~ : Int32 = 100000,
) -> Json {
  result_of(
    session_with_limits("morphir.frontend.compileModel", max_depth~, max_nodes~).receive(
      compile_request(shapes, "My"),
    ),
  )
}

///|
fn assert_model_limit(result : Json) -> Unit raise {
  assert_eq(at(result, ["success"]), false)
  guard at(result, ["diagnostics"]) is Array([diagnostic]) else {
    fail("expected one diagnostic")
  }
  assert_eq(at(diagnostic, ["code"]), Json::string("elm.model_limit"))
  guard result is Object(fields) else { fail("expected an object") }
  assert_false(fields.contains("model"))
}

///|
fn generate_with_limits(
  max_depth~ : Int32 = 128,
  max_nodes~ : Int32 = 100000,
) -> @mep.Reply {
  session_with_limits("morphir.backend.generateModel", max_depth~, max_nodes~).receive(
    generate_request(compiled_model()),
  )
}

///|
fn error_message(reply : @mep.Reply) -> Json {
  at(response(reply), ["error", "message"])
}

///|
fn assert_admission_model_limit(reply : @mep.Reply) -> Unit raise {
  assert_eq(error_code(reply), -32602)
  assert_eq(
    error_message(reply),
    Json::string("Model admission refused: model_limit"),
  )
}

///|
test "the compiled model has more than one level and value" {
  let (levels, nodes) = compiled_shape()
  assert_true(levels > 2)
  assert_true(nodes > 100)
}

///|
test "compile accepts a model at exactly the agreed depth and node limits" {
  let (levels, nodes) = compiled_shape()
  let result = compile_with_limits(max_depth=levels, max_nodes=nodes)
  assert_eq(at(result, ["success"]), true)
  assert_eq(shape_of(payload_text(at(result, ["model"]))), (levels, nodes))
}

///|
test "compile answers elm.model_limit one level over the agreed depth" {
  let (levels, _) = compiled_shape()
  assert_model_limit(compile_with_limits(max_depth=levels - 1))
}

///|
test "compile answers elm.model_limit far over the agreed depth" {
  assert_model_limit(compile_with_limits(max_depth=1))
}

///|
test "compile answers elm.model_limit one value over the agreed node count" {
  let (_, nodes) = compiled_shape()
  assert_model_limit(compile_with_limits(max_nodes=nodes - 1))
}

///|
test "compile answers elm.model_limit far over the agreed node count" {
  assert_model_limit(compile_with_limits(max_nodes=1))
}

///|
test "generate accepts a model at exactly the agreed depth and node limits" {
  let (levels, nodes) = compiled_shape()
  let result = result_of(
    generate_with_limits(max_depth=levels, max_nodes=nodes),
  )
  assert_eq(at(result, ["success"]), true)
}

///|
test "generate refuses a model one level over the agreed depth" {
  let (levels, _) = compiled_shape()
  assert_admission_model_limit(generate_with_limits(max_depth=levels - 1))
}

///|
test "generate refuses a model far over the agreed depth" {
  assert_admission_model_limit(generate_with_limits(max_depth=1))
}

///|
test "generate refuses a model one value over the agreed node count" {
  let (_, nodes) = compiled_shape()
  assert_admission_model_limit(generate_with_limits(max_nodes=nodes - 1))
}

///|
test "generate refuses a model far over the agreed node count" {
  assert_admission_model_limit(generate_with_limits(max_nodes=1))
}
