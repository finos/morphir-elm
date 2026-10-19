module Morphir.Lean.BackendTests exposing (..)

import Dict
import Expect
import Morphir.IR.AccessControlled exposing (private, public)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Literal as Literal
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.SDK as SDK
import Morphir.IR.SDK.Basics as SDKBasics
import Morphir.IR.SDK.List as SDKList
import Morphir.IR.SDK.Maybe as SDKMaybe
import Morphir.IR.SDK.String as SDKString
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (TypedValue)
import Morphir.Lean.AST as Lean
import Morphir.Lean.Backend as Backend
import Morphir.Lean.PrettyPrinter as PrettyPrinter
import Test exposing (Test, describe, test)


packageName : Path.Path
packageName =
    Path.fromString "My.Package"


moduleName : Path.Path
moduleName =
    Path.fromString "Pricing"


fqn : String -> FQName
fqn localName =
    FQName.fQName packageName moduleName (Name.fromString localName)


intType : Type ()
intType =
    SDKBasics.intType ()


boolType : Type ()
boolType =
    SDKBasics.boolType ()


tierType : Type ()
tierType =
    Type.Reference () (fqn "Tier") []


lineItemType : Type ()
lineItemType =
    Type.Reference () (fqn "LineItem") []


sdkRef : String -> String -> Type () -> TypedValue
sdkRef moduleNameString localName tpe =
    Value.Reference tpe (FQName.fQName SDK.packageName (Path.fromString moduleNameString) (Name.fromString localName))


binary : String -> TypedValue -> TypedValue -> Type () -> TypedValue
binary localName left right resultType =
    Value.Apply resultType
        (Value.Apply (Type.Function () (Value.valueAttribute right) resultType)
            (sdkRef "Basics" localName (Type.Function () (Value.valueAttribute left) (Type.Function () (Value.valueAttribute right) resultType)))
            left
        )
        right


int : Int -> TypedValue
int n =
    Value.Literal intType (Literal.WholeNumberLiteral n)


var : String -> Type () -> TypedValue
var name tpe =
    Value.Variable tpe (Name.fromString name)


doc : a -> Documented a
doc =
    Documented ""


testModule : Module.Definition () (Type ())
testModule =
    { types =
        Dict.fromList
            [ ( Name.fromString "Tier"
              , public
                    (doc
                        (Type.CustomTypeDefinition []
                            (public
                                (Dict.fromList
                                    [ ( Name.fromString "Standard", [] )
                                    , ( Name.fromString "Gold", [] )
                                    ]
                                )
                            )
                        )
                    )
              )
            , ( Name.fromString "LineItem"
              , public
                    (doc
                        (Type.TypeAliasDefinition []
                            (Type.Record ()
                                [ Type.Field (Name.fromString "quantity") intType
                                , Type.Field (Name.fromString "tier") tierType
                                ]
                            )
                        )
                    )
              )
            ]
    , values =
        Dict.fromList
            [ ( Name.fromString "discount"
              , public
                    (doc
                        { inputTypes = [ ( Name.fromString "tier", tierType, tierType ) ]
                        , outputType = intType
                        , body =
                            Value.PatternMatch intType
                                (var "tier" tierType)
                                [ ( Value.ConstructorPattern tierType (fqn "Gold") [], int 10 )
                                , ( Value.WildcardPattern tierType, int 0 )
                                ]
                        }
                    )
              )

            -- references `discount`, which comes later alphabetically, so it must be reordered
            , ( Name.fromString "aDiscountedPrice"
              , private
                    (doc
                        { inputTypes = [ ( Name.fromString "item", lineItemType, lineItemType ) ]
                        , outputType = intType
                        , body =
                            binary "subtract"
                                (Value.Field intType (var "item" lineItemType) (Name.fromString "quantity"))
                                (Value.Apply intType
                                    (Value.Reference (Type.Function () tierType intType) (fqn "discount"))
                                    (Value.Field tierType (var "item" lineItemType) (Name.fromString "tier"))
                                )
                                intType
                        }
                    )
              )
            ]
    , doc = Just "Pricing rules."
    }


distribution : Distribution
distribution =
    Library packageName
        (Dict.singleton SDK.packageName SDK.packageSpec)
        { modules = Dict.singleton moduleName (public testModule) }


