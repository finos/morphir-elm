module Morphir.SDK.Json.EncodeTests exposing (..)

import Json.Encode as JE exposing (..)
import Json.Encode.Extra as JEE
import Morphir.SDK.Json.Encode as J
import Test exposing (..)
import Expect
import Set exposing (Set)
import Dict exposing (Dict)
import Morphir.SDK.LocalTime exposing (LocalTime, fromMilliseconds)
import Time exposing (millisToPosix)


stringTests : Test
stringTests =
    describe "string to json"
        [ test "empty string to json" <|
            \_ ->
                Expect.equal (J.string "") (JE.string "")
        , test "test regular string" <|
            \_ ->
                Expect.equal (J.string "Hello world") (JE.string "Hello world")
        ]


intTests : Test
intTests =
    describe "int to json"
        [ test "negative int to json" <|
            \_ ->
                Expect.equal (J.int -9999) (JE.int -9999)
        , test "zero to json" <|
            \_ ->
                Expect.equal (J.int 0) (JE.int 0)
        , test "positive int to json" <|
            \_ ->
                Expect.equal (J.int 1234) (JE.int 1234)
        ]


floatTests : Test
floatTests =
    describe "float to json"
        [ test "negative float to json" <|
            \_ ->
                Expect.equal (J.float -0.124) (JE.float -0.124)
        , test "zero to json" <|
            \_ ->
                Expect.equal (J.float 0) (JE.float 0)
        , test "positive float to json" <|
            \_ ->
                Expect.equal (J.float 99.9) (JE.float 99.9)
        ]


boolTests : Test
boolTests =
    describe "bool to json"
        [ test "true to json" <|
            \_ ->
                Expect.equal (J.bool True) (JE.bool True)
        , test "false to json" <|
            \_ ->
                Expect.equal (J.bool False) (JE.bool False)
        ]


nullTests : Test
nullTests =
    describe "null to json"
        [ test "true to json" <|
            \_ ->
                Expect.equal (J.null) (JE.null)
        ]


listTests : Test
listTests =
    describe "list to json"
        [ test "int list to json" <|
            \_ ->
                Expect.equal (J.list J.int [1,3,4]) (JE.list J.int [1,3,4])
         , test "bool list to json" <|
            \_ ->
                Expect.equal (J.list J.bool [True, False]) (JE.list J.bool [True, False])
         , test "string list to json" <|
            \_ ->
                Expect.equal (J.list J.string ["a","b"]) (JE.list J.string ["a", "b"])
         , test "empty list to json" <|
            \_ ->
                Expect.equal (J.list J.string []) (JE.list J.string [])
        ]


setTests : Test
setTests =
    describe "set to json"
        [ test "int set to json" <|
            \_ ->
                Expect.equal (J.set J.int (Set.singleton 1)) (JE.set J.int (Set.singleton 1))
         , test "string set to json" <|
            \_ ->
                Expect.equal (J.set J.string (Set.singleton "a")) (JE.set J.string (Set.singleton "a"))
         , test "multiple string set to json" <|
            \_ ->
                Expect.equal (J.set J.string (Set.fromList ["a", "b"])) (JE.set J.string (Set.fromList ["a", "b"]))
         , test "empty set to json" <|
            \_ ->
                Expect.equal (J.set J.string Set.empty) (JE.set J.string Set.empty)
        ]


objectTests : Test
objectTests =
    describe "object to json"
        [ test "test object to json" <|
            \_ ->
                Expect.equal (J.object [ ( "name", J.string "Tom" )
                                                   , ( "age", J.int 42 )
                                                   ]) (JE.object [ ( "name", J.string "Tom" )
                                                                                                         , ( "age", J.int 42 )
                                                                                                         ])
         , test "empty object to json" <|
            \_ ->
                Expect.equal (J.object []) (JE.object [])
        ]


dictTests : Test
dictTests =
    let
        people = Dict.fromList [ ( "Tom", 42 ), ( "Sue", 38 ) ]
    in
        describe "dict to json"
            [ test "test dict to json" <|
                \_ ->
                    Expect.equal (J.dict identity J.int people) (JE.dict identity J.int people)
             , test "empty dict to json" <|
                \_ ->
                    Expect.equal (J.dict identity J.int Dict.empty) (JE.dict identity J.int Dict.empty)
            ]


localTimeTests : Test
localTimeTests =
    describe "localtime to json"
        [ test "test localtime to json" <|
            \_ ->
                Expect.equal (J.localTime (millisToPosix 1643374590000)) (JEE.posix (millisToPosix 1643374590000))
        ]



maybeTests : Test
maybeTests =
    describe "maybe to json"
        [ test "Nothing to json" <|
            \_ ->
                Expect.equal (J.maybe J.int Nothing) (JEE.maybe J.int Nothing)
         , test "Just to json" <|
            \_ ->
                Expect.equal (J.maybe J.int (Just 1)) (JEE.maybe J.int (Just 1))
        ]
