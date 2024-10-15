module Morphir.IR.SDK.Json.Decode exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.SDK.Basics exposing (floatType, intType)
import Morphir.IR.SDK.Common exposing (tFun, tVar, toFQName, vSpec)
import Morphir.IR.SDK.Dict exposing (dictType)
import Morphir.IR.SDK.Json.Encode exposing (valueType)
import Morphir.IR.SDK.List exposing (listType)
import Morphir.IR.SDK.Maybe exposing (maybeType)
import Morphir.IR.SDK.Result exposing (resultType)
import Morphir.IR.SDK.String exposing (stringType)
import Morphir.IR.Type exposing (Specification(..), Type(..))


moduleName : ModuleName
moduleName =
    Path.fromString "Decode"


moduleSpec : Module.Specification ()
moduleSpec =
    { types =
        Dict.fromList
            [ ( Name.fromString "Decode", OpaqueTypeSpecification [] |> Documented "Type that represents a JSON Decoder" )
            , ( Name.fromString "Error", OpaqueTypeSpecification [] |> Documented "Type that represents a JSON Decoding Error" )
            ]
    , values =
        Dict.fromList
            [ vSpec "string" [ ( "d", decoderType () (tVar "a") ) ] (stringType ())
            , vSpec "bool" [ ( "d", decoderType () (tVar "a") ) ] (intType ())
            , vSpec "int" [ ( "d", decoderType () (tVar "a") ) ] (intType ())
            , vSpec "float" [ ( "d", decoderType () (tVar "a") ) ] (floatType ())
            , vSpec "nullable" [ ( "d", decoderType () (tVar "a") ) ] (maybeType () (tVar "a"))
            , vSpec "list"
                [ ( "d", decoderType () (tVar "a") ) ]
                (decoderType () (listType () (tVar "a")))
            , vSpec "dict"
                [ ( "d", decoderType () (tVar "a") ) ]
                (decoderType () (dictType () (stringType ()) (tVar "a")))
            , vSpec "keyValuePairs"
                [ ( "d", decoderType () (tVar "a") ) ]
                (decoderType () (listType () (Tuple () [ tVar "a", tVar "b" ])))
            , vSpec "oneOrMore"
                [ ( "f", tFun [ tVar "a", listType () (tVar "a") ] (tVar "value") )
                , ( "d", decoderType () (tVar "a") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "field" [ ( "s", stringType () ), ( "d", decoderType () (tVar "a") ) ] (decoderType () (tVar "a"))
            , vSpec "at" [ ( "l", listType () (stringType ()) ), ( "d", decoderType () (tVar "a") ) ] (decoderType () (tVar "a"))
            , vSpec "index" [ ( "i", intType () ), ( "d", decoderType () (tVar "a") ) ] (decoderType () (tVar "a"))
            , vSpec "maybe" [ ( "d", decoderType () (tVar "a") ) ] (decoderType () (maybeType () (tVar "a")))
            , vSpec "oneOf" [ ( "l", listType () (decoderType () (tVar "a")) ) ] (decoderType () (tVar "a"))
            , vSpec "map"
                [ ( "f", tFun [ tVar "a" ] (tVar "value") )
                , ( "d", decoderType () (tVar "a") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map2"
                [ ( "f", tFun [ tVar "a", tVar "b" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map3"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map4"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c", tVar "d" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                , ( "d4", decoderType () (tVar "d") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map5"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c", tVar "d", tVar "e" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                , ( "d4", decoderType () (tVar "d") )
                , ( "d5", decoderType () (tVar "e") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map6"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c", tVar "d", tVar "e", tVar "f" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                , ( "d4", decoderType () (tVar "d") )
                , ( "d5", decoderType () (tVar "e") )
                , ( "d6", decoderType () (tVar "f") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map7"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c", tVar "d", tVar "e", tVar "f", tVar "g" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                , ( "d4", decoderType () (tVar "d") )
                , ( "d5", decoderType () (tVar "e") )
                , ( "d6", decoderType () (tVar "f") )
                , ( "d7", decoderType () (tVar "g") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "map8"
                [ ( "f", tFun [ tVar "a", tVar "b", tVar "c", tVar "d", tVar "e", tVar "f", tVar "g", tVar "h" ] (tVar "value") )
                , ( "d1", decoderType () (tVar "a") )
                , ( "d2", decoderType () (tVar "b") )
                , ( "d3", decoderType () (tVar "c") )
                , ( "d4", decoderType () (tVar "d") )
                , ( "d5", decoderType () (tVar "e") )
                , ( "d6", decoderType () (tVar "f") )
                , ( "d7", decoderType () (tVar "g") )
                , ( "d8", decoderType () (tVar "h") )
                ]
                (decoderType () (tVar "value"))
            , vSpec "decodeString" [ ( "d", decoderType () (tVar "a") ), ( "s", stringType () ) ] (resultType () (errorType ()) (tVar "a"))
            , vSpec "decodeValue" [ ( "d", decoderType () (tVar "a") ), ( "v", valueType () ) ] (resultType () (errorType ()) (tVar "a"))
            , vSpec "errorToString" [ ( "e", errorType () ) ] (stringType ())
            , vSpec "succeed" [ ( "a", tVar "a" ) ] (decoderType () (tVar "a"))
            , vSpec "fail" [ ( "s", stringType () ) ] (decoderType () (tVar "a"))
            ]
    , doc = Just "The Decode type and associated functions"
    }


decoderType : a -> Type a -> Type a
decoderType attributes itemType =
    Reference attributes (toFQName moduleName "Decoder") [ itemType ]


errorType : a -> Type a
errorType attributes =
    Reference attributes (toFQName moduleName "Error") []
