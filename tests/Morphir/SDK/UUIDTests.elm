module Morphir.SDK.UUIDTests exposing (..)

import UUID exposing (UUID)
import Morphir.SDK.UUID as U
import Test exposing (..)
import Expect

namespaceTests : Test
namespaceTests = 
    describe "namespace tests"
        [test "dns namespace test" <|
            \_ ->
                Expect.equal (U.dnsNamespace |> U.toString) (UUID.dnsNamespace |> UUID.toString)
        , test "url namespace test" <| 
            \_ ->
                Expect.equal (U.urlNamespace |> U.toString) (UUID.urlNamespace |> UUID.toString)
        , test "oid namespace test" <| 
            \_ ->
                Expect.equal (U.oidNamespace |> U.toString) (UUID.oidNamespace |> UUID.toString)
        , test "x500 namespace test" <| 
            \_ ->
                Expect.equal (U.x500Namespace |> U.toString) (UUID.x500Namespace |> UUID.toString)
        ]


toStringTests : Test
toStringTests =
    describe "empty uuid tests"
        [ test "empty string to string" <|
            \_ ->
                Expect.equal (U.nilString) (UUID.nilString)
        , test "test is nil string" <|
            \_ ->
                Expect.equal (U.nilString |> U.isNilString) (UUID.nilString |> UUID.isNilString)
        ]

fromStringTests : Test
fromStringTests =
    describe "fromString tests"
        [ test "from string basic uuid" <|
            \_ ->
                Expect.equal (U.fromString "6ba7b810-9dad-11d1-80b4-00c04fd430c8") (Ok UUID.dnsNamespace)
        , test "from string invalid uuid" <|
            \_ ->
                Expect.equal(U.fromString "c72c207b-0847-386d-bdbc-2e5def81cg81") (Err UUID.WrongFormat)
        , test "fromString incorrect length" <|
            \_ ->
                Expect.equal(U.fromString "6ba7b811-9dad-11d1-80b4-00c04fd430d80") (Err UUID.WrongLength)
        , test "fromName uuid version mapping" <|
            \_ ->
                Expect.equal(U.fromString "c72c207b-0847-386d-bdbc-2e5def81cf81" |> Result.map U.version) (Ok 3)
        ]

forNameTests : Test
forNameTests =
    describe "forName tests"
        [ test "forName dnsNamespace test" <|
            \_ ->
                Expect.equal(U.forName "foo" U.dnsNamespace) (UUID.forName "foo" UUID.dnsNamespace)
        , test "forName urlNamespace test" <|
            \_ ->
                Expect.equal (U.forName "foo" U.urlNamespace) (UUID.forName "foo" UUID.urlNamespace)
        , test "forName oidNamespace test" <|
            \_ ->
                Expect.equal (U.forName "foo" U.oidNamespace) (UUID.forName "foo" UUID.oidNamespace)
        , test "forName x500Namespace test" <|
            \_ ->
                Expect.equal (U.forName "foo" U.x500Namespace) (UUID.forName "foo" UUID.x500Namespace)
        ]


-- running integration tests, this validates that the morphir compiler will work w/ the new module main other piece
-- tests-integration | these are more one off integration tests.  We can maybe do something similar
-- tests-integration -> src -> Issues -> Add issue # here, and then combine w/ a basic test scenario
-- This is also a good place to make a full indepth test of the UUID module