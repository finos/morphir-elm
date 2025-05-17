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


{-| Encodes a `Source.DataType` into a JSON string representation.
This encoder always serializes a `Source.DataType` as a JSON array with two elements.
The first element is a string that indicates the type of data (eg "RowSet" or "Literal").
The second element is either a fully qualified name of a row set or a string representation of a literal type.

  - RowSet ([["foo"]], [["bar"]], ["baz"]) -> `["RowSet", "Foo:Bar:Baz"]`
  - Literal StringLiteral -> `["Literal", "String"]`

-}
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


{-| Encodes a `Source.LiteralType` into a JSON string representation.
The mapping between `Source.LiteralType` and its string representation is as follows:

  - `BoolLiteral` -> `"Boolean"`
  - `StringLiteral` -> `"String"`
  - `WholeNumberLiteral` -> `"Integer"`
  - `FloatLiteral` -> `"Float"`
  - `DecimalLiteral` -> `"Decimal"`
  - `LocalDateLiteral` -> `"LocalDate"`
  - `LocalTimeLiteral` -> `"LocalTime"`

-}
encodeLiteral : Source.LiteralType -> Encode.Value
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


{-| Decodes a `Source.DataType` from a JSON string representation.
The decoder expects a JSON value that is either a JSON array with two elements or a single String.

  - If the the value is a JSON array,
      - Then the first element should be a string that indicates the type of data (eg "RowSet" or "Literal").
      - The second element is also a string that could be a fully qualified name of a row set or a literal type.
  - If the value is a single string, it is treated as a fully qualified name to a `RowSet`

-}
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


{-| Decodes a `Source.LiteralType` from a JSON string representation.
The mapping between the string representation and `Source.LiteralType` is documented in [encodeLiteral](#encodeLiteral).
-}
decodeLiteral : Decode.Decoder Source.LiteralType
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
