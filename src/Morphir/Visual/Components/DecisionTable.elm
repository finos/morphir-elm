module Morphir.Visual.Components.DecisionTable exposing
    ( DecisionTable
    , Rule, TypedPattern, displayTable
    )

{-| This module contains a generic decision table representation that is relatively easy to map to a visualization.

@docs DecisionTable, Match

-}

import Dict
import Element exposing (Attribute, Color, Column, Element, centerY, el, fill, height, none, padding, rgb255, row, shrink, table, text, width)
import Element.Background as Background
import Element.Border as Border
import Element.Font as Font exposing (center)
import Morphir.IR.FQName exposing (getLocalName)
import Morphir.IR.Name exposing (toHumanWordsTitle)
import Morphir.IR.Type exposing (Type)
import Morphir.IR.Value as Value exposing (Pattern(..), Value, indexedMapValue)
import Morphir.Value.Interpreter exposing (Variables)
import Morphir.Visual.Common exposing (nameToText)
import Morphir.Visual.Config exposing (Config, HighlightState(..), VisualState)
import Morphir.Visual.EnrichedValue exposing (EnrichedValue)
import Morphir.Visual.Theme exposing (borderRounded, mediumPadding, smallPadding)



--


{-| Represents a decision table. It has two fields:

  - `decomposeInput`
      - contains a list of functions that can be used to decomposed a single input value to a list of values
      - each function takes the input value as the input and return some other value (typically extracts a field of a record value)
      - each function corresponds to an input column in the decision table
  - `rules`
      - contains a list of rules specified as a pair of matches and an output value
      - each rule corresponds to a row in the decision table
      - the number of matches in each rule should be the same as the number of functions defined in `decomposeInput`

-}
type alias DecisionTable =
    { decomposeInput : List EnrichedValue
    , rules : List Rule
    }


type alias TypedPattern =
    Pattern (Type ())


type alias Rule =
    { matches : List TypedPattern
    , result : EnrichedValue
    , highlightStates : List HighlightState
    }


displayTable : Config msg -> (Config msg -> EnrichedValue -> Element msg) -> DecisionTable -> Element msg
displayTable config viewValue table =
    tableHelp config viewValue table.decomposeInput table.rules


tableBackgroundColor : Config msg -> Color
tableBackgroundColor config =
    config.state.theme.colors.lightGray


tableBorderColor : Config msg -> Color
tableBorderColor config =
    rgb255 201 201 201


tableCellBackgroundColor : Config msg -> Color
tableCellBackgroundColor config =
    config.state.theme.colors.lightest


tableHelp : Config msg -> (Config msg -> EnrichedValue -> Element msg) -> List EnrichedValue -> List Rule -> Element msg
tableHelp config viewValue headerFunctions rows =
    table
        [ Border.solid
        , Border.width 1
        , mediumPadding config.state.theme |> Border.rounded
        , Border.color (tableBorderColor config)
        , tableBackgroundColor config |> Background.color
        ]
        { data = rows
        , columns =
            List.append (headerFunctions |> getColumnFromHeader config viewValue 0)
                [ Column
                    none
                    shrink
                    (\rules ->
                        let
                            fontColor : Color
                            fontColor =
                                case List.head (List.reverse rules.highlightStates) of
                                    Just (Matched _) ->
                                        config.state.theme.colors.primaryHighlight

                                    _ ->
                                        config.state.theme.colors.mediumGray
                        in
                        el
                            [ width fill
                            , height fill
                            , Font.color fontColor
                            , Font.bold
                            , Font.size 24
                            ]
                            (el [ centerY ] (text "→"))
                    )
                , Column
                    (el
                        [ Border.roundEach { topLeft = 0, topRight = mediumPadding config.state.theme, bottomLeft = 0, bottomRight = 0 }
                        , mediumPadding config.state.theme |> padding
                        , height fill
                        , center
                        ]
                        (text "Result")
                    )
                    shrink
                    (\rules ->
                        el
                            [ width fill
                            , height fill
                            , smallPadding config.state.theme |> padding
                            ]
                            (el
                                ([ width fill
                                 , height fill
                                 , mediumPadding config.state.theme |> Border.rounded
                                 , mediumPadding config.state.theme |> padding
                                 , tableCellBackgroundColor config |> Background.color
                                 ]
                                    ++ highlightStateToAttributes config (List.head (List.reverse rules.highlightStates))
                                )
                                (viewValue (updateConfig config (List.head (List.reverse rules.highlightStates))) rules.result)
                            )
                    )
                ]
        }


