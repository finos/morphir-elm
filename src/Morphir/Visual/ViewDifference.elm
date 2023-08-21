module Morphir.Visual.ViewDifference exposing (..)

import Dict exposing (Dict)
import Diff exposing (Change(..), diff)
import Element as Element exposing (..)
import Element.Background as Background
import Element.Font as Font
import FontAwesome.Solid exposing (key)
import List.Extra
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Value as Value exposing (Value)
import Morphir.SDK.Decimal as Decimal
import Morphir.SDK.LocalDate as LocalDate
import Morphir.Visual.Theme as Theme exposing (Theme)


viewValueDifference : Theme -> Value ta va -> Value ta va -> Element msg
viewValueDifference theme oldValue newValue =
    case ( oldValue, newValue ) of
        ( Value.Literal _ oldLiteral, Value.Literal _ newLiteral ) ->
            viewLiteralDifference theme oldLiteral newLiteral

        ( Value.Tuple _ oldTuple, Value.Tuple _ newTuple ) ->
            viewListDiff theme oldTuple newTuple

        ( Value.List _ oldList, Value.List _ newList ) ->
            viewListDiff theme oldList newList

        ( Value.Record _ oldRecord, Value.Record _ newRecord ) ->
            viewRecordDiff theme oldRecord newRecord

        ( Value.Apply _ (Value.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "dict" ] ], [ "from", "list" ] )) (Value.List _ oldDictItems), Value.Apply _ (Value.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "dict" ] ], [ "from", "list" ] )) (Value.List _ newDictItems) ) ->
            viewDictDiff theme oldDictItems newDictItems

        ( Value.Apply _ (Value.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "local", "date" ] ], [ "from", "i", "s", "o" ] )) oldDate, Value.Apply _ (Value.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "local", "date" ] ], [ "from", "i", "s", "o" ] )) newDate ) ->
            viewValueDifference theme oldDate newDate

        _ ->
            defaultView newValue


defaultView : Value ta va -> Element msg
defaultView newValue =
    row [ width fill ] [ el [ Font.bold ] (text "New Value: "), Value.toString newValue |> text ]


viewLiteralDifference : Theme -> Literal -> Literal -> Element msg
viewLiteralDifference theme oldLiteral newLiteral =
    let
        percentage : Float -> Float -> String
        percentage x y =
            if x < y then
                "+" ++ (String.fromFloat <| toFloat (round (100 * ((100 * x) / y))) / 100) ++ "%"

            else
                "-" ++ (String.fromFloat <| toFloat (round (100 * ((100 * y) / x))) / 100) ++ "%"
    in
    if oldLiteral == newLiteral then
        Element.none

    else
        case ( oldLiteral, newLiteral ) of
            ( BoolLiteral oldBoolVal, BoolLiteral newBoolVal ) ->
                let
                    boolToString : Bool -> String
                    boolToString boolVal =
                        if boolVal then
                            "True"

                        else
                            "False"
                in
                row [ width fill, spacing <| Theme.smallSpacing theme ] [ text (boolToString oldBoolVal), text "=>", text (boolToString newBoolVal) ]

            ( CharLiteral oldCharVal, CharLiteral newCharVal ) ->
                row [ width fill, spacing <| Theme.smallSpacing theme ] [ text ("'" ++ String.fromChar oldCharVal ++ "'"), text "=>", text ("'" ++ String.fromChar newCharVal ++ "'") ]

            ( WholeNumberLiteral oldInt, WholeNumberLiteral newInt ) ->
                row []
                    [ if (newInt - oldInt) < 0 then
                        text <| String.fromInt (newInt - oldInt)

                      else
                        text <| "+" ++ String.fromInt (newInt - oldInt)
                    , text " | "
                    , text <| percentage (toFloat oldInt) (toFloat newInt)
                    ]

            ( FloatLiteral oldFloat, FloatLiteral newFloat ) ->
                row []
                    [ if (newFloat - oldFloat) < 0 then
                        text <| String.fromFloat (newFloat - oldFloat)

                      else
                        text <| "+" ++ String.fromFloat (newFloat - oldFloat)
                    , text " | "
                    , text <| percentage oldFloat newFloat
                    ]

            ( DecimalLiteral oldDecimal, DecimalLiteral newDecimal ) ->
                let
                    difference : Decimal.Decimal
                    difference =
                        Decimal.sub newDecimal oldDecimal
                in
                row []
                    [ if Decimal.lt difference Decimal.zero then
                        text <| Decimal.toString difference

                      else
                        text <| "+" ++ Decimal.toString difference
                    , text " | "
                    ]

            ( StringLiteral oldString, StringLiteral newString ) ->
                viewStringDiff theme oldString newString

            _ ->
                defaultView (Value.literal () newLiteral)


