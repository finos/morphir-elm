module Morphir.SDK.Json.DecodeTests exposing (..)

import Dict exposing (Dict)
import Expect
import Json.Decode as DE exposing (..)
import Json.Decode.Extra as DEE
import Morphir.SDK.Json.Decode as D
import Morphir.SDK.Json.Encode as E
import Morphir.SDK.LocalTime exposing (LocalTime, fromMilliseconds)
import Set exposing (Set)
import Test exposing (..)
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
        people =
            Dict.fromList [ ( "Tom", 42 ), ( "Sue", 38 ) ]
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
        people =
            Dict.fromList [ ( "Tom", 42 ), ( "Sue", 38 ) ]
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
        json =
            """{ "person": { "name": "tom", "age": 42 } }"""
    in
    describe "at"
        [ test "string field exists" <|
            \_ ->
                Expect.equal (D.decodeString (D.at [ "person", "name" ] D.string) json) (D.decodeString (DE.at [ "person", "name" ] D.string) json)
        , test "int field exists" <|
            \_ ->
                Expect.equal (D.decodeString (D.at [ "person", "age" ] D.int) json) (D.decodeString (DE.at [ "person", "age" ] D.int) json)
        , test "int field isn't string" <|
            \_ ->
                Expect.equal (D.decodeString (D.at [ "person", "age" ] D.string) json) (D.decodeString (DE.at [ "person", "age" ] D.string) json)
        , test "empty json" <|
            \_ ->
                Expect.equal (D.decodeString (D.at [ "person", "age" ] D.int) "{}") (D.decodeString (DE.at [ "person", "age" ] D.int) "{}")
        ]


indexTests : Test
indexTests =
    let
        json =
            """[ "alice", "bob", "chuck" ]"""
    in
    describe "index"
        [ test "at 0" <|
            \_ ->
                Expect.equal (D.decodeString (D.index 0 D.string) json) (D.decodeString (DE.index 0 D.string) json)
        , test "at 1" <|
            \_ ->
                Expect.equal (D.decodeString (D.index 1 D.string) json) (D.decodeString (DE.index 1 D.string) json)
        , test "at 2" <|
            \_ ->
                Expect.equal (D.decodeString (D.index 2 D.string) json) (D.decodeString (DE.index 2 D.string) json)
        , test "at 3" <|
            \_ ->
                Expect.equal (D.decodeString (D.index 3 D.string) json) (D.decodeString (DE.index 3 D.string) json)
        ]


maybeTests : Test
maybeTests =
    let
        json =
            """{ "name": "tom", "age": 42 }"""
    in
    describe "maybe"
        [ test "age int" <|
            \_ ->
                Expect.equal (D.decodeString (D.maybe (D.field "age" D.int)) json) (D.decodeString (DE.maybe (D.field "age" D.int)) json)
        , test "name int" <|
            \_ ->
                Expect.equal (D.decodeString (D.maybe (D.field "name" D.int)) json) (D.decodeString (DE.maybe (D.field "name" D.int)) json)
        , test "height float" <|
            \_ ->
                Expect.equal (D.decodeString (D.maybe (D.field "height" D.float)) json) (D.decodeString (DE.maybe (D.field "height" D.float)) json)
        , test "maybe age" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "age" (D.maybe D.int)) json) (D.decodeString (D.field "age" (DE.maybe D.int)) json)
        , test "maybe name" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "name" (D.maybe D.int)) json) (D.decodeString (D.field "name" (D.maybe D.int)) json)
        , test "maybe height" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "height" (D.maybe D.float)) json) (D.decodeString (D.field "height" (D.maybe D.float)) json)
        ]


oneOfTests : Test
oneOfTests =
    let
        badIntResult =
            D.oneOf [ D.int, D.null 0 ]

        badIntExpected =
            DE.oneOf [ D.int, D.null 0 ]
    in
    describe "oneOf"
        [ test "check int array" <|
            \_ ->
                Expect.equal (D.decodeString (D.list badIntResult) "[1,2,null,4]") (D.decodeString (D.list badIntExpected) "[1,2,null,4]")
        ]


mapTests : Test
mapTests =
    describe "map"
        [ test "map json" <|
            \_ ->
                Expect.equal (D.decodeString (D.map (\x -> "Hello" ++ x) D.string) "\"World\"") (Ok "HelloWorld")
        ]


