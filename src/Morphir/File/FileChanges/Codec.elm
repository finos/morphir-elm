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


module Morphir.File.FileChanges.Codec exposing (..)

{-| Codecs for types in the `Morphir.File.FileChanges` module.


# FileChanges

@docs decodeFileChanges

-}

import Dict exposing (Dict)
import Json.Decode as Decode exposing (dict, list, map, string)
import Morphir.File.FileChanges exposing (Change(..), FileChanges)


type alias Changes =
    List String


checkChange : String -> Changes -> Change
checkChange _ change =
    case change of
        firstIndex :: tail ->
            if firstIndex == "Insert" then
                case tail of
                    fileContent :: _ ->
                        Insert fileContent

                    [] ->
                        Debug.todo "Todo"

            else if firstIndex == "Update" then
                case tail of
                    fileContent :: _ ->
                        Update fileContent

                    [] ->
                        Debug.todo "Todo"

            else
                Delete

        [] ->
            Debug.todo "Todo"


decodeDict : Decode.Decoder (Dict String (List String))
decodeDict =
    dict (list string)


{-| Decode FileChanges.
-}
decodeFileChanges : Decode.Decoder FileChanges
decodeFileChanges =
    map (Dict.map checkChange) decodeDict
