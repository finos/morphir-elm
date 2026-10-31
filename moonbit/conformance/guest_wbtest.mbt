///|
/// A compile session of the Elm extension, as the MoonBit CLI's worker host opens it.
fn guest_compile(project : ParityProject) -> Json {
  let tuple : Json = {
    "operation": "morphir.frontend.compileModel",
    "profile": "morphir-ir",
    "codec": "morphir-json",
    "envelopeVersion": "0.1.0-draft.1",
    "irVersion": "4.0.0",
  }
  let session = @mep.Session::new()
  ignore(
    session.receive(
      (
        {
          "jsonrpc": "2.0",
          "id": 1,
          "method": "morphir.initialize",
          "params": {
            "protocolVersions": ["0.2.0-draft.1"],
            "host": { "name": "conformance", "version": "0" },
            "modelTransport": {
              "tuples": [tuple],
              "limits": {
                "maxEncodedBytes": 2796204,
                "maxDecodedBytes": 2097152,
                "maxDepth": 128,
                "maxNodes": 100000,
              },
              "guarantees": [],
            },
          },
        } : Json).stringify(),
    ),
  )
  let request : Json = {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "morphir.frontend.compileModel",
    "params": {
      "languageId": "elm",
      "sources": {
        "documents": Json::array(
          project.sources.map(s => {
            (
              { "uri": s.0, "languageId": "elm", "version": 0, "text": s.1 } :
              Json)
          }),
        ),
      },
      "package": {
        "name": project.package_name,
        "exposedModules": Json(project.exposed),
      },
      "options": { "irVersion": "4.0.0" },
      "contextDigest": "0".repeat(64),
      "output": tuple,
    },
  }
  guard session.receive(request.stringify()) is Response(text) &&
    (@json.parse(text) catch { _ => Json::null() }) is Object(fields) &&
    fields.get("result") is Some(result) else {
    abort("\{project.name}: no compile result")
  }
  result
}

///|
test "the extension's model equals the frontend's IR for every conformance project" {
  let compiled : Array[String] = []
  for project in parity_projects() {
    let result = guest_compile(project)
    let expected = @frontend.compile_project_output(
      project.sources.map(s => {
        ({ path: s.0, content: s.1, } : @frontend.ElmSource)
      }),
      project.package_name,
      project.exposed,
      output=Referenced,
    ) catch {
      @frontend.ElmFailed(problems) => {
        // The extension reports the same problems as diagnostics, and returns no model.
        guard result is Object(fields) &&
          fields.get("success") is Some(False) &&
          !fields.contains("model") &&
          fields.get("diagnostics") is Some(Array(diagnostics)) else {
          fail("\{project.name}: expected a failure without a model")
        }
        assert_eq(
          diagnostics.map(d => {
            guard d is Object(f) && f.get("code") is Some(String(code)) else {
              abort("no code")
            }
            code
          }),
          problems.map(p => p.code),
        )
        continue
      }
    }
    guard result is Object(fields) &&
      fields.get("success") is Some(True) &&
      fields.get("model") is Some(Object(model)) &&
      model.get("payload") is Some(Object(payload)) &&
      payload.get("content") is Some(String(content)) else {
      fail("\{project.name}: expected a model")
    }
    let text = @utf8.decode(@base64.decode(content))
    assert_eq(text, @ir_json.write(expected.ir))
    compiled.push(project.name)
  }
  // 17 of the 22 projects compile; the other 5 need SDK modules that the frontend does not have yet.
  assert_eq(compiled.length(), 17)
}
