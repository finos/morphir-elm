///|
extern "wasm" fn input_len() -> Int32 = "morphir_bytes_v1" "input_len"

///|
extern "wasm" fn input_byte(index : Int32) -> Int32 = "morphir_bytes_v1" "input_byte"

///|
extern "wasm" fn output_byte(value : Int32) -> Unit = "morphir_bytes_v1" "output_byte"

///|
/// One session for the life of the instance. The module's start section sets it up, so the host needs to call
/// nothing but `handle`.
let session : @mep.Session = @mep.Session::new()

///|
/// Answers one unframed JSON-RPC message: the response length, 0 after `morphir.exit`, -2 for a notification,
/// and -1 when the input is not a UTF-8 message.
pub fn handle() -> Int32 {
  let size = input_len()
  if size < 0 || session.exited() {
    return -1
  }
  let bytes : Array[Byte] = []
  for i in 0..<size {
    let value = input_byte(i)
    if value < 0 || value > 255 {
      return -1
    }
    bytes.push(value.to_byte())
  }
  let text = @utf8.decode(Bytes::from_array(bytes)) catch { _ => return -1 }
  match session.receive(text) {
    Response(response) => {
      let output = @utf8.encode(response)
      for byte in output {
        output_byte(byte.to_int())
      }
      output.length()
    }
    Notified => -2
    Exited => 0
  }
}

///|
fn main {

}
