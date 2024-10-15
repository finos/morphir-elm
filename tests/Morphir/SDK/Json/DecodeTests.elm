module Morphir.SDK.Json.DecodeTests exposing (..)

import Json.Decode as DE exposing (..)
import Json.Decode.Extra as DEE
import Morphir.SDK.Json.Decode as D
import Test exposing (..)
import Expect
import Set exposing (Set)
import Dict exposing (Dict)
import Morphir.SDK.LocalTime exposing (LocalTime, fromMilliseconds)
import Time exposing (millisToPosix)

stringTests : Test
stringTests =
    describe "json to string"
        [ test "bool json to string" <|
            \_ ->
                Expect.equal (D.decodeString D.string "true") (D.decodeString DE.string "true")
        , test "int json to string" <|
            \_ ->
                Expect.equal (D.decodeString D.string "42") (D.decodeString DE.string "42")
        , test "float json to string" <|
            \_ ->
                Expect.equal (D.decodeString D.string "3.14") (D.decodeString DE.string "3.14")
        , test "string json to string" <|
            \_ ->
                Expect.equal (D.decodeString D.string "\"hello\"") (D.decodeString DE.string "\"hello\"")
        , test "object json to string" <|
            \_ ->
                Expect.equal (D.decodeString D.string "{ \"hello\": 42 }") (D.decodeString DE.string "{ \"hello\": 42 }")
        ]


boolTests : Test
boolTests =
    describe "json to bool"
        [ test "bool json to bool" <|
            \_ ->
                Expect.equal (D.decodeString D.bool "true") (D.decodeString DE.bool "true")
        , test "int json to bool" <|
            \_ ->
                Expect.equal (D.decodeString D.bool "42") (D.decodeString DE.bool "42")
        , test "float json to bool" <|
            \_ ->
                Expect.equal (D.decodeString D.bool "3.14") (D.decodeString DE.bool "3.14")
        , test "string json to bool" <|
            \_ ->
                Expect.equal (D.decodeString D.bool "\"hello\"") (D.decodeString DE.bool "\"hello\"")
        , test "object json to bool" <|
            \_ ->
                Expect.equal (D.decodeString D.bool "{ \"hello\": 42 }") (D.decodeString DE.bool "{ \"hello\": 42 }")
        ]


intTests : Test
intTests =
    describe "json to int"
        [ test "bool json to int" <|
             \_ ->
                 Expect.equal (D.decodeString D.int "true") (D.decodeString DE.int "true")
         , test "int json to int" <|
             \_ ->
                 Expect.equal (D.decodeString D.int "42") (D.decodeString DE.int "42")
         , test "float json to int" <|
             \_ ->
                 Expect.equal (D.decodeString D.int "3.14") (D.decodeString DE.int "3.14")
         , test "string json to int" <|
             \_ ->
                 Expect.equal (D.decodeString D.int "\"hello\"") (D.decodeString DE.int "\"hello\"")
         , test "object json to int" <|
             \_ ->
                 Expect.equal (D.decodeString D.int "{ \"hello\": 42 }") (D.decodeString DE.int "{ \"hello\": 42 }")
         ]


floatTests : Test
floatTests =
    describe "json to float"
        [ test "bool json to float" <|
         \_ ->
             Expect.equal (D.decodeString D.float "true") (D.decodeString DE.float "true")
         , test "int json to float" <|
             \_ ->
                 Expect.equal (D.decodeString D.float "42") (D.decodeString DE.float "42")
         , test "float json to float" <|
             \_ ->
                 Expect.equal (D.decodeString D.float "3.14") (D.decodeString DE.float "3.14")
         , test "string json to float" <|
             \_ ->
                 Expect.equal (D.decodeString D.float "\"hello\"") (D.decodeString DE.float "\"hello\"")
         , test "object json to float" <|
             \_ ->
                 Expect.equal (D.decodeString D.float "{ \"hello\": 42 }") (D.decodeString DE.float "{ \"hello\": 42 }")
         ]


nullableTests : Test
nullableTests =
    describe "json to nullable"
        [ test "bool json to nullable" <|
            \_ ->
                Expect.equal (D.decodeString (D.nullable D.int) "true") (D.decodeString (DE.nullable D.int) "true")
        , test "int json to nullable" <|
                \_ ->
                    Expect.equal (D.decodeString (D.nullable D.int) "42") (D.decodeString (DE.nullable D.int) "42")
        , test "float json to nullable" <|
                \_ ->
                    Expect.equal (D.decodeString (D.nullable D.int) "3.14") (D.decodeString (DE.nullable D.int) "3.14")
        , test "string json to nullable" <|
                \_ ->
                    Expect.equal (D.decodeString (D.nullable D.int) "\"hello\"") (D.decodeString (DE.nullable D.int) "\"hello\"")
        , test "object json to nullable" <|
                \_ ->
                    Expect.equal (D.decodeString (D.nullable D.int) "{ \"hello\": 42 }") (D.decodeString (DE.nullable D.int) "{ \"hello\": 42 }")
        ]


