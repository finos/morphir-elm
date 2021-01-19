module Morphir.IR.SDK.Decimal exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.SDK.Common exposing (tFun, tVar, toFQName, vSpec)
import Morphir.IR.Type as Type exposing (Specification(..), Type(..))
import Morphir.IR.Value as Value

moduleName : ModuleName
moduleName =
    Path.fromString "Decimal"

moduleSpec : Module.Specification ()
moduleSpec =
    { types =
        Dict.fromList
            [ ( Name.fromString "Char", OpaqueTypeSpecification [] |> Documented "Type that represents a single character." )
            ]
    , values =
        Dict.fromList
            [vSpec "abs" [("value", decimalType ())] (decimalType ())
            ]
    }

decimalType : a -> Type a
decimalType attributes =
    Reference attributes (toFQName moduleName "Decimal") []