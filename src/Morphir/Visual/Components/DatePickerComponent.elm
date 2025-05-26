module Morphir.Visual.Components.DatePickerComponent exposing (..)

import Element exposing (Element)
import Element.Input as Input
import Html
import Html.Attributes exposing (for, type_, value)
import Html.Events exposing (onInput)
import Morphir.SDK.LocalDate as LocalDate exposing (LocalDate)
import Morphir.Visual.Theme exposing (Theme)


type alias Config msg =
    { onStateChange : DatePickerState -> msg
    , label : Element msg
    , placeholder : Maybe (Input.Placeholder msg)
    , state : DatePickerState
    }


type alias DatePickerState =
    { date : Maybe LocalDate
    }


initState : Maybe LocalDate -> DatePickerState
initState initialDate =
    { date = initialDate }


view : Theme -> Config msg -> Element msg
view _ config =
    let
        state =
            config.state
    in
    Element.html
        (Html.input
            [ type_ "date"
            , value (config.state.date |> Maybe.map LocalDate.toISOString |> Maybe.withDefault "")
            , onInput (\datestr -> config.onStateChange { state | date = LocalDate.fromISO datestr })
            , for "local date"
            ]
            []
        )
