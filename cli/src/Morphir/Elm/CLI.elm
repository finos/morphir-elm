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


port module Morphir.Elm.CLI exposing (..)

import Dict exposing (Dict)
import Json.Decode as Decode exposing (field, string)
import Json.Encode as Encode
import Morphir.Compiler as Compiler
import Morphir.Compiler.Codec as CompilerCodec
import Morphir.Correctness.Codec exposing (decodeTestCase)
import Morphir.Correctness.Test exposing (TestCase)
import Morphir.Elm.Frontend as Frontend exposing (PackageInfo, SourceFile, SourceLocation)
import Morphir.Elm.Frontend.Codec as FrontendCodec
import Morphir.Elm.Target exposing (BackendOptions, decodeOptions, mapDistribution)
import Morphir.File.FileMap exposing (FileMap)
import Morphir.File.FileMap.Codec exposing (encodeFileMap)
import Morphir.IR.Distribution as Distribution exposing (Distribution(..))
import Morphir.IR.FQName as FQName
import Morphir.IR.FQName.CodecV1 exposing (decodeFQName)
import Morphir.IR.FormatVersion.Codec as DistributionCodec
import Morphir.IR.Name as Name
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path
import Morphir.IR.SDK as SDK
import Morphir.IR.Type exposing (Type)
import Morphir.IR.Type.DataCodec as DataCodec
import Morphir.IR.Value as Value
import Morphir.SDK.ResultList as ResultList
import Morphir.Type.Infer as Infer
import Morphir.Value.Exhaustiveness as Exhaustiveness
import Morphir.Value.Interpreter as Interpreter exposing (evaluateFunctionValue)
import Morphir.IR.NameConstructorArguments as NameConstructorArguments


port packageDefinitionFromSource : (( Decode.Value, Decode.Value, List SourceFile ) -> msg) -> Sub msg


port packageDefinitionFromSourceResult : Encode.Value -> Cmd msg


port jsonDecodeError : String -> Cmd msg


port generate : (( Decode.Value, Decode.Value ) -> msg) -> Sub msg


port generateResult : Encode.Value -> Cmd msg


port runTestCases : (( Decode.Value, Decode.Value, Decode.Value ) -> msg) -> Sub msg


port runTestCasesResult : Encode.Value -> Cmd msg


port runTestCasesResultError : Encode.Value -> Cmd msg


port evaluate : (Decode.Value -> msg) -> Sub msg


port evaluateResult : Encode.Value -> Cmd msg


type Msg
    = PackageDefinitionFromSource ( Decode.Value, Decode.Value, List SourceFile )
    | Generate ( Decode.Value, Decode.Value )
    | RunTestCases ( Decode.Value, Decode.Value, Decode.Value )
    | Evaluate Decode.Value


main : Platform.Program () () Msg
main =
    Platform.worker
        { init = \_ -> ( (), Cmd.none )
        , update = update
        , subscriptions = subscriptions
        }


