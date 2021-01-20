module Morphir.IR.SDK.Decimal exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.SDK.Basics exposing (boolType, floatType, intType, orderType)
import Morphir.IR.SDK.Common exposing (tFun, tVar, toFQName, vSpec)
import Morphir.IR.SDK.Maybe exposing (maybeType)
import Morphir.IR.SDK.String exposing (stringType)
import Morphir.IR.Type as Type exposing (Specification(..), Type(..))
import Morphir.IR.Value as Value


moduleName : ModuleName
moduleName =
    Path.fromString "Decimal"


moduleSpec : Module.Specification ()
moduleSpec =
    { types =
        Dict.fromList
            [ ( Name.fromString "Decimal", OpaqueTypeSpecification [] |> Documented "Type that represents a Decimal." )
            ]
    , values =
        Dict.fromList
            [ vSpec "fromInt" [ ( "n", intType () ) ] (decimalType ())
            , vSpec "fromFloat" [ ( "f", floatType () ) ] (maybeType () (decimalType ()))
            , vSpec "fromString" [ ( "str", stringType () ) ] (maybeType () (decimalType ()))
            , vSpec "toString" [ ( "decimalValue", decimalType () ) ] (stringType ())
            , vSpec "add" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (decimalType ())
            , vSpec "sub" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (decimalType ())
            , vSpec "mul" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (decimalType ())
            , vSpec "negate" [ ( "value", decimalType () ) ] (decimalType ())
            , vSpec "round" [ ( "n", intType () ), ( "d", decimalType () ) ] (decimalType ())
            , vSpec "eq" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (boolType ())
            , vSpec "neq" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (boolType ())
            , vSpec "compare" [ ( "a", decimalType () ), ( "b", decimalType () ) ] (orderType ())
            , vSpec "abs" [ ( "value", decimalType () ) ] (decimalType ())
            , vSpec "zero" [] (decimalType ())
            , vSpec "one" [] (decimalType ())
            , vSpec "minusOne" [] (decimalType ())
            ]
    }


decimalType : a -> Type a
decimalType attributes =
    Reference attributes (toFQName moduleName "Decimal") []
