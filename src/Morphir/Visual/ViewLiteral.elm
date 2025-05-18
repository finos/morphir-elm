module Morphir.Visual.ViewLiteral exposing (..)

import Element exposing (Element, alignLeft, centerX, centerY, el, padding, row, text)
import Element.Font as Font
import FormatNumber exposing (format)
import FormatNumber.Locales exposing (Decimals(..), usLocale)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.SDK.Decimal as Decimal
import Morphir.Visual.Common as Common
import Morphir.Visual.Config exposing (Config)


view : Config msg -> Literal -> Element msg
view config literal =
    case literal of
        BoolLiteral bool ->
            viewLiteralText config
                "bool-literal"
                (if bool then
                    "True"

                 else
                    "False"
                )

        CharLiteral char ->
            viewLiteralText config
                "char-literal"
                (String.concat [ "'", String.fromChar char, "'" ])

        StringLiteral string ->
            viewLiteralText config
                "string-literal"
                (String.concat [ "\"", string, "\"" ])

        WholeNumberLiteral int ->
            viewLiteralText config
                "int-literal"
                (format { usLocale | decimals = Exact 0, negativePrefix = "- ( ", negativeSuffix = " )" }
                    (toFloat int)
                )

        FloatLiteral float ->
            viewLiteralText config
                "float-literal"
                (format
                    { usLocale | decimals = Exact config.state.theme.decimalDigit, negativePrefix = "- ( ", negativeSuffix = " )" }
                    float
                )

        DecimalLiteral decimal ->
            viewLiteralText config
                "decimal-literal"
                (Decimal.toString decimal)


viewLiteralText : Config msg -> String -> String -> Element msg
viewLiteralText config className literalText =
    el
        [ Common.cssClass className
        , centerX
        , centerY
        , alignLeft
        , Font.color config.state.theme.colors.literalFont
        , Font.bold
        ]
        (text literalText)