ctx : Backend.Context
ctx =
    Backend.contextFor distribution moduleName


printValue : TypedValue -> Result String String
printValue value =
    Backend.mapValue ctx value |> Result.map (PrettyPrinter.printTerm 0)


printType : Type () -> Result String String
printType tpe =
    Backend.mapType ctx tpe |> Result.map PrettyPrinter.printType


typeTests : Test
typeTests =
    describe "mapType"
        [ test "SDK primitives map to Lean core types" <|
            \_ ->
                printType (Type.Function () intType (SDKMaybe.maybeType () (SDKList.listType () (SDKString.stringType ()))))
                    |> Expect.equal (Ok "Int → Option (List String)")
        , test "tuples map to products" <|
            \_ ->
                printType (Type.Tuple () [ intType, boolType ])
                    |> Expect.equal (Ok "Int × Bool")
        , test "type variables become Greek letters" <|
            \_ ->
                printType (Type.Function () (Type.Variable () [ "a" ]) (Type.Variable () [ "comparable" ]))
                    |> Expect.equal (Ok "α → τComparable")
        , test "anonymous records are resolved to a matching alias" <|
            \_ ->
                printType
                    (Type.Record ()
                        [ Type.Field (Name.fromString "tier") tierType
                        , Type.Field (Name.fromString "quantity") intType
                        ]
                    )
                    |> Expect.equal (Ok "LineItem")
        , test "extensible records are rejected" <|
            \_ ->
                Backend.mapType ctx (Type.ExtensibleRecord () [ "r" ] [ Type.Field [ "a" ] intType ])
                    |> Expect.err
        ]


valueTests : Test
valueTests =
    describe "mapValue"
        [ test "arithmetic is printed infix" <|
            \_ ->
                printValue (binary "add" (var "a" intType) (binary "multiply" (var "b" intType) (int 2) intType) intType)
                    |> Expect.equal (Ok "a + (b * 2)")
        , test "comparison of literals gets a type ascription" <|
            \_ ->
                printValue (binary "lessThan" (int 1) (int 2) boolType)
                    |> Expect.equal (Ok "(1 : Int) < 2")
        , test "Maybe constructors map to Option" <|
            \_ ->
                printValue
                    (Value.Apply (SDKMaybe.maybeType () intType)
                        (Value.Constructor (Type.Function () intType (SDKMaybe.maybeType () intType)) (FQName.fQName SDK.packageName [ [ "maybe" ] ] [ "just" ]))
                        (int 1)
                    )
                    |> Expect.equal (Ok "(some 1 : Option Int)")
        , test "if-then-else" <|
            \_ ->
                printValue (Value.IfThenElse intType (Value.Literal boolType (Literal.BoolLiteral True)) (int 1) (int 2))
                    |> Expect.equal (Ok "if true then\n  1\nelse\n  2")
        , test "let bindings are terminated with a semicolon" <|
            \_ ->
                printValue
                    (Value.LetDefinition intType
                        [ "x" ]
                        { inputTypes = [], outputType = intType, body = int 1 }
                        (var "x" intType)
                    )
                    |> Expect.equal (Ok "let x : Int := 1;\nx")
        , test "record update" <|
            \_ ->
                printValue
                    (Value.UpdateRecord lineItemType (var "item" lineItemType) (Dict.singleton [ "quantity" ] (int 3)))
                    |> Expect.equal (Ok "{ item with quantity := 3 }")
        , test "string literals are escaped" <|
            \_ ->
                printValue (Value.Literal (SDKString.stringType ()) (Literal.StringLiteral "say \"hi\"\n"))
                    |> Expect.equal (Ok "\"say \\\"hi\\\"\\n\"")
        , test "reserved words are escaped" <|
            \_ ->
                printValue (var "end" intType)
                    |> Expect.equal (Ok "«end»")
        ]


