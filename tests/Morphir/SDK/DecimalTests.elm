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
    Fuzz.map2 Decimal.fromIntWithExponent int (intRange -20 20)


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
                    (Just <| Decimal.fromIntWithExponent a b)
        , test "decimal" <|
            \_ ->
                Expect.equal (Decimal.fromString "1.1") (Just <| Decimal.fromIntWithExponent 11 -1)
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
                Expect.equal "-1234.5678" (Decimal.toString <| Decimal.fromIntWithExponent -12345678 -4)
        ]
