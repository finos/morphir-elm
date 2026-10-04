///|
/// `node_path` identifies the IR node: a canonical FQName, followed by `/`-separated steps.
pub(all) struct Problem {
  code : String
  node_path : String
  detail : String
} derive(Eq, Debug)

///|
pub(all) suberror ElmGenerationError {
  Refused(Problem)
  Failed(Array[Problem])
} derive(Eq, Debug)

///|
fn[T] refuse(
  code : String,
  at : String,
  detail : String,
) -> T raise ElmGenerationError {
  raise Refused({ code: "elm." + code, node_path: at, detail, })
}