update : Msg -> () -> ( (), Cmd Msg )
update msg model =
    case msg of
        PackageDefinitionFromSource ( optionsJson, packageInfoJson, sourceFiles ) ->
            let
                inputResult : Result Decode.Error ( Frontend.Options, PackageInfo )
                inputResult =
                    Result.map2 Tuple.pair
                        (Decode.decodeValue FrontendCodec.decodeOptions optionsJson)
                        (Decode.decodeValue FrontendCodec.decodePackageInfo packageInfoJson)
            in
            case inputResult of
                Ok ( opts, packageInfo ) ->
                    let
                        relevantSourceFiles : List SourceFile
                        relevantSourceFiles =
                            sourceFiles
                                |> List.filter
                                    (\sourceFile ->
                                        not
                                            (String.contains "Morphir/SDK" sourceFile.path
                                                || String.contains "Morphir\\SDK" sourceFile.path
                                            )
                                    )

                        frontendResult : Result (List Compiler.Error) (Package.Definition Frontend.SourceLocation Frontend.SourceLocation)
                        frontendResult =
                            Frontend.mapSource opts packageInfo Dict.empty relevantSourceFiles
                                |> Result.map NameConstructorArguments.rewritePackage

                        typedResult : Result (List Compiler.Error) (Package.Definition () ( Frontend.SourceLocation, Type () ))
                        typedResult =
                            frontendResult
                                |> Result.andThen
                                    (\packageDef ->
                                        let
                                            thisPackageSpec : Package.Specification ()
                                            thisPackageSpec =
                                                packageDef
                                                    |> Package.definitionToSpecificationWithPrivate
                                                    |> Package.mapSpecificationAttributes (\_ -> ())

                                            ir : Distribution
                                            ir =
                                                Library
                                                    [ [ "empty" ] ]
                                                    (Frontend.defaultDependencies
                                                        |> Dict.insert packageInfo.name thisPackageSpec
                                                    )
                                                    Package.emptyDefinition
                                        in
                                        packageDef
                                            |> Package.mapDefinitionAttributes (\_ -> ()) identity
                                            |> Infer.inferPackageDefinition ir
                                    )
                                |> Result.andThen (checkExhaustiveness packageInfo.name)
                    in
                    ( model
                    , typedResult
                        |> Result.map (Package.mapDefinitionAttributes identity (\( _, tpe ) -> tpe))
                        |> Result.map (Distribution.Library packageInfo.name Dict.empty)
                        |> encodeResult (Encode.list CompilerCodec.encodeError) DistributionCodec.encodeVersionedDistribution
                        |> packageDefinitionFromSourceResult
                    )

                Err errorMessage ->
                    ( model
                    , errorMessage
                        |> Decode.errorToString
                        |> jsonDecodeError
                    )

        Generate ( optionsJson, packageDistJson ) ->
            let
                targetOption : Result Decode.Error String
                targetOption =
                    Decode.decodeValue (field "target" string) optionsJson

                optionsResult : Result Decode.Error BackendOptions
                optionsResult =
                    Decode.decodeValue (decodeOptions targetOption) optionsJson

                packageDistroResult : Result Decode.Error Distribution
                packageDistroResult =
                    Decode.decodeValue DistributionCodec.decodeVersionedDistribution packageDistJson
            in
            case Result.map2 Tuple.pair optionsResult packageDistroResult of
                Ok ( options, packageDist ) ->
                    let
                        enrichedDistro : Distribution
                        enrichedDistro =
                            case packageDist of
                                Library packageName dependencies packageDef ->
                                    Library packageName (Dict.union Frontend.defaultDependencies dependencies) packageDef

                        fileMap : Result Encode.Value FileMap
                        fileMap =
                            mapDistribution options enrichedDistro
                    in
                    ( model
                    , fileMap
                        |> encodeResult identity encodeFileMap
                        |> generateResult
                    )

                Err errorMessage ->
                    ( model, errorMessage |> Decode.errorToString |> jsonDecodeError )

        RunTestCases ( distributionJson, testSuiteJson, dependenciesJson ) ->
            case Result.map2 Tuple.pair (decodeDistribution distributionJson) (decodeLibraries dependenciesJson) of
                Ok ( ir, libraries ) ->
                    case testSuiteJson |> Decode.decodeValue (decodeTestSuiteByCase ir) of
                        Ok testSuite ->
                            let
                                finalResult =
                                    testSuite
                                        |> List.map
                                            (\( functionName, testCaseList ) ->
                                                let
                                                    totalTestCase =
                                                        List.length testCaseList

                                                    runTestCase : TestCase -> ( String, Encode.Value )
                                                    runTestCase testCase =
                                                        case Interpreter.evaluateFunctionValueWithLibraries SDK.nativeFunctions libraries ir functionName testCase.inputs of
                                                            Ok rawValue ->
                                                                if rawValue == testCase.expectedOutput then
                                                                    ( "PASS"
                                                                    , Encode.object
                                                                        [ ( "Expected Output", testCase.expectedOutput |> Value.toString |> Encode.string )
                                                                        , ( "Actual Output", rawValue |> Value.toString |> Encode.string )
                                                                        ]
                                                                    )

                                                                else
                                                                    ( "FAIL"
                                                                    , Encode.object
                                                                        [ ( "Expected Output", testCase.expectedOutput |> Value.toString |> Encode.string )
                                                                        , ( "Actual Output", rawValue |> Value.toString |> Encode.string )
                                                                        ]
                                                                    )

                                                            Err error ->
                                                                ( "FAIL"
                                                                , Encode.object
                                                                    [ ( "Expected Output", testCase.expectedOutput |> Value.toString |> Encode.string )
                                                                    , ( "Actual Output", Debug.toString error |> Encode.string )
                                                                    ]
                                                                )

                                                    resultList : List ( String, Encode.Value )
                                                    resultList =
                                                        testCaseList
                                                            |> List.map
                                                                (\caseResult ->
                                                                    case caseResult of
                                                                        Ok testCase ->
                                                                            runTestCase testCase

                                                                        -- A test case that cannot be read fails on its own; the others still run.
                                                                        Err error ->
                                                                            ( "FAIL"
                                                                            , Encode.object
                                                                                [ ( "Expected Output", Encode.string "" )
                                                                                , ( "Actual Output", "InvalidTestCase " ++ error |> Encode.string )
                                                                                ]
                                                                            )
                                                                )

                                                    ( passedList, failList ) =
                                                        resultList
                                                            |> List.partition
                                                                (\( status, encodedJson ) ->
                                                                    if status == "PASS" then
                                                                        True

                                                                    else
                                                                        False
                                                                )
                                                in
                                                if List.length failList == 0 then
                                                    Ok
                                                        (Encode.object
                                                            [ ( "Function Name"
                                                              , functionName |> FQName.toString |> Encode.string
                                                              )
                                                            , ( "Total TestCases"
                                                              , totalTestCase |> Encode.int
                                                              )
                                                            , ( "Pass TestCases"
                                                              , passedList |> List.length |> Encode.int
                                                              )
                                                            , ( "Fail TestCases List", failList |> List.map Tuple.second |> Encode.list identity )
                                                            ]
                                                        )

                                                else
                                                    Err
                                                        (Encode.object
                                                            [ ( "Function Name"
                                                              , functionName |> FQName.toString |> Encode.string
                                                              )
                                                            , ( "Total TestCases"
                                                              , totalTestCase |> Encode.int
                                                              )
                                                            , ( "Fail TestCases"
                                                              , failList |> List.length |> Encode.int
                                                              )
                                                            , ( "Fail TestCases List", failList |> List.map Tuple.second |> Encode.list identity )
                                                            ]
                                                        )
                                            )
                                        |> ResultList.keepAllErrors
                            in
                            case finalResult of
                                Ok passList ->
                                    ( model, passList |> Encode.list identity |> runTestCasesResult )

                                Err failList ->
                                    ( model, failList |> Encode.list identity |> runTestCasesResultError )

                        Err errorMessage ->
                            ( model, errorMessage |> Decode.errorToString |> jsonDecodeError )

                Err errorMessage ->
                    ( model, errorMessage |> Decode.errorToString |> jsonDecodeError )

        Evaluate requestJson ->
            let
                request : Result String ( ( Distribution, Interpreter.Libraries ), ( String, List Decode.Value ) )
                request =
                    Result.map2 Tuple.pair
                        (Result.map2 Tuple.pair
                            (requestJson |> Decode.decodeValue (Decode.field "distribution" Decode.value) |> Result.andThen decodeDistribution)
                            (requestJson |> Decode.decodeValue (Decode.field "dependencies" Decode.value) |> Result.andThen decodeLibraries)
                        )
                        (requestJson
                            |> Decode.decodeValue
                                (Decode.map2 Tuple.pair
                                    (Decode.field "function" Decode.string)
                                    (Decode.field "inputs" (Decode.list Decode.value))
                                )
                        )
                        |> Result.mapError Decode.errorToString
            in
            case request |> Result.andThen (\( ( ir, libraries ), ( functionName, records ) ) -> evaluateRecords ir libraries functionName records) of
                Ok results ->
                    ( model, results |> Encode.list identity |> evaluateResult )

                Err error ->
                    ( model, error |> jsonDecodeError )


