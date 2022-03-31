module Morphir.Web.Graph.Graph exposing (..)

import Browser
import Dict exposing (Dict)
import Elm.Syntax.Module exposing (Module)
import Html exposing (..)
import Html.Attributes exposing (attribute)
import Json.Encode as Encode exposing (..)
import Morphir.Dependency.DAG exposing (DAG)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Module exposing (ModuleName)
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package exposing (lookupModuleDefinition)
import Morphir.IR.Type as Type exposing (Type)
import Set exposing (Set)



-- initialModel : Graph
-- initialModel =
--     exampleGraph
-- init : () -> ( Graph, Cmd Msg )
-- init _ =
--     ( initialModel, Cmd.none )
--MAIN
-- main : Program () Graph Msg
-- main =
--     Browser.element
--         { init = init
--         , view = view
--         , update = update
--         , subscriptions = \_ -> Sub.none
--         }


type alias Node =
    { id : Int, label : String }


type alias Edge =
    { from : Int, to : Int }


type alias Graph =
    { nodes : List Node
    , edges : List Edge
    }


empty : Graph
empty =
    { nodes = [], edges = [] }



--MODEL
--type Msg
--    = UpdateGraph Graph
--
--
--
----UPDATE
--
--
--update : Msg -> Graph -> ( Graph, Cmd Msg )
--update msg graph =
--    case msg of
--        UpdateGraph newGraph ->
--            ( newGraph, Cmd.none )
--VIS GRAPH


encodeNode : Node -> Encode.Value
encodeNode node =
    Encode.object <|
        [ ( "id", Encode.int node.id )
        , ( "label", Encode.string node.label )
        ]


encodeEdge : Edge -> Encode.Value
encodeEdge edge =
    Encode.object <|
        [ ( "to", Encode.int edge.to )
        , ( "from", Encode.int edge.from )
        ]


encodeGraph : Graph -> Encode.Value
encodeGraph g =
    Encode.object <|
        [ ( "nodes", Encode.list encodeNode g.nodes )
        , ( "edges", Encode.list encodeEdge g.edges )
        ]


exampleGraph : Graph
exampleGraph =
    Graph [ { id = 1, label = "F" }, { id = 3, label = "G" } ] [ { from = 1, to = 3 } ]


depList =
    [ ( "a", [ "b", "c", "e", "k" ] )
    , ( "k", [ "j" ] )
    , ( "u", [] )
    , ( "b", [] )
    , ( "c", [ "f" ] )
    , ( "e", [ "k", "f", "g" ] )
    , ( "j", [] )
    , ( "x", [ "y" ] )
    , ( "f", [] )
    , ( "g", [ "h", "i", "j" ] )
    , ( "h", [] )
    , ( "i", [] )
    ]


dagToGraph : DAG FQName -> Graph


dagToGrpah =
    Debug.todo "Implement"


extractTypesAndValues : ModuleName -> Distribution -> Graph
extractTypesAndValues moduleName (Library packageName _ packageDefinition) =
    case lookupModuleDefinition moduleName packageDefinition of
        Just moduleDef ->
            let
                typeDefToType : Type.Definition ta -> List (Type ta)
                typeDefToType typeDef =
                    case typeDef of
                        Type.TypeAliasDefinition _ typ ->
                            [ typ ]

                        Type.CustomTypeDefinition lists accessControlled ->
                            accessControlled
                                |> .value
                                |> Dict.toList
                                |> List.map Tuple.second
                                |> List.concat
                                |> List.map Tuple.second

                t : Set ( FQName, Set FQName )
                t =
                    Dict.toList moduleDef.types
                        |> List.map
                            (\( typeName, accessControlDefinition ) ->
                                accessControlDefinition
                                    |> .value
                                    |> .value
                                    |> (\def ->
                                            def
                                                |> typeDefToType
                                       )
                            )
            in
            empty

        Nothing ->
            empty


depListAsGraph : Graph
depListAsGraph =
    let
        indexByNode : Dict String Int
        indexByNode =
            depList
                |> List.indexedMap (\index item -> ( Tuple.first item, index ))
                |> Dict.fromList
    in
    Graph
        (indexByNode
            |> Dict.toList
            |> List.map (\( item, index ) -> { label = item, id = index })
        )
        (depList
            |> List.foldl
                (\( fromNode, edges ) edgeListSoFar ->
                    edges
                        |> List.map
                            (\toNode ->
                                { from = Dict.get fromNode indexByNode |> Maybe.withDefault -1
                                , to = Dict.get toNode indexByNode |> Maybe.withDefault -1
                                }
                            )
                        |> List.append edgeListSoFar
                )
                []
        )



--VIEW
--view : String -> String -> Graph -> Html msg
--view width height graphValue =
--    visGraph width height depListAsGraph


visGraph : Graph -> Html msg
visGraph graphContent =
    node "vis-graph"
        [ attribute "graph" (encodeGraph graphContent |> Encode.encode 0)
        ]
        []
