///|
fn response(reply : @mep.Reply) -> Json {
  guard reply is Response(text) else {
    abort("expected a response, got \{@debug.to_string(reply)}")
  }
  @json.parse(text) catch {
    _ => abort("the response is not JSON: \{text}")
  }
}

///|
fn result_of(reply : @mep.Reply) -> Json {
  guard response(reply) is Object(fields) &&
    fields.get("result") is Some(result) else {
    abort("expected a result")
  }
  result
}

///|
fn error_code(reply : @mep.Reply) -> Double {
  guard response(reply) is Object(fields) &&
    fields.get("error") is Some(Object(error)) &&
    error.get("code") is Some(Number(code, ..)) else {
    abort("expected an error")
  }
  code
}

///|
fn at(value : Json, path : Array[String]) -> Json {
  let mut current = value
  for key in path {
    guard current is Object(fields) && fields.get(key) is Some(next) else {
      abort("no member \{key}")
    }
    current = next
  }
  current
}

///|
let describe_request : String = "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"morphir.extension.describe\",\"params\":{\"protocolVersions\":[\"0.2.0-draft.1\",\"0.1\"]}}"

///|
fn initialize_request(operation : String) -> String {
  "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"morphir.initialize\",\"params\":{\"protocolVersions\":[\"0.2.0-draft.1\"],\"host\":{\"name\":\"test\",\"version\":\"1\"},\"modelTransport\":{\"tuples\":[{\"operation\":\"\{operation}\",\"profile\":\"morphir-ir\",\"codec\":\"morphir-json\",\"envelopeVersion\":\"0.1.0-draft.1\",\"irVersion\":\"4.0.0\"},{\"operation\":\"\{operation}\",\"profile\":\"morphir-model\",\"codec\":\"ion-binary\",\"envelopeVersion\":\"0.1.0-draft.1\",\"irVersion\":\"4.0.0\"}],\"limits\":{\"maxEncodedBytes\":5000000,\"maxDecodedBytes\":1000000,\"maxDepth\":64,\"maxNodes\":100000},\"guarantees\":[]}}}"
}

///|
test "describe reports the Elm extension's claims" {
  let claims = result_of(@mep.Session::new().receive(describe_request))
  assert_eq(at(claims, ["claimsVersion"]), Json::string("0.1.0-draft.2"))
  assert_eq(at(claims, ["extension", "id"]), Json::string("morphir-elm"))
  assert_eq(at(claims, ["extension", "version"]), Json::string(@mep.VERSION))
  assert_eq(at(claims, ["extension", "types"]), ["frontend", "backend"])
  assert_eq(at(claims, ["capabilities", "frontend", "languages"]), [
    { "id": "elm", "fileExtensions": [".elm"] },
  ])
  assert_eq(at(claims, ["capabilities", "frontend", "multiDocument"]), true)
  assert_eq(at(claims, ["capabilities", "backend", "targets"]), ["elm"])
  assert_eq(claims, @mep.claims())
}

///|
test "describe refuses a protocol it does not speak" {
  let reply = @mep.Session::new().receive(
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"morphir.extension.describe\",\"params\":{\"protocolVersions\":[\"0.1\"]}}",
  )
  assert_eq(error_code(reply), -32011)
}

///|
test "describe refuses a missing protocol list" {
  let reply = @mep.Session::new().receive(
    "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"morphir.extension.describe\",\"params\":{}}",
  )
  assert_eq(error_code(reply), -32602)
}

///|
test "initialize keeps the JSON tuple and the smaller limits" {
  let session = @mep.Session::new()
  let result = result_of(
    session.receive(initialize_request("morphir.frontend.compileModel")),
  )
  assert_eq(at(result, ["protocolVersion"]), Json::string("0.2.0-draft.1"))
  assert_eq(at(result, ["capabilities", "modelTransport", "tuples"]), [
    {
      "operation": "morphir.frontend.compileModel",
      "profile": "morphir-ir",
      "codec": "morphir-json",
      "envelopeVersion": "0.1.0-draft.1",
      "irVersion": "4.0.0",
    },
  ])
  assert_eq(at(result, ["capabilities", "modelTransport", "limits"]), {
    "maxEncodedBytes": 2796204,
    "maxDecodedBytes": 1000000,
    "maxDepth": 64,
    "maxNodes": 100000,
  })
  // The live claims repeat the described frontend and backend.
  let described = @mep.claims()
  assert_eq(
    at(result, ["capabilities", "frontend"]),
    at(described, ["capabilities", "frontend"]),
  )
  assert_eq(
    at(result, ["capabilities", "backend"]),
    at(described, ["capabilities", "backend"]),
  )
}

///|
test "a full session answers each request once and exits" {
  let session = @mep.Session::new()
  ignore(result_of(session.receive(describe_request)))
  ignore(
    result_of(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
  )
  assert_eq(
    session.receive("{\"jsonrpc\":\"2.0\",\"method\":\"morphir.initialized\"}"),
    Notified,
  )
  assert_eq(
    result_of(
      session.receive(
        "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"morphir.shutdown\",\"params\":{}}",
      ),
    ),
    Json::object({}),
  )
  assert_eq(
    error_code(
      session.receive(
        "{\"jsonrpc\":\"2.0\",\"id\":4,\"method\":\"morphir.ping\",\"params\":{}}",
      ),
    ),
    -32014,
  )
  assert_eq(
    session.receive("{\"jsonrpc\":\"2.0\",\"method\":\"morphir.exit\"}"),
    Exited,
  )
  assert_true(session.exited())
}

///|
test "an unknown method is method-not-found and the session stays usable" {
  let session = @mep.Session::new()
  ignore(
    result_of(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
  )
  assert_eq(
    error_code(
      session.receive(
        "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"morphir.unknown\",\"params\":{}}",
      ),
    ),
    -32601,
  )
  assert_eq(
    result_of(
      session.receive(
        "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"morphir.ping\",\"params\":{}}",
      ),
    ),
    Json::object({}),
  )
}

///|
test "requests before initialize are refused" {
  let reply = @mep.Session::new().receive(
    "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"morphir.frontend.compileModel\",\"params\":{}}",
  )
  assert_eq(error_code(reply), -32014)
}

///|
test "an operation that was not negotiated is refused" {
  let session = @mep.Session::new()
  ignore(
    result_of(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
  )
  let reply = session.receive(
    "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"morphir.backend.generateModel\",\"params\":{}}",
  )
  assert_eq(error_code(reply), -32013)
}

///|
test "a second initialize is an invalid request" {
  let session = @mep.Session::new()
  ignore(
    result_of(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
  )
  assert_eq(
    error_code(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
    -32600,
  )
}

///|
test "text that is not JSON is a parse error" {
  assert_eq(error_code(@mep.Session::new().receive("{not json")), -32700)
}
