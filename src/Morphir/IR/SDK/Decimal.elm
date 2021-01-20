module Morphir.IR.SDK.Decimal exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.SDK.Basics exposing (boolType, intType)
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
            [ vSpec "abs" [ ( "value", decimalType () ) ] (decimalType ())
            , vSpec "fromInt" [ ( "n", intType () ) ] (decimalType ())
            , vSpec "fromIntWithExponent" [ ( "n", intType () ), ( "e", intType () ) ] (decimalType ())
            , vSpec "toString" [ ( "decimalValue", decimalType () ) ] (stringType ())
            , vSpec "zero" [] (decimalType ())
            , vSpec "one" [] (decimalType ())
            , vSpec "minusOne" [] (decimalType ())
            ]
    }


decimalType : a -> Type a
decimalType attributes =
    Reference attributes (toFQName moduleName "Decimal") []