listTests : Test
listTests =
    describe "json to list"
        [ test "int list json to list" <|
            \_ ->
                Expect.equal (D.decodeString (D.list D.int) "[1,2,3]") (D.decodeString (DE.list D.int) "[1,2,3]")
        , test "bool list json to list" <|
                \_ ->
                    Expect.equal (D.decodeString (D.list D.bool) "[true,false]") (D.decodeString (DE.list D.bool) "[true,false]")
        ]


dictTests : Test
dictTests =
    let
        people = Dict.fromList [ ( "Tom", 42 ), ( "Sue", 38 ) ]
    in
        describe "json to dict"
            [ test "test json to dict" <|
                \_ ->
                    Expect.equal (D.decodeString (D.dict D.int) "{ \"alice\": 42, \"bob\": 99 }") (D.decodeString (DE.dict D.int) "{ \"alice\": 42, \"bob\": 99 }")
             , test "empty json to dict" <|
                \_ ->
                    Expect.equal (D.decodeString (D.dict D.int) "{}") (D.decodeString (DE.dict D.int) "{}")
            ]


keyValuePairsTests : Test
keyValuePairsTests =
    let
        people = Dict.fromList [ ( "Tom", 42 ), ( "Sue", 38 ) ]
    in
        describe "json to keyValuePairs"
            [ test "test json to keyValuePairs" <|
                \_ ->
                    Expect.equal (D.decodeString (D.keyValuePairs D.int) "{ \"alice\": 42, \"bob\": 99 }") (D.decodeString (DE.keyValuePairs D.int) "{ \"alice\": 42, \"bob\": 99 }")
             , test "empty json to keyValuePairs" <|
                \_ ->
                    Expect.equal (D.decodeString (D.keyValuePairs D.int) "{}") (D.decodeString (DE.keyValuePairs D.int) "{}")
            ]


fieldTests : Test
fieldTests =
    describe "field in json"
        [ test "one field json" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "x" int) "{ \"x\": 3 }") (D.decodeString (DE.field "x" int) "{ \"x\": 3 }")
         , test "two field json" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "x" int) "{ \"x\": 3, \"y\": 4 }") (D.decodeString (DE.field "x" int) "{ \"x\": 3, \"y\": 4 }")
         , test "bad field json" <|
            \_ ->
                Expect.equal (D.decodeString (D.keyValuePairs D.int) "{ \"x\": true }") (D.decodeString (DE.keyValuePairs D.int) "{ \"x\": true }")
         , test "empty field json" <|
            \_ ->
                Expect.equal (D.decodeString (D.keyValuePairs D.int) "{}") (D.decodeString (DE.keyValuePairs D.int) "{}")
        ]


atTests : Test
atTests =
    let
        json = """{ "person": { "name": "tom", "age": 42 } }"""
    in
        describe "at"
            [ test "string field exists" <|
                \_ ->
                    Expect.equal (D.decodeString (D.at ["person", "name"] D.string) json ) (D.decodeString (DE.at ["person", "name"] D.string) json )
             , test "int field exists" <|
                \_ ->
                    Expect.equal (D.decodeString (D.at ["person", "age"] D.int) json ) (D.decodeString (DE.at ["person", "age"] D.int) json )
             , test "int field isn't string" <|
                \_ ->
                    Expect.equal (D.decodeString (D.at ["person", "age"] D.string) json ) (D.decodeString (DE.at ["person", "age"] D.string) json )
             , test "empty json" <|
                \_ ->
                    Expect.equal (D.decodeString (D.at ["person", "age"] D.int) "{}" ) (D.decodeString (DE.at ["person", "age"] D.int) "{}" )
            ]


--localTimeTests : Test
--localTimeTests =
--    describe "json to localtime"
--        [ test "test json to localtime" <|
--            \_ ->
--                Expect.equal (D.localTime (millisToPosix 1643374590000)) (DEE.posix (millisToPosix 1643374590000))
--        ]
--
--
--
--maybeTests : Test
--maybeTests =
--    describe "json to maybe"
--        [ test "json to Nothing" <|
--            \_ ->
--                Expect.equal (D.maybe D.int Nothing) (DEE.maybe D.int Nothing)
--         , test "json to Just" <|
--            \_ ->
--                Expect.equal (D.maybe D.int (Just 1)) (DEE.maybe D.int (Just 1))
--        ]