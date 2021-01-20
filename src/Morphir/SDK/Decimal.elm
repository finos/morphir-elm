module Morphir.SDK.Decimal exposing
    ( Decimal
    , abs, fromInt, fromIntWithExponent, fromString, minusOne, one, toString, zero
    )

{-|


# The datatype

@docs Decimal


# Conversion

#docs fromInt

-}

import Decimal as D


{-| The Decimal data type
-}
type alias Decimal =
    D.Decimal


{-| Converts an Int to a Decimal
-}
fromInt : Int -> Decimal
fromInt n =
    D.fromInt n


{-| Converts an Int to a Decimal, but specifying the exponent
-}
fromIntWithExponent : Int -> Int -> Decimal
fromIntWithExponent n e =
    D.fromIntWithExponent n e


{-| Converts a String to a Maybe Decimal. The string shall be in the format [<sign>]<numbers>[.<numbers>][e<numbers>]
-}
fromString : String -> Maybe Decimal
fromString str =
    D.fromString str


{-| Converts a Decimal to a String
-}
toString : Decimal -> String
toString decimalValue =
    D.toString decimalValue


{-| Absolute value (sets the sign as positive)
-}
abs : Decimal -> Decimal
abs value =
    D.abs value


{-| The number 0
-}
zero : Decimal
zero =
    D.zero


{-| The number 1
-}
one : Decimal
one =
    D.one


{-| The number -1
-}
minusOne : Decimal
minusOne =
    D.minusOne
