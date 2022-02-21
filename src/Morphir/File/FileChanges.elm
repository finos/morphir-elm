module Morphir.File.FileChanges exposing (..)

import Dict exposing (Dict)
import Json.Decode as Decode exposing (Decoder)
import Json.Encode as Encode


type alias Path =
    String


{-| Data structure to capture file changes.

It should serialize into this JSON format:

    { "path1": [ "Insert", "..file content..." ]
    , "path2": [ "Update", "..file content..." ]
    }

-}
type alias FileChanges =
    Dict Path Change


type Change
    = Insert String
    | Update String
    | Delete
