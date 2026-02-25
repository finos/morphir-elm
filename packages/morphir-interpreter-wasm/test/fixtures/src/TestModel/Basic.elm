module TestModel.Basic exposing (..)


addInts : Int -> Int -> Int
addInts a b =
    a + b


identity : a -> a
identity x =
    x


isPositive : Int -> Bool
isPositive n =
    n > 0
