///|
/// The diagnostic code for a request that names package dependencies, which the extension does not support yet.
pub const UNSUPPORTED_DEPENDENCIES : String = "elm.unsupported_dependencies"

///|
fn admission(reason : String) -> RpcError {
  invalid_params("Compilation admission refused: \{reason}")
}

///|
fn is_absolute(uri : String) -> Bool {
  uri.has_prefix("/") ||
  uri.contains("://") ||
  ({
    let chars = uri.to_array()
    chars.length() >= 3 && chars[1] == ':' && chars[2] == '/'
  })
}

///|
/// The source path of a document, relative to the sources root.
fn relative_path(uri : String, root : String?) -> String raise RpcError {
  let path = if is_absolute(uri) {
    guard root is Some(root) else { raise admission("invalid_source_root") }
    let prefix = if root.has_suffix("/") { root } else { root + "/" }
    guard uri.has_prefix(prefix) else { raise admission("invalid_source_root") }
    uri[prefix.length():].to_owned()
  } else {
    uri
  }
  let segments = path.split("/").map(s => s.to_owned()).collect()
  if path == "" ||
    segments.iter().any(s => s == "" || s == "." || s == "..") ||
    path.contains("\\") {
    raise admission("invalid_request")
  }
  path
}

///|
fn diagnostic(
  severity : String,
  code : String,
  message : String,
  uri : String?,
  location : @v4.SourceLocation?,
) -> Json {
  let fields : Map[String, Json] = {
    "severity": Json(severity),
    "code": Json(code),
    "message": Json(message),
  }
  match (uri, location) {
    (Some(uri), Some(range)) =>
      fields["location"] = {
        "uri": uri,
        "range": {
          "start": {
            "line": range.start_line - 1,
            "character": range.start_column - 1,
          },
          "end": {
            "line": range.end_line - 1,
            "character": range.end_column - 1,
          },
        },
      }
    (Some(uri), None) => fields["data"] = { "uri": uri }
    _ => ()
  }
  Json::object(fields)
}

///|
fn failure(diagnostics : Array[Json]) -> Json {
  { "success": false, "diagnostics": Json::array(diagnostics) }
}

///|
fn compile_model(
  params : Map[String, Json],
  tuple : Tuple,
  limits : Limits,
) -> Json raise RpcError {
  require_tuple(params.get("output"), tuple, "output")
  guard params.get("languageId") is Some(String("elm")) else {
    raise admission("unsupported_language")
  }
  guard params.get("contextDigest") is Some(String(digest)) &&
    is_lower_hex(digest, 64) else {
    raise admission("invalid_request")
  }
  let options = match params.get("options") {
    None => Map([])
    Some(Object(options)) => options
    Some(_) => raise admission("invalid_request")
  }
  match options.get("irVersion") {
    None => ()
    Some(String(v)) if v == tuple.ir_version => ()
    Some(_) => raise admission("unsupported_ir_version")
  }
  match options.get("profile") {
    None | Some(String("library")) => ()
    Some(_) => raise admission("unsupported_profile")
  }
  guard params.get("package") is Some(Object(package_fields)) &&
    package_fields.get("name") is Some(String(package_name)) &&
    package_name != "" else {
    raise admission("invalid_request")
  }
  let exposed : Array[String]? = match package_fields.get("exposedModules") {
    None => None
    Some(Array(items)) =>
      Some(
        items.map(item => {
          guard item is String(name) && name != "" else {
            raise admission("invalid_request")
          }
          name
        }),
      )
    Some(_) => raise admission("invalid_request")
  }
  guard params.get("sources") is Some(Object(sources)) &&
    sources.get("documents") is Some(Array(documents)) &&
    !documents.is_empty() else {
    raise admission("unsupported_source_count")
  }
  let root = match sources.get("root") {
    None => None
    Some(String(root)) => Some(root)
    Some(_) => raise admission("invalid_source_root")
  }
  // The frontend names files by their source path; diagnostics name them by the request's URI.
  let uris : Map[String, String] = Map([])
  let elm_sources : Array[@frontend.ElmSource] = []
  for document in documents {
    guard document is Object(fields) &&
      fields.get("uri") is Some(String(uri)) &&
      fields.get("text") is Some(String(text)) &&
      fields.get("languageId") is (None | Some(String("elm"))) else {
      raise admission("invalid_request")
    }
    let path = relative_path(uri, root)
    if uris.contains(path) {
      raise admission("invalid_request")
    }
    uris[path] = uri
    elm_sources.push({ path, content: text, })
  }
  match params.get("dependencies") {
    None | Some(Array([])) => ()
    Some(Array(_)) =>
      return failure([
        diagnostic(
          "error",
          UNSUPPORTED_DEPENDENCIES,
          "The Elm extension does not support package dependencies yet",
          None,
          None,
        ),
      ])
    Some(_) => raise admission("invalid_request")
  }
  fn problems(failed : Array[@frontend.ElmProblem]) -> Json {
    failure(
      failed.map(p => {
        diagnostic("error", p.code, p.message, uris.get(p.path), p.location)
      }),
    )
  }

  let exposed = match exposed {
    Some(exposed) => exposed
    None =>
      package_modules(elm_sources, package_name) catch {
        @frontend.ElmFailed(failed) => return problems(failed)
      }
  }
  let output = @frontend.compile_project_output(
    elm_sources,
    package_name,
    exposed,
    output=Referenced,
  ) catch {
    @frontend.ElmFailed(failed) => return problems(failed)
  }
  let ir_text = @ir_json.write(output.ir) catch {
    error =>
      return failure([
        diagnostic("error", "elm.internal", error.to_string(), None, None),
      ])
  }
  let model_id = "urn:finos:morphir-elm:model:" +
    sha256_hex(@utf8.encode(package_name))
  guard envelope(ir_text, model_id, limits) is Some(model) else {
    return failure([
      diagnostic(
        "error",
        "elm.model_limit",
        "The compiled model is larger than the agreed model limits",
        None,
        None,
      ),
    ])
  }
  {
    "success": true,
    "model": model,
    "diagnostics": [],
    "modules": Json(exposed),
  }
}

///|
/// Every module of the package, relative to the package, as `exposedModules` in morphir.json names them.
fn package_modules(
  sources : Array[@frontend.ElmSource],
  package_name : String,
) -> Array[String] raise @frontend.ElmFailed {
  let prefix = package_name.replace_all(old="/", new=".") + "."
  let names : Array[String] = []
  for parsed in @frontend.parse_modules(sources, package_name) {
    let name = parsed.name.join(".")
    if name.has_prefix(prefix) {
      names.push(name[prefix.length():].to_owned())
    }
  }
  names
}