sequenceDiff : List (Diff.Change a) -> ((Diff.Change a) -> Element msg) -> Element msg -> Element msg
sequenceDiff diffSequence colorCode separator =
    let
        removed : Element msg
        removed =
            diffSequence
                |> List.filterMap
                    (\x ->
                        case x of
                            Added _ ->
                                Nothing

                            _ ->
                                Just x
                    )
                |> List.map colorCode
                |> List.intersperse separator
                |> row []

        added : Element msg
        added =
            diffSequence
                |> List.filterMap
                    (\x ->
                        case x of
                            Removed _ ->
                                Nothing

                            _ ->
                                Just x
                    )
                |> List.map colorCode
                |> List.intersperse separator
                |> row []
    in
    column [spacing 1] [ removed, added ]


viewStringDiff : Theme -> String -> String -> Element msg
viewStringDiff theme oldString newString =
    let
        stringDiff : List (Diff.Change Char)
        stringDiff =
            diff (String.toList oldString) (String.toList newString)

        asDate : String -> String -> Element msg
        asDate oldDate newDate =
            case ( LocalDate.fromISO oldDate, LocalDate.fromISO newDate ) of
                ( Just a, Just b ) ->
                    row [] [ text <| String.fromInt (LocalDate.diffInDays a b), el [ Font.italic ] (text " days") ]

                _ ->
                    Element.none

        colorCode : Diff.Change Char -> Element msg
        colorCode change =
            case change of
                Added c ->
                    el [ Background.color theme.colors.positiveLight ] <| text (String.fromChar c)

                Removed c ->
                    el [ Background.color theme.colors.negativeLight ] <| text (String.fromChar c)

                NoChange c ->
                    text (String.fromChar c)
    in
    column [spacing 1] [ sequenceDiff stringDiff colorCode Element.none, asDate oldString newString ]


viewListDiff : Theme -> List (Value ta va) -> List (Value ta va) -> Element msg
viewListDiff theme oldList newList =
    let
        listDiff : List (Diff.Change (Value ta va))
        listDiff =
            diff oldList newList

        colorCode : Diff.Change (Value ta va) -> Element msg
        colorCode change =
            case change of
                Added c ->
                    el [ Background.color theme.colors.positiveLight ] <| text (Value.toString c)

                Removed c ->
                    el [ Background.color theme.colors.negativeLight ] <| text (Value.toString c)

                NoChange c ->
                    text (Value.toString c)
    in
    sequenceDiff listDiff colorCode (text " , ")

viewRecordDiff : Theme -> Dict Name (Value ta va) -> Dict Name (Value ta va) -> Element msg
viewRecordDiff theme oldRecord newRecord =
    let
        deletedFields : Dict Name (Value ta va)
        deletedFields =
            let
                accumulateDeleted : Name -> b -> Dict Name b -> Dict Name b
                accumulateDeleted key value deletedFieldsDict =
                    case Dict.get key newRecord of
                        Nothing ->
                            Dict.insert key value deletedFieldsDict

                        _ ->
                            deletedFieldsDict
            in
            Dict.foldl
                (\key value deletedSoFar ->
                    accumulateDeleted key value deletedSoFar
                )
                Dict.empty
                oldRecord

        addedFields : Dict Name (Value ta va)
        addedFields =
            let
                accumulateAdded : Name -> b -> Dict Name b -> Dict Name b
                accumulateAdded key value addedFieldsDict =
                    case Dict.get key oldRecord of
                        Nothing ->
                            Dict.insert key value addedFieldsDict

                        _ ->
                            addedFieldsDict
            in
            Dict.foldl
                (\key value addedSoFar ->
                    accumulateAdded key value addedSoFar
                )
                Dict.empty
                newRecord

        changedFields : Dict Name ( Value ta va, Value ta va )
        changedFields =
            let
                accumulateChanged : Name -> Value ta va -> Dict Name ( Value ta va, Value ta va ) -> Dict Name ( Value ta va, Value ta va )
                accumulateChanged key value changedFieldsDict =
                    case Dict.get key oldRecord of
                        Nothing ->
                            changedFieldsDict

                        Just oldValue ->
                            if value == oldValue then
                                changedFieldsDict

                            else
                                Dict.insert key ( oldValue, value ) changedFieldsDict
            in
            Dict.foldl
                (\key value addedSoFar ->
                    accumulateChanged key value addedSoFar
                )
                Dict.empty
                newRecord

        dictToTable : Dict Name a -> (a -> Element msg) -> Color -> String -> Element msg
        dictToTable dict displayFunc color label =
            if Dict.isEmpty dict then
                Element.none

            else
                row []
                    [ Dict.toList dict
                        |> List.map
                            (\( key, value ) ->
                                row
                                    [ Theme.borderBottom 1, Background.color color, spacing <| Theme.smallSpacing theme ]
                                    [ el [ Font.bold ] (text <| Name.toCamelCase key ++ " : "), displayFunc value ]
                            )
                        |> column []
                    , el [ Font.italic, paddingXY (Theme.mediumPadding theme) 0 ] (text label)
                    ]
    in
    column [ spacing 1 ]
        [ dictToTable deletedFields (\x -> text (Value.toString x)) theme.colors.negativeLight "deleted"
        , dictToTable addedFields (\x -> text (Value.toString x)) theme.colors.positiveLight "added"
        , dictToTable changedFields (\( a, b ) -> viewValueDifference theme a b) theme.colors.backgroundColor "changed"
        ]


