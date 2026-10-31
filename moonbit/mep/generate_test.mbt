///|
let generate_tuple : Json = {
  "operation": "morphir.backend.generateModel",
  "profile": "morphir-ir",
  "codec": "morphir-json",
  "envelopeVersion": "0.1.0-draft.1",
  "irVersion": "4.0.0",
}

///|
fn generate_session() -> @mep.Session {
  let session = @mep.Session::new()
  ignore(
    result_of(
      session.receive(initialize_request("morphir.backend.generateModel")),
    ),
  )
  session
}

///|
fn compiled_model() -> Json {
  at(result_of(compile_session().receive(compile_request(shapes, "My"))), [
    "model",
  ])
}

///|
fn generate_request(model : Json, extra~ : Map[String, Json] = {}) -> String {
  let params : Map[String, Json] = {
    "model": model,
    "input": generate_tuple,
    "target": "elm",
    "contextDigest": digest,
  }
  for key, value in extra {
    params[key] = value
  }
  (
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "morphir.backend.generateModel",
      "params": Json::object(params),
    } : Json).stringify()
}

///|
test "generate writes an Elm project from a compiled model" {
  let result = result_of(
    generate_session().receive(generate_request(compiled_model())),
  )
  assert_eq(at(result, ["success"]), true)
  guard at(result, ["artifacts"]) is Array(artifacts) else {
    fail("no artifacts")
  }
  let paths = artifacts.map(a => {
    guard at(a, ["path"]) is String(path) else { abort("no path") }
    assert_eq(at(a, ["binary"]), false) catch {
      _ => abort("binary")
    }
    path
  })
  assert_true(paths.contains("elm.json"))
  assert_true(paths.contains("src/My/Shapes.elm"))
  assert_true(paths.contains("src/My/Units.elm"))
}

///|
test "generate refuses a payload whose digest does not match" {
  guard compiled_model() is Object(model) &&
    model.get("payload") is Some(Object(payload)) else {
    fail("no payload")
  }
  payload["sha256"] = Json::string("1".repeat(64))
  let reply = generate_session().receive(generate_request(Json::object(model)))
  assert_eq(error_code(reply), -32602)
}

///|
test "generate refuses another target and required guarantees" {
  let session = generate_session()
  assert_eq(
    error_code(
      session.receive(
        generate_request(compiled_model(), extra={ "target": "scala" }),
      ),
    ),
    -32602,
  )
  assert_eq(
    error_code(
      session.receive(
        generate_request(compiled_model(), extra={
          "requiredGuarantees": [{ "guarantee": "x", "scope": "y" }],
        }),
      ),
    ),
    -32602,
  )
}

///|
test "generate takes the backend options of morphir.toml" {
  let result = result_of(
    generate_session().receive(
      generate_request(compiled_model(), extra={ "options": { "width": 80 } }),
    ),
  )
  assert_eq(at(result, ["success"]), true)
  let refused = generate_session().receive(
    generate_request(compiled_model(), extra={ "options": { "width": 0 } }),
  )
  assert_eq(error_code(refused), -32602)
}
