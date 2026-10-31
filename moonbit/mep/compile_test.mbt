///|
let digest : String = "0000000000000000000000000000000000000000000000000000000000000000"

///|
let compile_tuple : Json = {
  "operation": "morphir.frontend.compileModel",
  "profile": "morphir-ir",
  "codec": "morphir-json",
  "envelopeVersion": "0.1.0-draft.1",
  "irVersion": "4.0.0",
}

///|
fn compile_session() -> @mep.Session {
  let session = @mep.Session::new()
  ignore(
    result_of(
      session.receive(initialize_request("morphir.frontend.compileModel")),
    ),
  )
  session
}

///|
fn compile_request(
  documents : Array[(String, String)],
  package_name : String,
  extra~ : Map[String, Json] = {},
) -> String {
  let params : Map[String, Json] = {
    "languageId": "elm",
    "sources": {
      "documents": Json::array(
        documents.map(d => {
          ({ "uri": d.0, "languageId": "elm", "version": 0, "text": d.1 } : Json)
        }),
      ),
    },
    "package": { "name": package_name },
    "options": { "irVersion": "4.0.0" },
    "contextDigest": digest,
    "output": compile_tuple,
  }
  for key, value in extra {
    params[key] = value
  }
  (
    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "morphir.frontend.compileModel",
      "params": Json::object(params),
    } : Json).stringify()
}

///|
let shapes : Array[(String, String)] = [
  (
    "My/Shapes.elm", "module My.Shapes exposing (..)\n\nimport My.Units exposing (Length)\n\n\ntype Shape\n    = Circle Length\n    | Square Length\n\n\narea : Shape -> Float\narea shape =\n    case shape of\n        Circle r ->\n            3.14 * r * r\n\n        Square s ->\n            s * s\n",
  ),
  (
    "My/Units.elm", "module My.Units exposing (Length)\n\n\ntype alias Length =\n    Float\n",
  ),
]

///|
fn payload_text(model : Json) -> String {
  guard at(model, ["payload", "content"]) is String(content) else {
    abort("no content")
  }
  @utf8.decode(@base64.decode(content)) catch {
    _ => abort("bad payload")
  }
}

///|
test "compile returns the frontend's IR for a package of several modules" {
  let result = result_of(
    compile_session().receive(compile_request(shapes, "My")),
  )
  assert_eq(at(result, ["success"]), true)
  assert_eq(at(result, ["diagnostics"]), [])
  let model = at(result, ["model"])
  assert_eq(at(model, ["profile"]), Json::string("morphir-ir"))
  assert_eq(at(model, ["payload", "codec"]), Json::string("morphir-json"))
  let expected = @frontend.compile_project_output(
    shapes.map(s => ({ path: s.0, content: s.1, } : @frontend.ElmSource)),
    "My",
    ["Shapes", "Units"],
    output=Referenced,
  )
  assert_eq(payload_text(model), @ir_json.write(expected.ir))
  assert_eq(at(result, ["modules"]), ["Shapes", "Units"])
}

///|
test "compile accepts a package of one module" {
  let result = result_of(
    compile_session().receive(compile_request([shapes[1]], "My")),
  )
  assert_eq(at(result, ["success"]), true)
}

///|
test "compile exposes only the modules that the request names" {
  let result = result_of(
    compile_session().receive(
      compile_request(shapes, "My", extra={
        "package": { "name": "My", "exposedModules": ["Units"] },
      }),
    ),
  )
  assert_eq(at(result, ["modules"]), ["Units"])
}

///|
test "a port is an unsupported-construct diagnostic with its location" {
  let source = "port module My.Ports exposing (..)\n\n\nport send : String -> Cmd msg\n"
  let result = result_of(
    compile_session().receive(compile_request([("My/Ports.elm", source)], "My")),
  )
  assert_eq(at(result, ["success"]), false)
  guard at(result, ["diagnostics"]) is Array(diagnostics) &&
    diagnostics is [first, ..] else {
    fail("no diagnostics")
  }
  assert_eq(at(first, ["severity"]), Json::string("error"))
  assert_eq(at(first, ["code"]), Json::string("elm.unsupported"))
  assert_eq(at(first, ["location", "uri"]), Json::string("My/Ports.elm"))
  guard result is Object(fields) else { fail("not an object") }
  assert_false(fields.contains("model"))
}

///|
test "package dependencies are refused with a diagnostic" {
  let result = result_of(
    compile_session().receive(
      compile_request(shapes, "My", extra={
        "dependencies": [{ "packageName": "acme/common", "model": {} }],
      }),
    ),
  )
  assert_eq(at(result, ["success"]), false)
  assert_eq(at(result, ["diagnostics"]), [
    {
      "severity": "error",
      "code": @mep.UNSUPPORTED_DEPENDENCIES,
      "message": "The Elm extension does not support package dependencies yet",
    },
  ])
}

///|
test "compile refuses another language, a bad digest and a dot segment" {
  let session = compile_session()
  assert_eq(
    error_code(
      session.receive(
        compile_request(shapes, "My", extra={ "languageId": "moonbit" }),
      ),
    ),
    -32602,
  )
  assert_eq(
    error_code(
      session.receive(
        compile_request(shapes, "My", extra={ "contextDigest": "x" }),
      ),
    ),
    -32602,
  )
  assert_eq(
    error_code(
      session.receive(
        compile_request([("../Up.elm", "module Up exposing (..)\n")], "My"),
      ),
    ),
    -32602,
  )
}

///|
test "compile refuses an output tuple that was not negotiated" {
  let result = compile_session().receive(
    compile_request(shapes, "My", extra={
      "output": {
        "operation": "morphir.frontend.compileModel",
        "profile": "morphir-model",
        "codec": "ion-binary",
        "envelopeVersion": "0.1.0-draft.1",
        "irVersion": "4.0.0",
      },
    }),
  )
  assert_eq(error_code(result), -32602)
}
