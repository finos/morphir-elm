module Morphir.SDK.DecimalTests exposing (..)

{-
   Copyright 2021 Morgan Stanley

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}

import Decimal as D
import Expect
import Fuzz exposing (..)
import Morphir.SDK.Decimal as Decimal exposing (..)
import Test exposing (..)


decimal : Fuzzer Decimal
decimal =
    Fuzz.map2 D.fromIntWithExponent int (intRange -20 20)


absTests : Test
absTests =
    describe "arithmetic operations"
        [ test "abs of negative value" <|
            \_ ->
                D.fromInt -42
                    |> Decimal.abs
                    |> Expect.equal (D.fromInt 42)
        , test "abs of positive value" <|
            \_ ->
                D.fromInt 42
                    |> Decimal.abs
                    |> Expect.equal (Decimal.fromInt 42)
        , test "abs of zero value" <|
            \_ ->
                D.fromInt 0
                    |> Decimal.abs
                    |> Expect.equal (Decimal.fromInt 0)
        ]


addTests : Test
addTests =
    describe "Decimal.add"
        [ fuzz2 int int "mirrors normal addition" <|
            \a b ->
                Expect.equal (Decimal.add (Decimal.fromInt a) (Decimal.fromInt b)) (Decimal.fromInt <| a + b)
        , fuzz2 decimal decimal "is commutative" <|
            \a b ->
                Expect.equal (Decimal.add a b) (Decimal.add b a)
        ]


subTests : Test
subTests =
    describe "Decimal.sub"
        [ fuzz2 int int "mirrors normal subtraction" <|
            \a b ->
                Expect.equal (Decimal.sub (Decimal.fromInt a) (Decimal.fromInt b)) (Decimal.fromInt <| a - b)
        , fuzz2 decimal decimal "switching orders is the same as the negation" <|
            \a b ->
                Expect.equal (Decimal.sub a b) (Decimal.negate (D.sub b a))
        ]


mulTests : Test
mulTests =
    let
        safeInt =
            intRange -46340 46340
    in
    describe "Decimal.mul"
        [ fuzz2 safeInt safeInt "mirrors normal multiplication" <|
            \a b ->
                Expect.true "Expected multiplication to mimic integer multiplication" <|
                    Decimal.eq (Decimal.mul (Decimal.fromInt a) (Decimal.fromInt b)) (Decimal.fromInt <| a * b)
        , fuzz2 decimal decimal "is commutative" <|
            \a b ->
                Expect.equal (Decimal.mul a b) (Decimal.mul b a)
        ]


constructionTests : Test
constructionTests =
    describe "construction tests"
        [ fuzz int "it should support construction from an Int" <|
            \n ->
                Decimal.fromInt n
                    |> Expect.equal (D.fromInt n)
        ]


fromStringTests : Test
fromStringTests =
    describe "Decimal.fromString"
        [ test "positive integer" <|
            \_ ->
                Expect.equal (Decimal.fromString "42") (Just <| Decimal.fromInt 42)
        , test "negative integer" <|
            \_ ->
                Expect.equal (Decimal.fromString "-21") (Just <| Decimal.fromInt -21)
        , test "zero" <|
            \_ ->
                Expect.equal (Decimal.fromString "0") (Just <| Decimal.fromInt 0)
        , test "non-number" <|
            \_ ->
                Expect.equal (Decimal.fromString "esdf") Nothing
        , fuzz2 int int "exponent" <|
            \a b ->
                Expect.equal (Decimal.fromString <| String.fromInt a ++ "e" ++ String.fromInt b)
                    (Just <| D.fromIntWithExponent a b)
        , test "decimal" <|
            \_ ->
                Expect.equal (Decimal.fromString "1.1") (Just <| D.fromIntWithExponent 11 -1)
        ]


fromFloatTests : Test
fromFloatTests =
    describe "Decimal.fromFloat"
        [ test "positive float" <|
            \_ ->
                Expect.equal (Decimal.fromFloat 1) (Just <| Decimal.fromInt 1)
        , test "negative float" <|
            \_ ->
                Expect.equal (Decimal.fromFloat -1) (Just <| Decimal.fromInt -1)
        , test "zero" <|
            \_ ->
                Expect.equal (Decimal.fromFloat 0) (Just <| Decimal.fromInt 0)
        , test "decimal" <|
            \_ ->
                Expect.equal (Decimal.fromFloat 3.3) (Decimal.fromString "3.3")
        , test "exponent" <|
            \_ ->
                Expect.equal (Decimal.fromFloat 1.1e0) (Decimal.fromString "1.1e0")
        , fuzz float "equivalent to fromString" <|
            \a ->
                Expect.equal (Decimal.fromFloat a) (Decimal.fromString <| String.fromFloat a)
        ]


toStringTests : Test
toStringTests =
    describe "Decimal.toString"
        [ test "positive" <|
            \_ ->
                Expect.equal "1" (Decimal.toString <| Decimal.fromInt 1)
        , test "zero" <|
            \_ ->
                Expect.equal "0" (Decimal.toString <| Decimal.fromInt 0)
        , test "negative" <|
            \_ ->
                Expect.equal "-1" (Decimal.toString <| Decimal.fromInt -1)
        , test "decimal" <|
            \_ ->
                Expect.equal "-1234.5678" (Decimal.toString <| D.fromIntWithExponent -12345678 -4)
        ]


compareTests : Test
compareTests =
    describe "Decimal.compare"
        [ fuzz int "integer equality" <|
            \a ->
                Expect.equal EQ (Decimal.compare (Decimal.fromInt a) (Decimal.fromInt a))
        , fuzz int "integer less than" <|
            \a ->
                Expect.equal LT (Decimal.compare (Decimal.fromInt a) (Decimal.fromInt <| a + 1))
        , fuzz int "integer greater than" <|
            \a ->
                Expect.equal GT (Decimal.compare (Decimal.fromInt a) (Decimal.fromInt <| a - 1))
        ]


notEqualTests : Test
notEqualTests =
    describe "Decimal.neq"
        [ fuzz decimal "decimal inequality" <|
            \a ->
                Expect.true "Expected differing decimal values to not be equal" <|
                    Decimal.neq a (Decimal.add a Decimal.minusOne)
        , fuzz decimal "decimal equality" <|
            \a ->
                Expect.false "Expected the same value to be equal" <|
                    Decimal.neq a a
        ]
