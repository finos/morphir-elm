module Morphir.Value.ExhaustivenessTests exposing (..)

import Dict
import Expect
import Morphir.IR.AccessControlled exposing (Access(..))
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.FQName exposing (FQName, fqn)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Name as Name
import Morphir.IR.Type as Type
import Morphir.IR.Value as Value exposing (Pattern(..), Value)
import Morphir.Value.Exhaustiveness as Exhaustiveness
import Test exposing (Test, describe, test)


statusType : FQName
statusType =
    fqn "Pkg" "Types" "Status"


ctor : String -> FQName
ctor name =
    fqn "Pkg" "Types" name


distribution : Distribution
distribution =
    let
        accessControlled value =
            { access = Public, value = value }

        documented value =
            { doc = "", value = value }
    in
    Library [ [ "pkg" ] ]
        Dict.empty
        { modules =
            Dict.fromList
                [ ( [ [ "types" ] ]
                  , accessControlled
                        { types =
                            Dict.fromList
                                [ ( Name.fromString "Status"
                                  , accessControlled
                                        (documented
                                            (Type.CustomTypeDefinition []
                                                (accessControlled
                                                    (Dict.fromList
                                                        [ ( Name.fromString "Active", [] )
                                                        , ( Name.fromString "Civilian", [] )
                                                        , ( Name.fromString "Exempt", [] )
                                                        , ( Name.fromString "Pending", [ ( Name.fromString "reason", Type.Unit () ) ] )
                                                        ]
                                                    )
                                                )
                                            )
                                        )
                                  )
                                ]
                        , values = Dict.empty
                        , doc = Nothing
                        }
                  )
                ]
        }


lookup : Exhaustiveness.ConstructorLookup
lookup =
    Exhaustiveness.constructorLookup distribution


wild : Pattern ()
wild =
    WildcardPattern ()


con : String -> List (Pattern ()) -> Pattern ()
con name args =
    ConstructorPattern () (ctor name) args


bool : Bool -> Pattern ()
bool b =
    LiteralPattern () (BoolLiteral b)


matchOf : List (Pattern ()) -> Value () ()
matchOf patterns =
    Value.PatternMatch ()
        (Value.Variable () [ "subject" ])
        (patterns |> List.map (\pattern -> ( pattern, Value.Unit () )))


missingOf : List (Pattern ()) -> List String
missingOf patterns =
    matchOf patterns
        |> Exhaustiveness.check lookup
        |> List.concatMap .missing


assertExhaustive : List (Pattern ()) -> Expect.Expectation
assertExhaustive patterns =
    missingOf patterns |> Expect.equal []


tests : Test
tests =
    describe "Exhaustiveness"
        [ test "all constructors covered" <|
            \_ ->
                assertExhaustive [ con "Active" [], con "Civilian" [], con "Exempt" [], con "Pending" [ wild ] ]
        , test "wildcard covers the rest" <|
            \_ ->
                assertExhaustive [ con "Active" [], wild ]
        , test "variable pattern covers the rest" <|
            \_ ->
                assertExhaustive [ con "Active" [], AsPattern () wild [ "other" ] ]
        , test "missing constructors are reported" <|
            \_ ->
                missingOf [ con "Active" [], con "Civilian" [] ]
                    |> Expect.equal [ "Exempt", "Pending _" ]
        , test "type of the constructors is reported" <|
            \_ ->
                matchOf [ con "Active" [] ]
                    |> Exhaustiveness.check lookup
                    |> List.map .typeName
                    |> Expect.equal [ Just statusType ]
        , test "nested pattern argument must be covered" <|
            \_ ->
                missingOf
                    [ con "Active" []
                    , con "Civilian" []
                    , con "Exempt" []
                    , con "Pending" [ bool True ]
                    ]
                    |> Expect.equal [ "Pending False" ]
        , test "bool literals" <|
            \_ ->
                missingOf [ bool True ]
                    |> Expect.equal [ "False" ]
        , test "bool literals are exhaustive" <|
            \_ ->
                assertExhaustive [ bool True, bool False ]
        , test "other literals need a wildcard" <|
            \_ ->
                missingOf [ LiteralPattern () (WholeNumberLiteral 1) ]
                    |> Expect.equal [ "_" ]
        , test "other literals with a wildcard" <|
            \_ ->
                assertExhaustive [ LiteralPattern () (WholeNumberLiteral 1), wild ]
        , test "tuples" <|
            \_ ->
                missingOf
                    [ TuplePattern () [ bool True, con "Active" [] ]
                    , TuplePattern () [ wild, con "Civilian" [] ]
                    ]
                    |> Expect.equal [ "( False, Active )", "( False, Exempt )", "( False, Pending _ )", "( True, Exempt )", "( True, Pending _ )" ]
        , test "tuples are exhaustive" <|
            \_ ->
                assertExhaustive
                    [ TuplePattern () [ bool True, wild ]
                    , TuplePattern () [ bool False, wild ]
                    ]
        , test "lists" <|
            \_ ->
                missingOf [ EmptyListPattern (), HeadTailPattern () wild (EmptyListPattern ()) ]
                    |> Expect.equal [ "_ :: (_ :: _)" ]
        , test "lists are exhaustive" <|
            \_ ->
                assertExhaustive [ EmptyListPattern (), HeadTailPattern () wild wild ]
        , test "unknown constructors are not reported" <|
            \_ ->
                assertExhaustive [ ConstructorPattern () (fqn "Other" "Mod" "Thing") [] ]
        , test "nested pattern matches are checked" <|
            \_ ->
                Value.Lambda ()
                    wild
                    (matchOf [ con "Active" [] ])
                    |> Exhaustiveness.check lookup
                    |> List.length
                    |> Expect.equal 1
        ]