viewDictDiff : Theme -> List (Value ta va) -> List (Value ta va) -> Element msg
viewDictDiff theme oldDictList newDictList =
    let
        keyValuePair : Value ta va -> Maybe ( Value ta va, Value ta va )
        keyValuePair v =
            case v of
                Value.Tuple _ [ key, value ] ->
                    Just <| Tuple.pair key value

                _ ->
                    Nothing

        findValuesForKeys : List a -> List ( a, b ) -> List ( a, b )
        findValuesForKeys keys keyValuepairs =
            List.foldl
                (\kv entriesSoFar ->
                    if List.member (Tuple.first kv) keys then
                        kv :: entriesSoFar

                    else
                        entriesSoFar
                )
                []
                keyValuepairs

        oldDictKeys : List (Value ta va)
        oldDictKeys =
            List.filterMap keyValuePair oldDictList |> List.map Tuple.first

        newDictKeys : List (Value ta va)
        newDictKeys =
            List.filterMap keyValuePair newDictList |> List.map Tuple.first

        deletedEntries : List ( Value ta va, Value ta va )
        deletedEntries =
            let
                deletedKeys : List (Value ta va)
                deletedKeys =
                    List.filter (\x -> not <| List.member x newDictKeys) oldDictKeys
            in
            findValuesForKeys deletedKeys (List.filterMap keyValuePair oldDictList)

        addedEntries : List ( Value ta va, Value ta va )
        addedEntries =
            let
                addedKeys : List (Value ta va)
                addedKeys =
                    List.filter (\x -> not <| List.member x oldDictKeys) newDictKeys
            in
            findValuesForKeys addedKeys (List.filterMap keyValuePair newDictKeys)

        changedEntries : List ( Value ta va, ( Value ta va, Value ta va ) )
        changedEntries =
            let
                sameKeys : List (Value ta va)
                sameKeys =
                    List.filter (\x -> List.member x oldDictKeys) newDictKeys

                oldEntries : List ( Value ta va, Value ta va )
                oldEntries =
                    findValuesForKeys sameKeys (List.filterMap keyValuePair oldDictList)

                newEntries : List ( Value ta va, Value ta va )
                newEntries =
                    findValuesForKeys sameKeys (List.filterMap keyValuePair newDictList)
            in
            List.filterMap
                (\( ( key, newVal ), oldVal ) ->
                    if not (oldVal == newVal) then
                        Just ( key, ( oldVal, newVal ) )

                    else
                        Nothing
                )
                (List.Extra.zip newEntries (oldEntries |> List.map Tuple.second))

        toTable : List ( Value ta va, a ) -> (a -> Element msg) -> Color -> String -> Element msg
        toTable list displayFunc color label =
            if List.isEmpty list then
                Element.none

            else
                row []
                    [ list
                        |> List.map
                            (\( key, value ) ->
                                row
                                    [ Theme.borderBottom 1, Background.color color, spacing <| Theme.smallSpacing theme ]
                                    [ el [ Font.bold ] (text <| Value.toString key ++ " : "), displayFunc value ]
                            )
                        |> column []
                    , el [ Font.italic, paddingXY (Theme.mediumPadding theme) 0 ] (text label)
                    ]
    in
    column [ spacing 1 ]
        [ toTable deletedEntries (\x -> text (Value.toString x)) theme.colors.negativeLight "deleted"
        , toTable addedEntries (\x -> text (Value.toString x)) theme.colors.positiveLight "added"
        , toTable changedEntries (\( a, b ) -> viewValueDifference theme (a |> Debug.log "a") (b |> Debug.log "b")) theme.colors.backgroundColor "changed"
        ]
