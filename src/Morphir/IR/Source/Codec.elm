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


module Morphir.IR.Source.Codec exposing (encodeComponent, decodeComponent)

{-| Codecs for types in the `Morphir.IR.Source` module.


# Component

@docs encodeComponent, decodeComponent

-}

import Dict exposing (Dict)
import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.IR.FQName as FQName
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.Source as Source exposing (..)


encodeComponent : Component -> Encode.Value
encodeComponent component =
    Encode.object
        [ ( "name", encodeComponentName component.name )
        , ( "inputs", Encode.dict Name.toCamelCase encodeDataType component.inputs )
        , ( "states", Encode.dict Name.toCamelCase encodeDataType component.states )
        , ( "outputs", Encode.dict Name.toCamelCase (Encode.list encodeOutputSource) component.outputs )
        ]


decodeComponent : Decode.Decoder Component
decodeComponent =
    Decode.map4
        component
        (Decode.field "name" decodeComponentName)
        (Decode.field "inputs" <| nameKeyValueDecoder decodeDataType)
        (Decode.field "states" <| nameKeyValueDecoder decodeDataType)
        (Decode.field "outputs" <| nameKeyValueDecoder (Decode.list decodeOutputSource))


encodeComponentName : ComponentName -> Encode.Value
encodeComponentName name =
    Encode.string <| Path.toString Name.toTitleCase "." name


decodeComponentName : Decode.Decoder ComponentName
decodeComponentName =
    Decode.map Path.fromString Decode.string


encodeDataType : DataType -> Encode.Value
encodeDataType dataType =
    case dataType of
        RowSet fqName ->
            Encode.list identity
                [ Encode.string "RowSet"
                , Encode.string <| FQName.toString fqName
                ]

        Literal literal ->
            Encode.list identity
                [ Encode.string "Literal"
                , encodeLiteral literal
                ]


encodeLiteral : Source.Literal -> Encode.Value
encodeLiteral literal =
    case literal of
        BoolLiteral ->
            Encode.string "Boolean"

        StringLiteral ->
            Encode.string "String"

        WholeNumberLiteral ->
            Encode.string "Integer"

        FloatLiteral ->
            Encode.string "Float"

        DecimalLiteral ->
            Encode.string "Decimal"

        LocalDateLiteral ->
            Encode.string "LocalDate"

        LocalTimeLiteral ->
            Encode.string "LocalTime"


decodeDataType : Decode.Decoder DataType
decodeDataType =
    Decode.oneOf
        [ Decode.string |> Decode.map (fqnFromString >> RowSet)
        , Decode.index 0 Decode.string
            |> Decode.andThen
                (\tag ->
                    case tag of
                        "RowSet" ->
                            Decode.index 1 Decode.string
                                |> Decode.map (fqnFromString >> RowSet)

                        "Literal" ->
                            Decode.index 1 decodeLiteral
                                |> Decode.map Literal

                        _ ->
                            Decode.fail ("Unknown data type: " ++ tag)
                )
        ]


decodeLiteral : Decode.Decoder Source.Literal
decodeLiteral =
    Decode.string
        |> Decode.andThen
            (\tag ->
                case tag of
                    "Boolean" ->
                        Decode.succeed BoolLiteral

                    "String" ->
                        Decode.succeed StringLiteral

                    "Integer" ->
                        Decode.succeed WholeNumberLiteral

                    "Float" ->
                        Decode.succeed FloatLiteral

                    "Decimal" ->
                        Decode.succeed DecimalLiteral

                    "LocalDate" ->
                        Decode.succeed LocalDateLiteral

                    "LocalTime" ->
                        Decode.succeed LocalTimeLiteral

                    _ ->
                        Decode.fail ("Unknown literal type: " ++ tag)
            )


encodeOutputSource : OutputSource -> Encode.Value
encodeOutputSource outputSource =
    Encode.object
        [ ( "functionReference"
          , Encode.string <| FQName.toString outputSource.functionReference
          )
        , ( "arguments"
          , Encode.dict Name.toCamelCase (Name.toCamelCase >> Encode.string) outputSource.arguments
          )
        ]


decodeOutputSource : Decode.Decoder OutputSource
decodeOutputSource =
    Decode.map2 outputSource
        (Decode.field "functionReference" (Decode.string |> Decode.map fqnFromString))
        (Decode.field "arguments" <| nameKeyValueDecoder (Decode.string |> Decode.map Name.fromString))


nameKeyValueDecoder : Decode.Decoder x -> Decode.Decoder (Dict Name.Name x)
nameKeyValueDecoder decoder =
    Decode.keyValuePairs decoder
        |> Decode.map
            (List.map (Tuple.mapFirst Name.fromString)
                >> Dict.fromList
            )


fqnFromString : String -> FQName.FQName
fqnFromString str =
    FQName.fromString str ":"