getColumnFromHeader : Config msg -> (Config msg -> EnrichedValue -> Element msg) -> Int -> List EnrichedValue -> List (Column Rule msg)
getColumnFromHeader config viewValue index decomposeInput =
    case decomposeInput of
        inputHead :: [] ->
            columnHelper config viewValue inputHead index

        inputHead :: inputTail ->
            List.concat [ columnHelper config viewValue inputHead index, getColumnFromHeader config viewValue (index + 1) inputTail ]

        _ ->
            []


columnHelper : Config msg -> (Config msg -> EnrichedValue -> Element msg) -> EnrichedValue -> Int -> List (Column Rule msg)
columnHelper config viewValue header index =
    [ Column
        (el
            [ mediumPadding config.state.theme |> padding
            , height fill
            , width fill
            ]
            (el [ center ] (viewValue config header))
        )
        fill
        (\rules ->
            el
                [ width fill
                , height fill
                , smallPadding config.state.theme |> padding
                ]
                (el
                    ([ width fill
                     , height fill
                     , mediumPadding config.state.theme |> Border.rounded
                     , mediumPadding config.state.theme |> padding
                     , tableCellBackgroundColor config |> Background.color
                     ]
                        ++ highlightStateToAttributes config (List.head (List.reverse rules.highlightStates))
                    )
                    (getCaseFromIndex config header viewValue (rules.highlightStates |> List.drop index |> List.head) (rules.matches |> List.drop index |> List.head))
                )
        )
    ]


updateConfig : Config msg -> Maybe HighlightState -> Config msg
updateConfig config highlightState =
    let
        tableState : VisualState
        tableState =
            config.state

        updateVariables : Variables
        updateVariables =
            case highlightState of
                Just hls ->
                    case hls of
                        Matched vars ->
                            vars

                        _ ->
                            Dict.empty

                _ ->
                    Dict.empty

        updatedTableState : VisualState
        updatedTableState =
            { tableState | highlightState = highlightState, variables = Dict.union updateVariables config.state.variables }
    in
    { config | state = updatedTableState }


getCaseFromIndex : Config msg -> EnrichedValue -> (Config msg -> EnrichedValue -> Element msg) -> Maybe HighlightState -> Maybe (Pattern (Type ())) -> Element msg
getCaseFromIndex config head viewValue highlightState rule =
    case rule of
        Just match ->
            let
                updatedConfig : Config msg
                updatedConfig =
                    updateConfig config highlightState
            in
            case match of
                Value.WildcardPattern _ ->
                    el [ mediumPadding config.state.theme |> padding, Font.italic ] (text "anything else")

                Value.LiteralPattern va literal ->
                    let
                        value : EnrichedValue
                        value =
                            Value.Literal va literal |> indexedMapValue Tuple.pair 0 |> Tuple.first
                    in
                    el [ mediumPadding config.state.theme |> padding ] (viewValue updatedConfig value)

                Value.ConstructorPattern _ fQName matches ->
                    let
                        parsedMatches : List (Element msg)
                        parsedMatches =
                            List.map (getCaseFromIndex config head viewValue highlightState << Just << toTypedPattern) matches

                        --enclose in parentheses for nested constructors
                    in
                    row [ width fill, mediumPadding config.state.theme |> padding ] (List.concat [ [ text "(", text ((toHumanWordsTitle >> String.join " ") (getLocalName fQName)) ], List.intersperse (text ",") parsedMatches, [ text ")" ] ])

                Value.AsPattern _ (Value.WildcardPattern _) name ->
                    el [ mediumPadding config.state.theme |> padding ] (text (nameToText name))

                Value.AsPattern _ asPattern _ ->
                    getCaseFromIndex config head viewValue highlightState (Just (toTypedPattern asPattern))

                _ ->
                    text "pattern type not implemented"

        Nothing ->
            text "nothing"


toTypedPattern : Pattern (Type ()) -> Pattern (Type ())
toTypedPattern match =
    match |> Value.mapPatternAttributes (always (Value.patternAttribute match))


highlightStateToAttributes : Config msg -> Maybe HighlightState -> List (Attribute msg)
highlightStateToAttributes config highlightState =
    let
        defaultAttributes : List (Attribute msg)
        defaultAttributes =
            [ Border.solid
            , Border.width 1
            , Border.color (tableBorderColor config)
            ]

        highlightAttributes : List (Attribute msg)
        highlightAttributes =
            [ Border.solid
            , Border.width 1
            , Border.color config.state.theme.colors.primaryHighlight
            , Border.shadow
                { offset = ( 0, 0 )
                , size = 0
                , blur = 3
                , color = config.state.theme.colors.primaryHighlight
                }
            ]
    in
    case highlightState of
        Just state ->
            case state of
                Matched _ ->
                    highlightAttributes

                Unmatched ->
                    defaultAttributes

                Default ->
                    defaultAttributes

        Nothing ->
            defaultAttributes
