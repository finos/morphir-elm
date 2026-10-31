///|
/// What the guest answers to one message.
pub(all) enum Reply {
  /// A response, as JSON-RPC text.
  Response(String)
  /// The message was a notification; there is no response.
  Notified
  /// The message was `morphir.exit`; the session has ended.
  Exited
} derive(Eq, Debug)

///|
pub extend Reply with Eq::{equal, not_equal}

///|
pub extend Reply with @debug.Debug::{to_repr}

///|
priv enum Phase {
  Fresh
  Ready(Array[Tuple], Limits)
  ShutDown
  Gone
}

///|
/// One MEP session. A guest instance holds one session for its whole life.
pub struct Session {
  priv mut phase : Phase
}

///|
pub fn Session::new() -> Session {
  { phase: Fresh, }
}

///|
pub fn Session::exited(self : Session) -> Bool {
  self.phase is Gone
}

///|
/// A JSON-RPC error for a request.
priv suberror RpcError {
  RpcError(Int32, String)
}

///|
fn rpc_error(id : Json, code : Int32, message : String) -> Reply {
  Response(
    (
      {
        "jsonrpc": "2.0",
        "id": id,
        "error": { "code": code, "message": message },
      } : Json).stringify(),
  )
}

///|
fn rpc_result(id : Json, result : Json) -> Reply {
  Response(
    ({ "jsonrpc": "2.0", "id": id, "result": result } : Json).stringify(),
  )
}

///|
fn invalid_params(message : String) -> RpcError {
  RpcError(-32602, message)
}

///|
/// Answers one JSON-RPC message.
pub fn Session::receive(self : Session, text : String) -> Reply {
  if self.phase is Gone {
    return rpc_error(Json::null(), -32600, "The session has exited")
  }
  let message = @json.parse(text) catch {
    _ => return rpc_error(Json::null(), -32700, "Parse error")
  }
  guard message is Object(fields) &&
    fields.get("jsonrpc") is Some(String("2.0")) &&
    fields.get("method") is Some(String(name)) else {
    return rpc_error(Json::null(), -32600, "Invalid JSON-RPC request")
  }
  let params = fields.get("params").unwrap_or(Json::object({}))
  guard fields.get("id") is Some(id) else { return self.notify(name) }
  guard id is (Number(_, ..) | String(_)) else {
    return rpc_error(Json::null(), -32600, "Invalid JSON-RPC request id")
  }
  guard params is Object(params) else {
    return rpc_error(id, -32602, "params must be an object")
  }
  let result = self.request(name, params) catch {
    RpcError(code, message) => return rpc_error(id, code, message)
  }
  rpc_result(id, result)
}

///|
fn Session::notify(self : Session, name : String) -> Reply {
  if name == "morphir.exit" {
    self.phase = Gone
    return Exited
  }
  // morphir.initialized and any other notification need no answer.
  Notified
}

///|
fn Session::request(
  self : Session,
  name : String,
  params : Map[String, Json],
) -> Json raise RpcError {
  if self.phase is ShutDown {
    raise RpcError(-32014, "Session has shut down")
  }
  match name {
    "morphir.extension.describe" => {
      require_protocol(params)
      claims()
    }
    "morphir.initialize" => self.initialize(params)
    "morphir.ping" => Json::object({})
    _ => {
      guard self.phase is Ready(tuples, limits) else {
        raise RpcError(-32014, "Session is not initialized")
      }
      match name {
        "morphir.shutdown" => {
          self.phase = ShutDown
          Json::object({})
        }
        "morphir.frontend.compileModel" =>
          compile_model(params, negotiated(tuples, COMPILE_MODEL), limits)
        "morphir.backend.generateModel" =>
          generate_model(params, negotiated(tuples, GENERATE_MODEL), limits)
        _ => raise RpcError(-32601, "Method not found: \{name}")
      }
    }
  }
}

///|
fn negotiated(
  tuples : Array[Tuple],
  operation : String,
) -> Tuple raise RpcError {
  for tuple in tuples {
    if tuple.operation == operation {
      return tuple
    }
  }
  raise RpcError(-32013, "\{operation} was not negotiated")
}