moduleTests : Test
moduleTests =
    let
        printed : String
        printed =
            Backend.mapModuleDefinition distribution moduleName testModule
                |> PrettyPrinter.printCompilationUnit
    in
    describe "mapModuleDefinition"
        [ test "full module" <|
            \_ ->
                printed
                    |> Expect.equal
                        (String.join "\n"
                            [ "import Morphir.SDK"
                            , ""
                            , "/-!"
                            , "Pricing rules."
                            , "-/"
                            , ""
                            , "-- Elm code often binds variables it does not use (e.g. in patterns), which is fine in generated code."
                            , "set_option linter.unusedVariables false"
                            , ""
                            , "namespace My.Package.Pricing"
                            , ""
                            , "inductive Tier where"
                            , "  | gold"
                            , "  | standard"
                            , "  deriving Repr, BEq, DecidableEq"
                            , ""
                            , "structure LineItem where"
                            , "  quantity : Int"
                            , "  tier : Tier"
                            , "  deriving Repr, BEq, DecidableEq"
                            , ""
                            , "def discount (tier : Tier) : Int :="
                            , "  match tier with"
                            , "  | Tier.gold => 10"
                            , "  | _ => 0"
                            , ""
                            , "def aDiscountedPrice (item : LineItem) : Int :="
                            , "  item.quantity - (discount item.tier)"
                            , ""
                            , "end My.Package.Pricing"
                            , ""
                            ]
                        )
        , test "distribution contains the Lake project files" <|
            \_ ->
                Backend.mapDistribution {} distribution
                    |> Result.map Dict.keys
                    |> Expect.equal
                        (Ok
                            [ ( [], "MyPackage.lean" )
                            , ( [], "lakefile.toml" )
                            , ( [], "lean-toolchain" )
                            , ( [ "My", "Package" ], "Pricing.lean" )
                            ]
                        )
        ]


mutualRecursionTest : Test
mutualRecursionTest =
    let
        isEvenOdd : String -> String -> Documented (Value.Definition () (Type ()))
        isEvenOdd other base =
            doc
                { inputTypes = [ ( [ "n" ], intType, intType ) ]
                , outputType = boolType
                , body =
                    Value.IfThenElse boolType
                        (binary "equal" (var "n" intType) (int 0) boolType)
                        (Value.Literal boolType (Literal.BoolLiteral (base == "even")))
                        (Value.Apply boolType
                            (Value.Reference (Type.Function () intType boolType) (fqn other))
                            (binary "subtract" (var "n" intType) (int 1) intType)
                        )
                }

        moduleDef : Module.Definition () (Type ())
        moduleDef =
            { types = Dict.empty
            , values =
                Dict.fromList
                    [ ( [ "is", "even" ], public (isEvenOdd "isOdd" "even") )
                    , ( [ "is", "odd" ], public (isEvenOdd "isEven" "odd") )
                    ]
            , doc = Nothing
            }
    in
    test "mutually recursive values are wrapped in a mutual block" <|
        \_ ->
            Backend.mapModuleDefinition distribution moduleName moduleDef
                |> .decls
                |> List.map
                    (\decl ->
                        case decl of
                            Lean.MutualBlock decls ->
                                List.length decls

                            _ ->
                                1
                    )
                |> Expect.equal [ 2 ]


testSuiteTest : Test
testSuiteTest =
    let
        testSuite =
            Dict.singleton (fqn "discount")
                [ { inputs = [ Just (Value.Constructor () (fqn "Gold")) ]
                  , expectedOutput = Value.Literal () (Literal.WholeNumberLiteral 10)
                  , description = "gold customers"
                  }
                , { inputs = [ Nothing ]
                  , expectedOutput = Value.Literal () (Literal.WholeNumberLiteral 0)
                  , description = ""
                  }
                ]
    in
    test "test cases become #guard checks in a separate library" <|
        \_ ->
            Backend.mapDistributionWithTests {} testSuite distribution
                |> Result.map
                    (\fileMap ->
                        ( fileMap
                            |> Dict.get ( [ "Tests", "My", "Package" ], "Pricing.lean" )
                            |> Maybe.map
                                (\content ->
                                    ( String.contains "-- discount #1: gold customers\n#guard (discount Tier.gold) == 10" content
                                    , String.contains "the test case leaves some inputs unset" content
                                    )
                                )
                        , fileMap
                            |> Dict.get ( [], "lakefile.toml" )
                            |> Maybe.map (String.contains "roots = [\"Tests.My.Package.Pricing\"]")
                        )
                    )
                |> Expect.equal (Ok ( Just ( True, True ), Just True ))
