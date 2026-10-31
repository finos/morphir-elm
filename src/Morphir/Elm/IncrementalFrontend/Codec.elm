module Morphir.Elm.IncrementalFrontend.Codec exposing (..)

import Elm.Syntax.Range exposing (Range)
import Json.Encode as Encode
import Morphir.Elm.IncrementalFrontend as IncrementalFrontend
import Morphir.Elm.IncrementalFrontend.Mapper.Codec as MapperCodec
import Morphir.Elm.IncrementalResolve.Codec as IncrementalResolveCodec
import Morphir.IR.FQName.Codec exposing (encodeFQName)
import Morphir.IR.KindOfName as KindOfName
import Morphir.IR.Name as Name
import Morphir.IR.Name.Codec exposing (encodeName)
import Morphir.IR.Path exposing (Path)
import Morphir.IR.Path.Codec exposing (encodePath)
import Morphir.IR.Repo.Codec as RepoCodec
import Parser


encodeError : IncrementalFrontend.Error -> Encode.Value
encodeError error =
    let
        encodeIRModuleName moduleName =
            Encode.list (Encode.list Encode.string) moduleName

        encodeElmModuleName moduleName =
            Encode.list Encode.string moduleName

        encodeProblem problem =
            case problem of
                Parser.Expecting token ->
                    Encode.list Encode.string [ "Expecting", token ]

                Parser.ExpectingInt ->
                    Encode.string "ExpectingInt"

                Parser.ExpectingHex ->
                    Encode.string "ExpectingHex"

                Parser.ExpectingOctal ->
                    Encode.string "ExpectingOctal"

                Parser.ExpectingBinary ->
                    Encode.string "ExpectingBinary"

                Parser.ExpectingFloat ->
                    Encode.string "ExpectingFloat"

                Parser.ExpectingNumber ->
                    Encode.string "ExpectingNumber"

                Parser.ExpectingVariable ->
                    Encode.string "ExpectingVariable"

                Parser.ExpectingSymbol symbol ->
                    Encode.list Encode.string [ "Expecting symbol", symbol ]

                Parser.ExpectingKeyword keyword ->
                    Encode.list Encode.string [ "ExpectingKeyword", keyword ]

                Parser.ExpectingEnd ->
                    Encode.string "ExpectingEnd"

                Parser.UnexpectedChar ->
                    Encode.string "UnexpectedChar"

                Parser.Problem message ->
                    Encode.list Encode.string [ "Problem", message ]

                Parser.BadRepeat ->
                    Encode.string "BadRepeat"

        encodeDeadEnd deadEnd =
            deadEnd
                |> (\{ row, col, problem } ->
                        Encode.object
                            [ ( "row", Encode.int row )
                            , ( "col", Encode.int col )
                            , ( "problem", encodeProblem problem )
                            ]
                   )
    in
    case error of
        IncrementalFrontend.ModuleCycleDetected fromModuleName toModuleName ->
            [ Encode.string "ModuleCycleDetected"
            , encodeIRModuleName fromModuleName
            , encodeIRModuleName toModuleName
            ]
                |> Encode.list identity

        IncrementalFrontend.InvalidModuleName moduleName ->
            [ Encode.string "InvalidModuleName"
            , encodeElmModuleName moduleName
            ]
                |> Encode.list identity

        IncrementalFrontend.ParseError path deadEnds ->
            [ Encode.string "ParserError"
            , Encode.string path
            , Encode.list encodeDeadEnd deadEnds
            ]
                |> Encode.list identity

        IncrementalFrontend.RepoError message errors ->
            Encode.list identity
                [ Encode.string "RepoError"
                , Encode.string message
                , Encode.list RepoCodec.encodeError errors
                ]

        IncrementalFrontend.TypeCycleDetected from to ->
            Encode.list identity
                [ Encode.string "TypeCycleDetected"
                , encodeName from
                , encodeName to
                ]

        IncrementalFrontend.ResolveError moduleName e ->
            Encode.list identity
                [ Encode.string "ResolveError"
                , encodePath moduleName
                , IncrementalResolveCodec.encodeError e
                ]

        IncrementalFrontend.ValueCycleDetected fromFQName toFQName ->
            Encode.list identity
                [ Encode.string "ValueCycleDetected"
                , encodeFQName fromFQName
                , encodeFQName toFQName
                ]

        IncrementalFrontend.MappingError errors ->
            Encode.list identity
                [ Encode.string "MappingError"
                , Encode.list MapperCodec.encodeError errors
                ]

        IncrementalFrontend.InvalidSourceFilePath path message ->
            Encode.list identity
                [ Encode.string "InvalidSourceFilePath"
                , Encode.string path
                , Encode.string message
                ]

        IncrementalFrontend.TypeNotFound fQName ->
            Encode.list identity
                [ Encode.string "TypeNotFound"
                , encodeFQName fQName
                ]

        IncrementalFrontend.NonExhaustivePatternMatch details ->
            Encode.object
                [ ( "kind", Encode.string "NonExhaustivePatternMatch" )
                , ( "module", encodeTitleCasePath details.moduleName )
                , ( "definition", Encode.string (Name.toCamelCase details.definition) )
                , ( "range", details.range |> Maybe.map encodeRange |> Maybe.withDefault Encode.null )
                , ( "type"
                  , details.typeName
                        |> Maybe.map (\( packageName, moduleName, localName ) -> encodeTitleCasePath (packageName ++ moduleName ++ [ localName ]))
                        |> Maybe.withDefault Encode.null
                  )
                , ( "missing", Encode.list Encode.string details.missing )
                ]

        IncrementalFrontend.UnknownExport details ->
            Encode.object
                [ ( "kind", Encode.string "UnknownExport" )
                , ( "module", encodeTitleCasePath details.moduleName )
                , ( "name", Encode.string details.name )
                , ( "exposes"
                  , Encode.string
                        (case details.kindOfName of
                            KindOfName.Type ->
                                "type"

                            _ ->
                                "value"
                        )
                  )
                , ( "range", encodeRange details.range )
                ]


encodeTitleCasePath : Path -> Encode.Value
encodeTitleCasePath path =
    path
        |> List.map Name.toTitleCase
        |> Encode.list Encode.string


encodeRange : Range -> Encode.Value
encodeRange range =
    let
        encodeLocation location =
            Encode.object
                [ ( "row", Encode.int location.row )
                , ( "column", Encode.int location.column )
                ]
    in
    Encode.object
        [ ( "start", encodeLocation range.start )
        , ( "end", encodeLocation range.end )
        ]
