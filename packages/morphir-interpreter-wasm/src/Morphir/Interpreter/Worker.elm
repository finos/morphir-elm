port module Morphir.Interpreter.Worker exposing (main)

{-| Elm Worker for the Morphir Extism plugin.

Receives a single JSON message `{ irJson, fqn, args }`, loads the IR, evaluates
the function, and returns `{ ok, value }` or `{ ok: false, error: { variant, message } }`.
Used by the Extism plugin glue (interpreter.js) via one port in, one port out.
-}

import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.FormatVersion.Codec as DistributionCodec
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.SDK as SDK
import Morphir.IR.Value as Value exposing (RawValue)
import Morphir.IR.Value.Codec as ValueCodec
import Morphir.Value.Error as ValueError
import Morphir.Value.Interpreter exposing (evaluateFunctionValue)


-- PORTS


port evaluate : (Decode.Value -> msg) -> Sub msg


port evaluateResult : Encode.Value -> Cmd msg



-- MODEL (no state; each call is independent)


type alias Model =
    ()



-- MSG


type Msg
    = Evaluate Decode.Value



-- MAIN


main : Program () Model Msg
main =
    Platform.worker
        { init = \_ -> ( (), Cmd.none )
        , update = update
        , subscriptions = \_ -> evaluate Evaluate
        }



-- UPDATE


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Evaluate json ->
            case Decode.decodeValue decodeEvaluateInput json of
                Ok { irJson, fqn, args } ->
                    case Decode.decodeValue DistributionCodec.decodeVersionedDistribution irJson of
                        Ok dist ->
                            case evaluateFunctionValue SDK.nativeFunctions dist fqn args of
                                Ok rawValue ->
                                    ( model
                                    , evaluateResult (encodeSuccess (encodeRawValue rawValue))
                                    )

                                Err error ->
                                    let
                                        ( variant, message ) =
                                            errorToResultVariant error
                                    in
                                    ( model
                                    , evaluateResult (encodeError variant message)
                                    )

                        Err decodeErr ->
                            ( model
                            , evaluateResult
                                (encodeError "invalid-ir" (Decode.errorToString decodeErr))
                            )

                Err decodeErr ->
                    ( model
                    , evaluateResult (encodeError "other" (Decode.errorToString decodeErr))
                    )



-- DECODERS


decodeFQNameFromJson : Decoder FQName
decodeFQNameFromJson =
    Decode.map3 FQName.fQName
        (Decode.field "packagePath" Decode.string |> Decode.map Path.fromString)
        (Decode.field "modulePath" Decode.string |> Decode.map Path.fromString)
        (Decode.field "localName" Decode.string |> Decode.map Name.fromString)


decodeArgValue : Decoder (Maybe RawValue)
decodeArgValue =
    Decode.map Just (ValueCodec.decodeValue (Decode.succeed ()) (Decode.succeed ()))


decodeEvaluateInput : Decoder { irJson : Decode.Value, fqn : FQName, args : List (Maybe RawValue) }
decodeEvaluateInput =
    Decode.map3 (\irJson fqn args -> { irJson = irJson, fqn = fqn, args = args })
        (Decode.field "irJson" Decode.value)
        (Decode.field "fqn" decodeFQNameFromJson)
        (Decode.field "args" (Decode.list decodeArgValue))



-- ENCODERS


encodeRawValue : RawValue -> Encode.Value
encodeRawValue =
    ValueCodec.encodeValue (\() -> Encode.list identity []) (\() -> Encode.list identity [])


encodeSuccess : Encode.Value -> Encode.Value
encodeSuccess value =
    Encode.object
        [ ( "ok", Encode.bool True )
        , ( "value", value )
        ]


encodeError : String -> String -> Encode.Value
encodeError variant message =
    Encode.object
        [ ( "ok", Encode.bool False )
        , ( "error"
          , Encode.object
                [ ( "variant", Encode.string variant )
                , ( "message", Encode.string message )
                ]
          )
        ]



-- ERROR MAPPING (variant strings for JSON output)


errorToResultVariant : ValueError.Error -> ( String, String )
errorToResultVariant error =
    case error of
        ValueError.VariableNotFound _ ->
            ( "variable-not-found", ValueError.toString error )

        ValueError.ReferenceNotFound _ ->
            ( "reference-not-found", ValueError.toString error )

        ValueError.NoArgumentToPassToLambda ->
            ( "argument-error", ValueError.toString error )

        ValueError.LambdaArgumentDidNotMatch _ ->
            ( "argument-error", ValueError.toString error )

        ValueError.BindPatternDidNotMatch _ _ ->
            ( "pattern-mismatch", ValueError.toString error )

        ValueError.NoPatternsMatch _ _ ->
            ( "pattern-mismatch", ValueError.toString error )

        ValueError.ExpectedBoolLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedIntLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedFloatLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedStringLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedCharLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedDecimalLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedLiteral _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedList _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedTuple _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedMaybe _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedResult _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedDerivedType _ _ ->
            ( "type-error", ValueError.toString error )

        ValueError.ExpectedUUID _ ->
            ( "type-error", ValueError.toString error )

        ValueError.IfThenElseConditionShouldEvaluateToBool _ _ ->
            ( "type-error", ValueError.toString error )

        ValueError.RecordExpected _ _ ->
            ( "type-error", ValueError.toString error )

        ValueError.TupleExpected ->
            ( "type-error", ValueError.toString error )

        ValueError.ErrorWhileEvaluatingReference _ innerError ->
            errorToResultVariant innerError

        ValueError.ErrorWhileEvaluatingVariable _ innerError ->
            errorToResultVariant innerError

        _ ->
            ( "other", ValueError.toString error )
