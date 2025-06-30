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


module Morphir.IR.Distribution.Codec exposing
    ( encodeDistribution, decodeDistribution
    , encodeComponent, decodeComponent
    )

{-| Codecs for types in the `Morphir.IR.Distribution` module.


# Distribution

@docs encodeDistribution, decodeDistribution


# Component

@docs encodeComponent, decodeComponent

-}

import Dict
import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.Codec exposing (decodeUnit, encodeUnit)
import Morphir.IR.Distribution exposing (Component, Distribution(..))
import Morphir.IR.Distribution.CodecV1 as CodecV1
import Morphir.IR.Name as Name
import Morphir.IR.Package.Codec as PackageCodec
import Morphir.IR.Path.Codec exposing (decodePath, encodePath)
import Morphir.IR.Type.Codec exposing (decodeType, encodeType)
import Morphir.IR.Value.Codec exposing (decodeValue, encodeValue)


{-| Encode Distribution.
-}
encodeDistribution : Distribution -> Encode.Value
encodeDistribution distro =
    case distro of
        Library packagePath dependencies def ->
            Encode.list identity
                [ Encode.string "Library"
                , encodePath packagePath
                , dependencies
                    |> Dict.toList
                    |> Encode.list
                        (\( packageName, packageSpec ) ->
                            Encode.list identity
                                [ encodePath packageName
                                , PackageCodec.encodeSpecification encodeUnit packageSpec
                                ]
                        )
                , def
                    |> PackageCodec.encodeDefinition encodeUnit
                        (encodeType encodeUnit)
                ]


{-| Decode Distribution.
-}
decodeDistribution : Decode.Decoder Distribution
decodeDistribution =
    Decode.index 0 Decode.string
        |> Decode.andThen
            (\kind ->
                case kind of
                    "Library" ->
                        Decode.map3 Library
                            (Decode.index 1 decodePath)
                            (Decode.index 2
                                (Decode.map Dict.fromList
                                    (Decode.list
                                        (Decode.map2 Tuple.pair
                                            (Decode.index 0 decodePath)
                                            (Decode.index 1 (PackageCodec.decodeSpecification decodeUnit))
                                        )
                                    )
                                )
                            )
                            (Decode.index 3 (PackageCodec.decodeDefinition decodeUnit (decodeType decodeUnit)))

                    other ->
                        Decode.fail <| "Unknown value type: " ++ other
            )


{-| Encodes a Component.
-}
encodeComponent : Component -> Encode.Value
encodeComponent component =
    Encode.object
        [ ( "name", encodePath component.name )
        , ( "libraries"
          , component.libraries
                |> Dict.toList
                |> Encode.list
                    (\( packageName, packageDef ) ->
                        Encode.list identity
                            [ encodePath packageName
                            , PackageCodec.encodeDefinition encodeUnit (encodeType encodeUnit) packageDef
                            ]
                    )
          )
        , ( "inputs", Encode.dict Name.toCamelCase (encodeType encodeUnit) component.inputs )
        , ( "states", Encode.dict Name.toCamelCase (encodeType encodeUnit) component.states )
        , ( "outputs", Encode.dict Name.toCamelCase (encodeValue encodeUnit <| encodeType encodeUnit) component.outputs )
        ]


{-| Decodes a Component.
-}
decodeComponent : Decode.Decoder Component
decodeComponent =
    let
        nameKeyValueDecoder valueDecoder =
            Decode.keyValuePairs valueDecoder
                |> Decode.map
                    (List.map (Tuple.mapFirst Name.fromString)
                        >> Dict.fromList
                    )

        libraryEntryDecoder =
            Decode.map2 Tuple.pair
                (Decode.index 0 decodePath)
                (Decode.index 1 (PackageCodec.decodeDefinition decodeUnit (decodeType decodeUnit)))
    in
    Decode.map5
        Component
        (Decode.field "name" decodePath)
        (Decode.field "libraries" <| (Decode.list libraryEntryDecoder |> Decode.map Dict.fromList))
        (Decode.field "inputs" <| nameKeyValueDecoder (decodeType decodeUnit))
        (Decode.field "states" <| nameKeyValueDecoder (decodeType decodeUnit))
        (Decode.field "outputs" <| nameKeyValueDecoder (decodeValue decodeUnit (decodeType decodeUnit)))
