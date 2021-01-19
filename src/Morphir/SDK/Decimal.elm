module Morphir.SDK.Decimal exposing (Decimal, abs)
import Decimal as DecimalModule

type alias Decimal = DecimalModule.Decimal

abs: Decimal -> Decimal
abs value =
    DecimalModule.abs value