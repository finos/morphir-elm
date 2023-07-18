module Morphir.DecorationConfig.Codec exposing (..)

{-| Decode Options.
-}

import Dict exposing (Dict)
import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.File.SourceCode exposing (Doc)
import Morphir.IR.Decoration exposing (DecorationConfig, DecorationID)
import Morphir.IR.FQName as FQName exposing (FQName)


{-| Code generator options. Contains the irPath and storageLocation
-}
type alias Options =
    { irPath : String
    , storageLocation : String
    , decorationGroup : String
    }


type alias Error =
    String


decodeOptions : Decode.Decoder Options
decodeOptions =
    Decode.map3 Options
        (Decode.field "irPath" Decode.string)
        (Decode.field "storageLocation" Decode.string)
        (Decode.field "decorationGroup" Decode.string)


encodeDecorationConfig : DecorationConfig -> Encode.Value
encodeDecorationConfig config =
    Encode.object
        [ ( "displayName", Encode.string config.displayName )
        , ( "ir", Encode.string config.irPath )
        , ( "entryPoint", Encode.string (FQName.toString config.entryPoint) )
        , ( "storageLocation", Encode.string config.storageLocation )
        ]


printDecorationConfigs : Dict DecorationID DecorationConfig -> Doc
printDecorationConfigs configs =
    Encode.dict identity encodeDecorationConfig configs
        |> Encode.encode 4
