module Morphir.Spark.Backend.Codec exposing (..)

import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.FQName.Codec exposing (decodeFQName)
import Morphir.IR.Module exposing (ModuleName)
import Morphir.IR.Path as Path
import Morphir.IR.Type.Codec as TypeCodec
import Morphir.Spark.AST.Codec as ASTCodec
import Morphir.Spark.Backend exposing (Error(..), Options)


decodeOptions : Decode.Decoder Options
decodeOptions =
    let
        decodeModulesToInclude : Decode.Decoder (Maybe (List ModuleName))
        decodeModulesToInclude =
            Decode.field "modulesToProcess"
                (Decode.maybe
                    (Decode.list Decode.string
                        |> Decode.map (List.map Path.fromString)
                    )
                )

        decodeEntryPoints : Decode.Decoder (List FQName)
        decodeEntryPoints =
            Decode.field "entryPoints"
                (Decode.list
                    (Decode.map (\fqnString -> FQName.fromString fqnString ".")
                        Decode.string
                    )
                )
    in
    Decode.field "config"
        (Decode.map2
            (\modulesToProcess entryPoints ->
                Options
                    modulesToProcess
                    entryPoints
            )
            decodeModulesToInclude
            decodeEntryPoints
        )


encodeError : Error -> Encode.Value
encodeError err =
    case err of
        FunctionNotFound fQName ->
            Encode.string ("function not found: " ++ fqn fQName)

        UnknownArgumentType tpe ->
            TypeCodec.encodeType (always Encode.null) tpe
                |> Encode.encode 0
                |> (\typeAsString -> Encode.string ("unknown type argument: " ++ typeAsString))

        MappingError _ error ->
            error
                |> ASTCodec.encodeError
                |> Encode.encode 0
                |> (\errString ->
                        Encode.string ("mapping error: " ++ errString)
                   )

        EntryPointNotFound fQName ->
            Encode.string ("function not found: " ++ fqn fQName)


fqn : FQName -> String
fqn fqName =
    FQName.toString fqName