type alias Point =
    { x : Float, y : Float }


map2Tests : Test
map2Tests =
    let
        result =
            D.map2 Point
                (field "x" float)
                (field "y" float)
    in
    describe "map2"
        [ test "map2 json" <|
            \_ ->
                Expect.equal (D.decodeString result """{ "x": 3, "y": 4 }""") (Ok { x = 3, y = 4 })
        ]


type alias Person3 =
    { name : String, age : Int, height : Float }


map3Tests : Test
map3Tests =
    let
        result =
            D.map3 Person3
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)

        json =
            """{ "name": "tom", "info": { "age": 42, "height": 1.8 } }"""
    in
    describe "map3"
        [ test "map3 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8 })
        ]


type alias Person4 =
    { name : String, age : Int, height : Float, weight : Int }


map4Tests : Test
map4Tests =
    let
        result =
            D.map4 Person4
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)
                (at [ "info", "weight" ] int)

        json =
            """{ "name": "tom", "info": { "age": 42, "height": 1.8 , "weight" : 150} }"""
    in
    describe "map4"
        [ test "map4 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8, weight = 150 })
        ]


type alias Person5 =
    { name : String, age : Int, height : Float, weight : Int, married : Bool }


map5Tests : Test
map5Tests =
    let
        result =
            D.map5 Person5
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)
                (at [ "info", "weight" ] int)
                (at [ "married" ] bool)

        json =
            """{ "name": "tom", "married": true, "info": { "age": 42, "height": 1.8 , "weight" : 150} }"""
    in
    describe "map5"
        [ test "map5 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8, weight = 150, married = True })
        ]


type alias Person6 =
    { name : String, age : Int, height : Float, weight : Int, married : Bool, city : String }


map6Tests : Test
map6Tests =
    let
        result =
            D.map6 Person6
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)
                (at [ "info", "weight" ] int)
                (at [ "married" ] bool)
                (at [ "address", "city" ] string)

        json =
            """{ "name": "tom", "married": true, "info": { "age": 42, "height": 1.8 , "weight" : 160}, "address": { "city": "New York" } }"""
    in
    describe "map6"
        [ test "map6 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8, weight = 160, married = True, city = "New York" })
        ]


type alias Person7 =
    { name : String, age : Int, height : Float, weight : Int, married : Bool, city : String, zipCode : String }


map7Tests : Test
map7Tests =
    let
        result =
            D.map7 Person7
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)
                (at [ "info", "weight" ] int)
                (at [ "married" ] bool)
                (at [ "address", "city" ] string)
                (at [ "address", "zipCode" ] string)

        json =
            """{ "name": "tom", "married": true, "info": { "age": 42, "height": 1.8 , "weight" : 170}, "address": { "city": "New York", "zipCode": "10001" } }"""
    in
    describe "map7"
        [ test "map7 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8, weight = 170, married = True, city = "New York", zipCode = "10001" })
        ]


type alias Person8 =
    { name : String, age : Int, height : Float, weight : Int, married : Bool, city : String, zipCode : String, bankrupted : Bool }


map8Tests : Test
map8Tests =
    let
        result =
            D.map8 Person8
                (at [ "name" ] string)
                (at [ "info", "age" ] int)
                (at [ "info", "height" ] float)
                (at [ "info", "weight" ] int)
                (at [ "married" ] bool)
                (at [ "address", "city" ] string)
                (at [ "address", "zipCode" ] string)
                (at [ "bankrupted" ] bool)

        json =
            """{ "name": "tom", "married": true, "info": { "age": 42, "height": 1.8 , "weight" : 180}, "address": { "city": "New York", "zipCode": "10001" }, "bankrupted": false }"""
    in
    describe "map8"
        [ test "map8 json" <|
            \_ ->
                Expect.equal (D.decodeString result json) (Ok { name = "tom", age = 42, height = 1.8, weight = 180, married = True, city = "New York", zipCode = "10001", bankrupted = False })
        ]