subscriptions : () -> Sub Msg
subscriptions _ =
    Sub.batch
        [ packageDefinitionFromSource PackageDefinitionFromSource
        , generate Generate
        , runTestCases RunTestCases
        , evaluate Evaluate
        ]


checkExhaustiveness :
    PackageName
    -> Package.Definition () ( Frontend.SourceLocation, Type () )
    -> Result (List Compiler.Error) (Package.Definition () ( Frontend.SourceLocation, Type () ))
checkExhaustiveness packageName packageDef =
    let
        lookup : Exhaustiveness.ConstructorLookup
        lookup =
            Exhaustiveness.constructorLookup
                (Library packageName
                    Frontend.defaultDependencies
                    (packageDef |> Package.mapDefinitionAttributes identity Tuple.second)
                )

        errors : List Compiler.Error
        errors =
            packageDef.modules
                |> Dict.toList
                |> List.concatMap
                    (\( moduleName, accessControlledModuleDef ) ->
                        accessControlledModuleDef.value.values
                            |> Dict.toList
                            |> List.concatMap
                                (\( valueName, accessControlledValueDef ) ->
                                    Exhaustiveness.check lookup accessControlledValueDef.value.value.body
                                        |> List.map
                                            (\issue ->
                                                let
                                                    ( sourceLocation, _ ) =
                                                        issue.attributes
                                                in
                                                Compiler.ErrorsInSourceFile sourceLocation.source.path
                                                    [ { errorMessage =
                                                            String.concat
                                                                [ "Non-exhaustive pattern match in "
                                                                , moduleName |> Path.toString Name.toTitleCase "."
                                                                , "."
                                                                , Name.toCamelCase valueName
                                                                , ". Missing patterns: "
                                                                , String.join ", " issue.missing
                                                                ]
                                                      , sourceLocations = [ sourceLocation.range ]
                                                      }
                                                    ]
                                            )
                                )
                    )
    in
    if List.isEmpty errors then
        Ok packageDef

    else
        Err errors


