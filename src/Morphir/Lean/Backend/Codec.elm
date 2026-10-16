module Morphir.Lean.Backend.Codec exposing (decodeOptions, encodeErrors)

{-| Codecs for types in the `Morphir.Lean.Backend` module.

@docs decodeOptions, encodeErrors

-}

import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.Lean.Backend exposing (Errors, Options)


{-| Decode backend options. The Lean backend has no options yet.
-}
decodeOptions : Decode.Decoder Options
decodeOptions =
    Decode.succeed {}


{-| Encode errors as a JSON list of strings.
-}
encodeErrors : Errors -> Encode.Value
encodeErrors =
    Encode.list Encode.string