decodeValueTests : Test
decodeValueTests =
    describe "decodeValue"
        [ test "bool json to string" <|
            \_ ->
                Expect.equal (D.decodeValue D.string (E.bool True)) (DE.decodeValue D.string (E.bool True))
        , test "int json to string" <|
            \_ ->
                Expect.equal (D.decodeValue D.string (E.int 42)) (D.decodeValue DE.string (E.int 42))
        , test "float json to string" <|
            \_ ->
                Expect.equal (D.decodeValue D.string (E.float 3.14)) (D.decodeValue DE.string (E.float 3.14))
        , test "string json to string" <|
            \_ ->
                Expect.equal (D.decodeValue D.string (E.string "Hello")) (Ok "Hello")
        , test "object json to string" <|
            \_ ->
                Expect.equal
                    (D.decodeValue D.string
                        (E.object
                            [ ( "name", E.string "Tom" )
                            , ( "age", E.int 42 )
                            ]
                        )
                    )
                    (DE.decodeValue D.string
                        (E.object
                            [ ( "name", E.string "Tom" )
                            , ( "age", E.int 42 )
                            ]
                        )
                    )
        ]


errorToStringTests : Test
errorToStringTests =
    describe "errorToString"
        [ test "Field" <|
            \_ ->
                Expect.equal (D.errorToString (DE.Failure "name" (E.string "32"))) "Problem with the given value:\n\n\"32\"\n\nname"
        ]


succeedTests : Test
succeedTests =
    describe "succeed"
        [ test "bool" <|
            \_ ->
                Expect.equal (D.decodeString (D.succeed 42) "true")(Ok 42)
        , test "array" <|
            \_ ->
                Expect.equal (D.decodeString (D.succeed 42) "[1,2,3]")(Ok 42)
        , test "string" <|
            \_ ->
                Expect.equal (D.decodeString (D.succeed 42) "hello") (D.decodeString (DE.succeed 42) "hello")
        ]


failTests : Test
failTests =
    describe "fail"
        [ test "bool" <|
            \_ ->
                Expect.equal (D.decodeString (D.fail "Bad input") "true")(D.decodeString (DE.fail "Bad input") "true")
        ]

person : Decoder String
person =
    D.at [ "info", "age"] D.int
        |> D.andThen personHelp

personHelp : Int -> Decoder String
personHelp age =
    case age of
        18 ->
            D.at ["name"] D.string

        65 ->
            D.at ["address", "city"] D.string

        _ ->
            D.fail <|
                "Trying to decode person, but age is not supported."


andThenTests : Test
andThenTests =
    let
       json = """{ "name": "tom", "married": true, "info": { "age": 65, "height": 1.8 , "weight" : 170}, "address": { "city": "New York", "zipCode": "10001" } }"""
    in
        describe "andThen"
            [ test "person" <|
                \_ ->
                    Expect.equal (D.decodeString person json) (Ok "New York")
            ]

type alias Comment =
    { message : String
    , responses : Responses
    }

type Responses
    = Responses (List Comment)

comment : Decoder Comment
comment =
    map2 Comment
        (field "message" string)
        (field "responses" (map Responses (list (lazy (\_ -> comment)))))

lazyTests : Test
lazyTests =
    let
       json = """{ "message": "Hello", "responses": [ { "message": "World", "responses": [] } ] }"""
    in
        describe "lazy"
            [ test "person" <|
                \_ ->
                    Expect.equal (D.decodeString comment json) (Ok { message = "Hello", responses = Responses [ { message = "World", responses = Responses [] } ] })
            ]



nullTests : Test
nullTests =
    describe "null"
        [ test "null bool json to False" <|
            \_ ->
                Expect.equal (D.decodeString (D.null False) "null") (Ok False)
        , test "null int json to string" <|
            \_ ->
                Expect.equal (D.decodeString (D.null 42) "null") (Ok 42)
        , test "null int json to int" <|
            \_ ->
                Expect.equal (D.decodeString (D.null 42) "42") (D.decodeString (DE.null 42) "42")
        , test "null int json to false" <|
            \_ ->
                Expect.equal (D.decodeString (D.null 42) "false") (D.decodeString (DE.null 42) "false")
        ]


nothingTests : Test
nothingTests =
    describe "nothing"
        [ test "decode nothing" <|
            \_ ->
                Expect.equal (D.decodeString D.nothing "{}") (Ok ())
        ]



localTimeTests : Test
localTimeTests =
    describe "LocalTime"
        [ test "decode localTime" <|
            \_ ->
                Expect.equal (D.decodeString (D.field "created_at" D.localTime)
                                        "{ \"created_at\": 1574447205.394}") (Ok (fromMilliseconds 1574447205000))
        ]