encodeResult : (e -> Encode.Value) -> (a -> Encode.Value) -> Result e a -> Encode.Value
encodeResult encodeErr encodeValue result =
    case result of
        Ok a ->
            Encode.list identity
                [ Encode.null
                , encodeValue a
                ]

        Err e ->
            Encode.list identity
                [ encodeErr e
                , Encode.null
                ]


{-| A distribution as the CLI reads it, with the SDK added to its dependencies.
-}
decodeDistribution : Decode.Value -> Result Decode.Error Distribution
decodeDistribution distributionJson =
    distributionJson
        |> Decode.decodeValue DistributionCodec.decodeVersionedDistribution
        |> Result.map
            (\(Library packageName dependencies packageDef) ->
                Library packageName (Dict.union Frontend.defaultDependencies dependencies) packageDef
            )


{-| The definitions of the dependency packages, so that calls into them can be evaluated.
-}
decodeLibraries : Decode.Value -> Result Decode.Error Interpreter.Libraries
decodeLibraries dependenciesJson =
    dependenciesJson
        |> Decode.decodeValue (Decode.list DistributionCodec.decodeVersionedDistribution)
        |> Result.map
            (List.map (\(Library packageName _ packageDef) -> ( packageName, packageDef ))
                >> Dict.fromList
            )


{-| A test suite where each test case is read on its own, so one that cannot be read does not stop the others.
-}
decodeTestSuiteByCase : Distribution -> Decode.Decoder (List ( FQName.FQName, List (Result String TestCase) ))
decodeTestSuiteByCase ir =
    Decode.list
        (Decode.index 0 decodeFQName
            |> Decode.andThen
                (\fQName ->
                    case Distribution.lookupValueSpecification fQName ir of
                        Just valueSpec ->
                            Decode.index 1
                                (Decode.list Decode.value
                                    |> Decode.map
                                        (List.map
                                            (Decode.decodeValue (decodeTestCase ir valueSpec)
                                                >> Result.mapError Decode.errorToString
                                            )
                                        )
                                    |> Decode.map (Tuple.pair fQName)
                                )

                        Nothing ->
                            Decode.fail ("Cannot find " ++ FQName.toString fQName)
                )
        )


{-| Evaluate a function on each record of arguments. Each record gives `{ "output": ... }` or `{ "error": ... }`, so a
record that cannot be read or evaluated does not stop the others. Records and outputs use the same JSON encoding as
morphir-tests.json.
-}
evaluateRecords : Distribution -> Interpreter.Libraries -> String -> List Decode.Value -> Result String (List Encode.Value)
evaluateRecords ir libraries functionName records =
    FQName.fromStringStrict functionName ":"
        |> Result.andThen
            (\fQName ->
                case Distribution.lookupValueSpecification fQName ir of
                    Just valueSpec ->
                        Result.map2
                            (\inputsDecoder encodeOutput ->
                                records
                                    |> List.map
                                        (\record ->
                                            record
                                                |> Decode.decodeValue inputsDecoder
                                                |> Result.mapError (\error -> "InvalidInput " ++ Decode.errorToString error)
                                                |> Result.andThen
                                                    (\inputs ->
                                                        Interpreter.evaluateFunctionValueWithLibraries SDK.nativeFunctions libraries ir fQName inputs
                                                            |> Result.mapError Debug.toString
                                                    )
                                                |> Result.andThen encodeOutput
                                                |> (\result ->
                                                        case result of
                                                            Ok output ->
                                                                Encode.object [ ( "output", output ) ]

                                                            Err error ->
                                                                Encode.object [ ( "error", Encode.string error ) ]
                                                   )
                                        )
                            )
                            (decodeInputs ir valueSpec)
                            (DataCodec.encodeData ir valueSpec.output)

                    Nothing ->
                        Err ("Cannot find " ++ functionName)
            )


{-| The arguments of a function as a JSON array, one element per input.
-}
decodeInputs : Distribution -> Value.Specification () -> Result String (Decode.Decoder (List (Maybe Value.RawValue)))
decodeInputs ir valueSpec =
    valueSpec.inputs
        |> List.indexedMap
            (\index ( _, inputType ) ->
                DataCodec.decodeData ir inputType
                    |> Result.map (Decode.index index >> Decode.map Just)
            )
        |> ResultList.keepFirstError
        |> Result.map (List.foldr (Decode.map2 (::)) (Decode.succeed []))

