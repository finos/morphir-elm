module Morphir.Decoration.Model.Security exposing (..)


type Levels
    = L1
    | L2
    | L3


type alias Clearance =
    { level : Levels
    , stage : Int
    }
