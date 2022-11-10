module Morphir.Spark.Backend.Codec exposing (..)

import Json.Encode as Encode
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Type.Codec as TypeCodec
import Morphir.Spark.AST.Codec as ASTCodec
import Morphir.Spark.Backend exposing (Error(..))


encodeError : Error -> Encode.Value
encodeError err =
    case err of
        FunctionNotFound fQName ->
            Encode.string ("function not found: " ++ fqn fQName)

        UnknownArgumentType tpe ->
            TypeCodec.encodeType (always Encode.null) tpe
                |> Encode.encode 0
                |> (\typeAsString -> Encode.string ("unknown type argument: " ++ typeAsString))

        MappingError error ->
            error
                |> ASTCodec.encodeError
                |> Encode.encode 0
                |> (\errString ->
                        Encode.string ("mapping error: " ++ errString)
                   )


fqn : FQName -> String
fqn fqName =
    FQName.toString fqName
