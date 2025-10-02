module Morphir.YAML.Mapping exposing (..)

import Dict
import Morphir.IR.FQName as FQName
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name
import Morphir.IR.Type as Type
import Morphir.IR.Type.Codec exposing (encodeConstructors)
import Yaml.Encode as Encode


encodeModule : Module.Definition ta va -> Encode.Encoder
encodeModule moduleDef =
    let
        maybeTypes : Maybe Encode.Encoder
        maybeTypes =
            if Dict.isEmpty moduleDef.types then
                Nothing

            else
                moduleDef.types
                    |> Encode.dict nameToString
                        (\typeDef -> encodeTypeDef typeDef.value.value)
                    |> Just
    in
    Encode.record
        (List.filterMap identity
            [ maybeTypes |> Maybe.map (Tuple.pair "types")
            ]
        )


encodeTypeDef : Type.Definition ta -> Encode.Encoder
encodeTypeDef typeDef =
    let
        encodeArgs : Type.ConstructorArgs ta -> Encode.Encoder
        encodeArgs args =
            args
                |> List.map
                    (\( argName, argType ) ->
                        Encode.record
                            [ ( nameToString argName, encodeType argType )
                            ]
                    )
                |> Encode.list identity

        encodeConstructors : Type.Constructors ta -> Encode.Encoder
        encodeConstructors constructors =
            constructors
                |> Encode.dict nameToString
                    encodeArgs

        onlyNoArgConstrutors : Type.Constructors ta -> Bool
        onlyNoArgConstrutors constructors =
            constructors
                |> Dict.values
                |> List.all (\args -> List.isEmpty args)
    in
    case typeDef of
        Type.TypeAliasDefinition _ typeExp ->
            Encode.record
                [ ( "alias-for", encodeType typeExp ) ]

        Type.CustomTypeDefinition _ accessControlledConstructors ->
            if onlyNoArgConstrutors accessControlledConstructors.value then
                Encode.record
                    [ ( "enum-of"
                      , Encode.list
                            (nameToString >> Encode.string)
                            (Dict.keys accessControlledConstructors.value)
                      )
                    ]

            else
                Encode.record
                    [ ( "one-of"
                      , encodeConstructors accessControlledConstructors.value
                      )
                    ]


encodeType : Type.Type ta -> Encode.Encoder
encodeType typeExp =
    case typeExp of
        Type.Variable _ name ->
            Encode.string (nameToString name)

        Type.Reference _ fQName args ->
            if List.isEmpty args then
                Encode.string ("$" ++ FQName.toString fQName)

            else
                Encode.record
                    [ ( "$" ++ FQName.toString fQName
                      , Encode.list encodeType args
                      )
                    ]

        Type.Tuple _ elems ->
            Encode.record
                [ ( "tuple", Encode.list encodeType elems ) ]

        Type.Record _ fields ->
            Encode.record
                [ ( "record"
                  , Encode.list (\field -> Encode.record [ ( nameToString field.name, encodeType field.tpe ) ])
                        fields
                  )
                ]

        Type.ExtensibleRecord _ name fields ->
            Encode.record
                [ ( "extensible-record", Encode.string (nameToString name) )
                , ( "fields"
                  , fields
                        |> Encode.list
                            (\field ->
                                Encode.record
                                    [ ( nameToString field.name
                                      , encodeType field.tpe
                                      )
                                    ]
                            )
                  )
                ]

        Type.Function _ argType returnType ->
            Encode.record
                [ ( "function"
                  , Encode.record
                        [ ( "args", encodeType argType )
                        , ( "return", encodeType returnType )
                        ]
                  )
                ]

        Type.Unit _ ->
            Encode.null


nameToString : Name.Name -> String
nameToString name =
    name
        |> Name.toHumanWords
        |> List.map capitalize
        |> String.join "-"


capitalize : String -> String
capitalize string =
    case String.uncons string of
        Just ( headChar, tailString ) ->
            String.cons (Char.toUpper headChar) tailString

        Nothing ->
            string
