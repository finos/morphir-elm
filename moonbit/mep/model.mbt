///|
fn sha256_hex(bytes : Bytes) -> String {
  @crypto.bytes_to_hex_string(@crypto.sha256(bytes))
}

///|
fn is_lower_hex(text : String, length : Int32) -> Bool {
  text.length() == length &&
  text.iter().all(c => (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))
}

///|
/// Checks the tuple that a request names against the negotiated one.
fn require_tuple(
  value : Json?,
  expected : Tuple,
  which : String,
) -> Unit raise RpcError {
  guard value is Some(Object(fields)) &&
    fields.length() == 5 &&
    fields.get("operation") is Some(String(operation)) &&
    fields.get("profile") is Some(String(profile)) &&
    fields.get("codec") is Some(String(codec)) &&
    fields.get("envelopeVersion") is Some(String(envelope_version)) &&
    fields.get("irVersion") is Some(String(ir_version)) &&
    ({ operation, profile, codec, envelope_version, ir_version, } : Tuple) ==
    expected else {
    raise invalid_params(
      "Model admission refused: unsupported_tuple (\{which})",
    )
  }
}

///|
/// Whether a JSON text is within the agreed depth and node limits, counted as the MoonBit host and the Elm classic
/// extension count them: the root value is level 1, and each value is one node. It scans the text without building
/// a tree and stops at the first value over a limit, so a deep payload cannot exhaust the stack. Text that is not
/// JSON is not refused here; the IR reader refuses it.
fn within_shape(
  text : String,
  max_depth : MaxDepth,
  max_nodes : MaxNodes,
) -> Bool {
  let MaxDepth(depth) = max_depth
  let MaxNodes(most) = max_nodes
  // One entry for each open container: true for an object, false for an array.
  let containers : Array[Bool] = []
  let mut nodes = 0
  let mut expect_key = false
  let mut in_string = false
  let mut escaped = false
  let mut in_scalar = false
  for c in text {
    if in_string {
      if escaped {
        escaped = false
      } else if c == '\\' {
        escaped = true
      } else if c == '"' {
        in_string = false
      }
      continue
    }
    let starts_value = match c {
      '"' => {
        in_scalar = false
        in_string = true
        if expect_key {
          expect_key = false
          false
        } else {
          true
        }
      }
      '{' | '[' => {
        in_scalar = false
        true
      }
      '}' | ']' | ',' | ':' | ' ' | '\t' | '\n' | '\r' => {
        in_scalar = false
        false
      }
      _ =>
        if in_scalar {
          false
        } else {
          in_scalar = true
          true
        }
    }
    if starts_value {
      nodes += 1
      if containers.length() + 1 > depth || nodes > most {
        return false
      }
    }
    match c {
      '{' | '[' => {
        containers.push(c == '{')
        expect_key = c == '{'
      }
      '}' | ']' => {
        ignore(containers.pop())
        expect_key = false
      }
      ',' => expect_key = containers.last() is Some(true)
      _ => ()
    }
  }
  true
}

///|
/// The model envelope for IR written as Morphir JSON. `None` when the payload is over the agreed limits.
fn envelope(ir_text : String, model_id : String, limits : Limits) -> Json? {
  let bytes = @utf8.encode(ir_text)
  let content = @base64.encode(bytes[:])
  if bytes.length() > limits.decoded || content.length() > limits.encoded {
    return None
  }
  if !within_shape(ir_text, limits.depth, limits.nodes) {
    return None
  }
  let digest = sha256_hex(bytes)
  Some({
    "envelopeVersion": ENVELOPE_VERSION,
    "modelId": model_id,
    "revision": "sha256:" + digest,
    "irVersion": IR_VERSION,
    "profile": "morphir-ir",
    "payload": {
      "codec": "morphir-json",
      "layout": "single-document",
      "decodedByteLength": bytes.length(),
      "sha256": digest,
      "content": content,
    },
  })
}

///|
/// Reads the IR text of a model envelope, after the checks of the envelope, the payload and its digest.
fn open_envelope(model : Json?, limits : Limits) -> String raise RpcError {
  fn refuse(reason : String) -> RpcError {
    invalid_params("Model admission refused: \{reason}")
  }

  guard model is Some(Object(fields)) else { raise refuse("invalid_model") }
  guard fields.get("envelopeVersion") is Some(String(ENVELOPE_VERSION)) &&
    fields.get("profile") is Some(String("morphir-ir")) &&
    fields.get("irVersion") is Some(String(IR_VERSION)) else {
    raise refuse("unsupported_tuple (model)")
  }
  match fields.get("critical") {
    None | Some(Array([])) => ()
    _ => raise refuse("unknown_critical")
  }
  guard fields.get("payload") is Some(Object(payload)) &&
    payload.get("codec") is Some(String("morphir-json")) &&
    payload.get("layout") is Some(String("single-document")) &&
    payload.get("decodedByteLength") is Some(Number(length, ..)) &&
    payload.get("sha256") is Some(String(digest)) &&
    is_lower_hex(digest, 64) &&
    payload.get("content") is Some(String(content)) else {
    raise refuse("invalid_payload")
  }
  if content.length() > limits.encoded || length > limits.decoded.to_double() {
    raise refuse("model_limit")
  }
  let bytes = @base64.decode(content) catch {
    _ => raise refuse("invalid_payload")
  }
  if @base64.encode(bytes[:]) != content ||
    bytes.length().to_double() != length ||
    sha256_hex(bytes) != digest {
    raise refuse("payload_digest")
  }
  let text = @utf8.decode(bytes) catch { _ => raise refuse("invalid_payload") }
  if !within_shape(text, limits.depth, limits.nodes) {
    raise refuse("model_limit")
  }
  text
}
