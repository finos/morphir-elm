module Morphir.DecorationConfig.Backend.Codec exposing (..)

{-| Decode Options.
-}

import Json.Decode as Decode
import Morphir.DecorationConfig.Backend exposing (Options)


decodeOptions : Decode.Decoder Options
decodeOptions =
    Decode.map3 Options
        (Decode.field "irPath" Decode.string)
        (Decode.field "storageLocation" Decode.string)
        (Decode.field "decorationGroup" Decode.string)
