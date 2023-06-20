module Morphir.DecorationConfig.PrettyPrinter exposing (..)

import Dict exposing (Dict)
import Json.Encode as Encode
import Morphir.DecorationConfig.AST exposing (DecorationConfig)
import Morphir.File.SourceCode exposing (Doc)
import Morphir.IR.Decoration exposing (DecorationID)
import Morphir.IR.FQName as FQName


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
