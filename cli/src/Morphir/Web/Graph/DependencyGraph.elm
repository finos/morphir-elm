module Morphir.Web.Graph.DependencyGraph exposing (..)

import Element
    exposing
        ( Element
        , column
        , fill
        , fillPortion
        , height
        , html
        , rgb
        , width
        )
import Element.Border as Border
import Morphir.Dependency.DAG as DAG
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Repo as Repo exposing (Repo)
import Morphir.Web.DevelopApp exposing (HomeState, Model, Msg)
import Morphir.Web.Graph.Graph as Graph exposing (Edge, Graph, Node)
import Set exposing (Set)


viewGraph : HomeState -> Graph -> Element msg
viewGraph homeState graph =
    Graph.visGraph graph |> html


dependencyGraph : Model -> Element Msg
dependencyGraph model =
    let
        gray =
            rgb 0.9 0.9 0.9

        filterDepsBySelectedModule : DAG.DAG ( comparable, ModuleName, Name ) -> List ( String, List String )
        filterDepsBySelectedModule deps =
            deps
                |> DAG.toList
                |> List.filterMap
                    (\( ( _, moduleName, localName ), fqNameSet ) ->
                        case model.homeState.selectedModule of
                            Just ( _, selectedModName ) ->
                                if selectedModName == moduleName then
                                    Just
                                        ( localName
                                            |> Name.toHumanWords
                                            |> String.join " "
                                        , Set.toList fqNameSet
                                            |> List.map
                                                (\( _, _, lName ) ->
                                                    lName
                                                        |> Name.toHumanWords
                                                        |> String.join " "
                                                )
                                        )

                                else
                                    Nothing

                            Nothing ->
                                Just
                                    ( localName
                                        |> Name.toHumanWords
                                        |> String.join " "
                                    , Set.toList fqNameSet
                                        |> List.map
                                            (\( _, _, lName ) ->
                                                lName
                                                    |> Name.toHumanWords
                                                    |> String.join " "
                                            )
                                    )
                    )

        filterTypeDeps =
            filterDepsBySelectedModule (Repo.typeDependencies model.repo)

        filterValueDeps =
            filterDepsBySelectedModule (Repo.valueDependencies model.repo)
    in
    column [ width fill, height (fillPortion 3), Border.widthXY 0 8, Border.color gray ]
        [ viewGraph model.homeState (Graph.dagListAsGraph filterTypeDeps)
        , viewGraph model.homeState (Graph.dagListAsGraph filterValueDeps)
        ]
