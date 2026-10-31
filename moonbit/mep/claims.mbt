///|
/// The extension id, also the id of the extension in a bundle descriptor.
pub const EXTENSION_ID : String = "morphir-elm"

///|
/// The extension version. It equals the version in moonbit/moon.mod; a tool test checks this.
pub const VERSION : String = "0.5.0-preview.2"

///|
pub const PROTOCOL_VERSION : String = "0.2.0-draft.1"

///|
pub const CLAIMS_VERSION : String = "0.1.0-draft.2"

///|
const ENVELOPE_VERSION : String = "0.1.0-draft.1"

///|
const IR_VERSION : String = "4.0.0"

///|
const COMPILE_MODEL : String = "morphir.frontend.compileModel"

///|
const GENERATE_MODEL : String = "morphir.backend.generateModel"

///|
/// The Elm backend's target name.
pub const TARGET : String = "elm"

///|
/// One model transport tuple. The extension supports the plain IR as Morphir JSON for both operations.
priv struct Tuple {
  operation : String
  profile : String
  codec : String
  envelope_version : String
  ir_version : String
} derive(Eq)

///|
fn json_tuple(operation : String) -> Tuple {
  {
    operation,
    profile: "morphir-ir",
    codec: "morphir-json",
    envelope_version: ENVELOPE_VERSION,
    ir_version: IR_VERSION,
  }
}

///|
fn supported_tuples() -> Array[Tuple] {
  [json_tuple(COMPILE_MODEL), json_tuple(GENERATE_MODEL)]
}

///|
impl ToJson for Tuple with fn to_json(self) {
  {
    "operation": self.operation,
    "profile": self.profile,
    "codec": self.codec,
    "envelopeVersion": self.envelope_version,
    "irVersion": self.ir_version,
  }
}

///|
/// Model size limits. The extension's own limits are the host's defaults; a session uses the smaller of each pair.
priv struct Limits {
  encoded : Int32
  decoded : Int32
  depth : Int32
  nodes : Int32
}

///|
fn supported_limits() -> Limits {
  { encoded: 2796204, decoded: 2097152, depth: 128, nodes: 100000, }
}

///|
impl ToJson for Limits with fn to_json(self) {
  {
    "maxEncodedBytes": self.encoded,
    "maxDecodedBytes": self.decoded,
    "maxDepth": self.depth,
    "maxNodes": self.nodes,
  }
}

///|
fn extension_info() -> Json {
  {
    "id": EXTENSION_ID,
    "name": "Morphir Elm",
    "version": VERSION,
    "types": ["frontend", "backend"],
    "license": "Apache-2.0",
  }
}

///|
/// The capabilities. `transport` is the model transport that describe or initialize reports.
fn capabilities(transport : Json) -> Json {
  {
    "frontend": {
      "languages": [{ "id": "elm", "fileExtensions": [".elm"] }],
      "irVersions": [IR_VERSION],
      "compile": false,
      "incremental": false,
      "fragments": false,
      "multiDocument": true,
    },
    "backend": {
      "targets": [TARGET],
      "irVersions": [IR_VERSION],
      "generate": false,
    },
    "modelTransport": transport,
    "streaming": false,
    "incremental": false,
    "cancellation": false,
    "progress": false,
  }
}

///|
/// The claim set that describe returns, and that a bundle descriptor copies into its artifact.
pub fn claims() -> Json {
  {
    "claimsVersion": CLAIMS_VERSION,
    "protocolVersions": [PROTOCOL_VERSION],
    "extension": extension_info(),
    "capabilities": capabilities({
      "tuples": Json(supported_tuples()),
      "limits": Json(supported_limits()),
      "guarantees": [],
    }),
  }
}
