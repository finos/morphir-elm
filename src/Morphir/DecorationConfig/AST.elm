module Morphir.DecorationConfig.AST exposing (..)

import Morphir.IR.FQName exposing (FQName)


type alias IRPath =
    String


type alias StorageLocation =
    String


type alias DecorationConfig =
    { displayName : String
    , irPath : IRPath
    , entryPoint : FQName
    , storageLocation : StorageLocation
    }
