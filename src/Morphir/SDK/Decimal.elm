module Morphir.SDK.Decimal exposing
    ( Decimal
    , fromInt
    , fromFloat
    , fromString
    , toString
    , add
    , sub
    , mul
    , negate
    , round
    , eq
    , neq
    , compare
    , abs
    , zero
    , one
    , minusOne
    )

{-|


# The datatype

@docs Decimal


# Conversion

@docs fromInt
@docs fromFloat
@docs fromString
@docs toString


# Arithmetic operations

@docs add
@docs sub
@docs mul
@docs negate


# Rounding

@docs round


# Comparing

@docs eq
@docs neq
@docs compare


# Misc operations

@docs abs


# Common Constants

@docs zero
@docs one
@docs minusOne

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


{-| Converts a Float to a Decimal
-}
fromFloat : Float -> Maybe Decimal
fromFloat f =
    D.fromFloat f


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


{-| Addition
-}
add : Decimal -> Decimal -> Decimal
add a b =
    D.add a b


sub : Decimal -> Decimal -> Decimal
sub a b =
    D.sub a b


{-| Multiplication
-}
mul : Decimal -> Decimal -> Decimal
mul a b =
    D.mul a b


{-| Changes the sign of a Decimal
-}
negate : Decimal -> Decimal
negate value =
    D.negate value


{-| Rounds the Decimal to the specified decimal places
-}
round : Int -> Decimal -> Decimal
round n d =
    D.round n d


{-| Absolute value (sets the sign as positive)
-}
abs : Decimal -> Decimal
abs value =
    D.abs value


{-| Compares two Decimals
-}
compare : Decimal -> Decimal -> Order
compare a b =
    D.compare a b


{-| Equals
-}
eq : Decimal -> Decimal -> Bool
eq a b =
    D.eq a b


{-| Not equals
-}
neq : Decimal -> Decimal -> Bool
neq a b =
    not (eq a b)


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
