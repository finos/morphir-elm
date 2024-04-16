module Morphir.IR.SDK.UUID exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Path as Path
import Morphir.IR.Name as Name
import Morphir.IR.Type exposing (Specification(..), Type(..))
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.SDK.Common exposing (vSpec)
import Morphir.IR.SDK.String exposing (stringType)
import Morphir.IR.SDK.Common exposing (toFQName)
import Morphir.IR.SDK.Result exposing (resultType)
import Morphir.IR.SDK.Basics exposing (intType, orderType, boolType)
import Morphir.Value.Native as Native
import Morphir.Value.Native exposing (eval1, eval2)
import Morphir.SDK.UUID as UUID
import Morphir.Value.Native exposing (decodeLiteral, encodeLiteral, stringLiteral, uuidLiteral, intLiteral)
import Morphir.Value.Native exposing (eval0)
import Morphir.Value.Native exposing (encodeUUID)

moduleName : ModuleName
moduleName =
    Path.fromString "UUID"

moduleSpec : Module.Specification ()
moduleSpec = 
    { types = 
        Dict.fromList
            [ (Name.fromString "UUID", OpaqueTypeSpecification [] |> Documented "Type that represents a UUID v5")
            ]
    , values =
        Dict.fromList
            [ vSpec "fromString" [ ("s", stringType () ) ] (resultType () (uuidType ()) (errorType ()))
            , vSpec "forName" [ ("s", stringType () ), ("uuid", uuidType () ) ] (uuidType ())
            , vSpec "toString" [ ("uuid", uuidType () ) ] (stringType ())
            , vSpec "version" [ ("uuid", uuidType () ) ] (intType ())
            , vSpec "compare" [ ("uuid1", uuidType () ), ("uuid2", uuidType () ) ] (orderType ())
            , vSpec "nilString" [] (stringType ())
            , vSpec "isNilString" [ ("s", stringType () ) ] (boolType())
            , vSpec "dnsNamespace" [] (uuidType ())
            , vSpec "urlNamespace" [] (uuidType ())
            , vSpec "oidNamespace" [] (uuidType ())
            , vSpec "x500Namespace" [] (uuidType ())
            ]
    , doc = Just "The UUID type and associated functions"
    }

uuidType : a -> Type a
uuidType attributes = 
    Reference attributes (toFQName moduleName "UUID") []

errorType: a -> Type a
errorType attributes =
    Reference attributes (toFQName moduleName "Error") []

-- use string literal then pipe into fromString method to get a UUID
nativeFunctions : List ( String, Native.Function )
nativeFunctions = 
    [ ( "forName" 
        , eval2 UUID.forName (decodeLiteral stringLiteral) (decodeLiteral uuidLiteral) (encodeLiteral UUIDLiteral)
        )
    , ( "fromString"
        , eval1 UUID.fromString (decodeLiteral stringLiteral) encodeUUID
        )
    , ( "toString"
        , eval1 UUID.toString (decodeLiteral uuidLiteral) (encodeLiteral StringLiteral)
        )
    , ( "version"
        , eval1 UUID.version (decodeLiteral uuidLiteral) (encodeLiteral WholeNumberLiteral))
    , ( "nilString"
        , eval0 UUID.nilString (encodeLiteral StringLiteral))
    , ( "isNilString"
        , eval1 UUID.isNilString (decodeLiteral stringLiteral) (encodeLiteral BoolLiteral))
    -- , ( "compare"
    --     , eval2 UUID.compare (decodeLiteral uuidLiteral) (decodeLiteral uuidLiteral) (encodeLiteral OrderLiteral)
    -- )
    , ( "dnsNamespace"
        , eval0 UUID.dnsNamespace (encodeLiteral UUIDLiteral))
    , ( "urlNamespace"
        , eval0 UUID.urlNamespace (encodeLiteral UUIDLiteral))
    , ( "oidNamespace"
        , eval0 UUID.oidNamespace (encodeLiteral UUIDLiteral))
    , ( "x500Namespace"
        , eval0 UUID.x500Namespace (encodeLiteral UUIDLiteral))
    ]