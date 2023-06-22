{-
   Copyright 2020 Morgan Stanley

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}


module Morphir.IR.SDK.LocalTime exposing (..)

import Dict
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Literal as Literal
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.SDK.Basics exposing (intType)
import Morphir.IR.SDK.Common exposing (toFQName, vSpec)
import Morphir.IR.SDK.Maybe exposing (maybeType)
import Morphir.IR.SDK.String exposing (stringType)
import Morphir.IR.Type exposing (Specification(..), Type(..))
import Morphir.IR.Value as Value exposing (Value)
import Morphir.SDK.LocalTime as LocalTime
import Morphir.Value.Native as Native


moduleName : ModuleName
moduleName =
    Path.fromString "LocalTime"


config =
    { baseType = stringType ()
    , toBaseType = toFQName moduleName "toISOString"
    , fromBaseType = toFQName moduleName "fromISO"
    }


moduleSpec : Module.Specification ()
moduleSpec =
    { types =
        Dict.fromList
            [ ( Name.fromString "LocalTime"
              , DerivedTypeSpecification [] config
                    |> Documented "Type that represents a time concept."
              )
            ]
    , values =
        Dict.fromList
            [ vSpec "fromISO" [ ( "iso", stringType () ) ] (maybeType () (localTimeType ()))
            , vSpec "toISOString" [ ( "time", localTimeType () ) ] (stringType ())
            , vSpec "fromMilliseconds" [ ( "millis", intType () ) ] (localTimeType ())
            , vSpec "diffInSeconds" [ ( "timeA", localTimeType () ), ( "timeB", localTimeType () ) ] (intType ())
            , vSpec "diffInMinutes" [ ( "timeA", localTimeType () ), ( "timeB", localTimeType () ) ] (intType ())
            , vSpec "diffInHours" [ ( "timeA", localTimeType () ), ( "timeB", localTimeType () ) ] (intType ())
            , vSpec "addSeconds" [ ( "seconds", intType () ), ( "time", localTimeType () ) ] (localTimeType ())
            , vSpec "addMinutes" [ ( "minutes", intType () ), ( "time", localTimeType () ) ] (localTimeType ())
            , vSpec "addHours" [ ( "hours", intType () ), ( "time", localTimeType () ) ] (localTimeType ())
            ]
    , doc = Just "Contains the LocalTime type (representing a time concept), and it's associated functions."
    }


localTimeType : a -> Type a
localTimeType attributes =
    Reference attributes (toFQName moduleName "LocalTime") []


nativeFunctions : List ( String, Native.Function )
nativeFunctions =
    [ ( "fromISO"
      , Native.eval1 LocalTime.fromISO (Native.decodeLiteral Native.stringLiteral) (Native.encodeMaybe Native.encodeLocalTime)
      )
    , ( "toISOString"
      , Native.eval1 LocalTime.toISOString Native.decodeLocalTime (Native.encodeLiteral Literal.StringLiteral)
      )
    , ( "fromMilliseconds"
      , Native.eval1 LocalTime.fromMilliseconds (Native.decodeLiteral Native.intLiteral) Native.encodeLocalTime
      )
    , ( "diffInSeconds"
      , Native.eval2 LocalTime.diffInSeconds Native.decodeLocalTime Native.decodeLocalTime (Native.encodeLiteral Literal.intLiteral)
      )
    , ( "diffInMinutes"
      , Native.eval2 LocalTime.diffInMinutes Native.decodeLocalTime Native.decodeLocalTime (Native.encodeLiteral Literal.intLiteral)
      )
    , ( "diffInHours"
      , Native.eval2 LocalTime.diffInHours Native.decodeLocalTime Native.decodeLocalTime (Native.encodeLiteral Literal.intLiteral)
      )
    , ( "addSeconds"
      , Native.eval2 LocalTime.addSeconds (Native.decodeLiteral Native.intLiteral) Native.decodeLocalTime Native.encodeLocalTime
      )
    , ( "addMinutes"
      , Native.eval2 LocalTime.addMinutes (Native.decodeLiteral Native.intLiteral) Native.decodeLocalTime Native.encodeLocalTime
      )
    , ( "addHours"
      , Native.eval2 LocalTime.addHours (Native.decodeLiteral Native.intLiteral) Native.decodeLocalTime Native.encodeLocalTime
      )
    ]


fromISO : a -> Value a a -> Value a a
fromISO a value =
    Value.Apply a (Value.Reference a ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "local", "time" ] ], [ "from", "i", "s", "o" ] )) value
