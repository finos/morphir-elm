module Morphir.SDK.NumberTests exposing (..)

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
import Morphir.SDK.Number as Number exposing (Number)
import Test exposing (..)


number : Fuzzer Number
number =
    Fuzz.map2
        (\nom denom ->
            Number.divide (Number.fromInt nom) (Number.fromInt denom)
                |> Result.withDefault Number.zero
        )
        int
        int


over : Int -> Int -> Number
over d n =
    makeNumber n d


makeNumber : Int -> Int -> Number
makeNumber n d =
    let
        numerator =
            Number.fromInt n

        denominator =
            Number.fromInt d
    in
    Number.divide numerator denominator |> Result.withDefault Number.zero


equalTests : Test
equalTests =
    describe "Number.equal"
        [ fuzz number "number inequality" <|
            \a ->
                Expect.false "Expected differing number values to not be equal" <|
                    Number.equal a (Number.add a (Number.fromInt 1))
        , fuzz number "number equality" <|
            \a ->
                Expect.true "Expected the same value to be equal" <|
                    Number.equal a a
        ]


notEqualTests : Test
notEqualTests =
    describe "Number.notEqual"
        [ fuzz number "number inequality" <|
            \a ->
                Expect.true "Expected differing number values to not be equal" <|
                    Number.notEqual a (Number.add a (Number.fromInt 1))
        , fuzz number "number equality" <|
            \a ->
                Expect.false "Expected the same value to be equal" <|
                    Number.notEqual a a
        ]


simplifyTests : Test
simplifyTests =
    describe "Number.simplify"
        [ test "4/2 should reduce to 2/1" <|
            \_ ->
                case Number.simplify (4 |> over 2) of
                    Nothing ->
                        Expect.fail "expected simplification to occur but it didn't"

                    Just result ->
                        result |> expectNumbersEqual (Number.fromInt 2)
        , test "7/5 should not simplify" <|
            \_ ->
                case Number.simplify (7 |> over 5) of
                    Nothing ->
                        Expect.pass

                    Just result ->
                        if Number.isSimplified result then
                            Expect.pass

                        else
                            Number.toFractionalString result
                                |> (++) "Expected no simplification to occur but the number simplified to "
                                |> Expect.fail
        , fuzz (intRange 2 999) "simplifying with a numerator of zero" <|
            \n ->
                case Number.simplify (0 |> over n) of
                    Nothing ->
                        Expect.fail "Expected simplification to occur but it didn't"

                    Just actualValue ->
                        actualValue |> expectNumbersEqual Number.zero
        ]


expectNumbersEqual : Number -> Number -> Expect.Expectation
expectNumbersEqual a b =
    if Number.equal a b then
        Expect.pass

    else
        [ "Expected ", Number.toFractionalString a, "to equal", Number.toFractionalString b ] |> String.join " " |> Expect.fail