///|
fn require_protocol(params : Map[String, Json]) -> Unit raise RpcError {
  guard params.get("protocolVersions") is Some(Array(versions)) &&
    !versions.is_empty() &&
    versions.iter().all(v => v is String(_)) else {
    raise invalid_params(
      "protocolVersions must be a non-empty array of strings",
    )
  }
  if !versions.contains(Json::string(PROTOCOL_VERSION)) {
    raise RpcError(
      -32011, "Invalid negotiation parameters or unsupported MEP version",
    )
  }
}

///|
fn Session::initialize(
  self : Session,
  params : Map[String, Json],
) -> Json raise RpcError {
  guard self.phase is Fresh else {
    raise RpcError(-32600, "The session is already initialized")
  }
  require_protocol(params)
  guard params.get("host") is Some(Object(host)) &&
    host.get("name") is Some(String(name)) &&
    name != "" &&
    host.get("version") is Some(String(version)) &&
    version != "" else {
    raise invalid_params("host.name and host.version must be non-empty strings")
  }
  guard params.get("modelTransport") is Some(Object(offer)) else {
    raise RpcError(
      -32011, "Invalid negotiation parameters or unsupported MEP version",
    )
  }
  let offered = read_tuples(offer)
  let limits = read_limits(offer)
  read_guarantees(offer)
  let supported = supported_tuples()
  let tuples = offered.filter(t => supported.contains(t))
  let ours = supported_limits()
  let agreed = {
    encoded: @cmp.minimum(limits.encoded, ours.encoded),
    decoded: @cmp.minimum(limits.decoded, ours.decoded),
    depth: @cmp.minimum(limits.depth, ours.depth),
    nodes: @cmp.minimum(limits.nodes, ours.nodes),
  }
  self.phase = Ready(tuples, agreed)
  {
    "protocolVersion": PROTOCOL_VERSION,
    "extension": extension_info(),
    "capabilities": capabilities({
      "tuples": Json(tuples),
      "limits": Json(agreed),
      "guarantees": [],
    }),
  }
}

///|
fn read_tuples(offer : Map[String, Json]) -> Array[Tuple] raise RpcError {
  guard offer.get("tuples") is Some(Array(items)) else {
    raise invalid_params("modelTransport.tuples must be an array")
  }
  items.map(item => {
    guard item is Object(fields) &&
      fields.length() == 5 &&
      fields.get("operation") is Some(String(operation)) &&
      fields.get("profile") is Some(String(profile)) &&
      fields.get("codec") is Some(String(codec)) &&
      fields.get("envelopeVersion") is Some(String(envelope_version)) &&
      fields.get("irVersion") is Some(String(ir_version)) else {
      raise invalid_params(
        "each model transport tuple has exactly operation, profile, codec, envelopeVersion and irVersion",
      )
    }
    { operation, profile, codec, envelope_version, ir_version, }
  })
}

///|
fn read_limits(offer : Map[String, Json]) -> Limits raise RpcError {
  guard offer.get("limits") is Some(Object(limits)) else {
    raise invalid_params("modelTransport.limits must be an object")
  }
  fn positive(name : String) -> Int32 raise RpcError {
    guard limits.get(name) is Some(Number(n, ..)) &&
      n >= 1.0 &&
      n <= 2147483647.0 &&
      n == n.floor() else {
      raise invalid_params(
        "modelTransport.limits.\{name} must be an integer from 1 to 2147483647",
      )
    }
    n.to_int()
  }

  {
    encoded: positive("maxEncodedBytes"),
    decoded: positive("maxDecodedBytes"),
    depth: positive("maxDepth"),
    nodes: positive("maxNodes"),
  }
}

///|
fn read_guarantees(offer : Map[String, Json]) -> Unit raise RpcError {
  guard offer.get("guarantees").unwrap_or(Json::array([])) is Array(items) else {
    raise invalid_params("modelTransport.guarantees must be an array")
  }
  let seen : Set[String] = Set([])
  for item in items {
    guard item is String(g) && g != "" && !seen.contains(g) else {
      raise invalid_params(
        "modelTransport.guarantees must hold unique non-empty strings",
      )
    }
    seen.add(g)
  }
}
