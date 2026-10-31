///|
fn generate_model(
  params : Map[String, Json],
  tuple : Tuple,
  limits : Limits,
) -> Json raise RpcError {
  require_tuple(params.get("input"), tuple, "input")
  guard params.get("target") is Some(String(target)) else {
    raise invalid_params("Generation admission refused: invalid_request")
  }
  if target != TARGET {
    raise invalid_params("Generation admission refused: unsupported_target")
  }
  match params.get("requiredGuarantees") {
    None | Some(Array([])) => ()
    _ =>
      raise invalid_params(
        "Generation admission refused: unknown_required_guarantee",
      )
  }
  match params.get("contextDigest") {
    None => ()
    Some(String(digest)) if is_lower_hex(digest, 64) => ()
    Some(_) =>
      raise invalid_params("Generation admission refused: invalid_request")
  }
  // The options are the [backends.elm] table of morphir.toml.
  let options = match params.get("options") {
    None => @backend.Options::default()
    Some(Object(fields)) if fields.is_empty() => @backend.Options::default()
    Some(Object(_) as options) =>
      @backend.Options::from_json(options) catch {
        error =>
          raise invalid_params(
            "Generation admission refused: invalid_options (\{@debug.to_string(error)})",
          )
      }
    Some(_) =>
      raise invalid_params("Generation admission refused: invalid_options")
  }
  let ir_text = open_envelope(params.get("model"), limits)
  let ir = read_ir(ir_text) catch {
    _ => raise invalid_params("Model admission refused: invalid_model")
  }
  let output = @backend.generate(TARGET, ir, options) catch {
    Refused(problem) => return generation_failure([problem])
    Failed(problems) => return generation_failure(problems)
  }
  {
    "success": true,
    "artifacts": output.files.map(file => {
      ({ "path": file.path, "content": file.content, "binary": false } : Json)
    }),
    "diagnostics": (options.warnings + output.warnings).map(w => {
      diagnostic("warning", "elm.warning", w, None, None)
    }),
  }
}

///|
fn generation_failure(problems : Array[@backend.Problem]) -> Json {
  failure(
    problems.map(p => {
      let message = if p.node_path == "" {
        p.detail
      } else {
        "\{p.node_path}: \{p.detail}"
      }
      diagnostic("error", p.code, message, None, None)
    }),
  )
}

///|
/// Reads Morphir JSON IR at format version 4.
fn read_ir(text : String) -> @v4.IRFile raise {
  let json = @json.parse(text)
  guard json is Object(fields) &&
    fields.get("formatVersion")
    is (Some(Number(4.0, ..)) | Some(String("4.0.0"))) else {
    fail("not Morphir IR at format version 4")
  }
  @ir_json.from_json(json)
}
