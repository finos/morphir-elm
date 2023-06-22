module Morphir.Visual.Components.TimePickerComponent exposing (..)

import Element exposing (Element)
import Element.Input as Input
import Html
import Html.Attributes exposing (for, style, type_, value)
import Html.Events exposing (onInput)
import Morphir.SDK.LocalTime as LocalTime exposing (LocalTime)
import Morphir.Visual.Theme exposing (Theme)


type alias Config msg =
    { onStateChange : TimePickerState -> msg
    , label : Element msg
    , placeholder : Maybe (Input.Placeholder msg)
    , state : TimePickerState
    }


type alias TimePickerState =
    { time : Maybe LocalTime }


initState : Maybe LocalTime -> TimePickerState
initState initialTime =
    { time = initialTime }


view : Theme -> Config msg -> Element msg
view theme config =
    let
        state : TimePickerState
        state =
            config.state
    in
    Html.label [ style "display" "flex" ]
        [ Html.div
            [ style "background-color" "rgb(51, 76, 102 )"
            , style "padding" "5px"
            , style "margin-right" "5px"
            , style "display" "inline"
            , style "color" "rgb(179, 179, 179)"
            ]
            [ Html.text "local time" ]
        , Html.input
            [ type_ "time"
            , value (config.state.time |> Maybe.map LocalTime.toISOString |> Debug.log "timePosix" |> Maybe.withDefault "")
            , onInput (\timestr -> config.onStateChange { state | time = LocalTime.fromISO (timestr |> Debug.log "timestr") })
            , for "local time"
            ]
            []
        ]
        |> Element.html
