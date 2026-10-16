module Morphir.Lean.Backend exposing
    ( Options, Errors, mapDistribution, mapDistributionWithTests
    , mapModuleDefinition, mapTypeDefinition, mapValueDefinition, mapType, mapValue, mapPattern
    , Context, contextFor, leanToolchain
    )

{-| Backend that turns Morphir IR into Lean 4 code.

The goal of this backend is to make business logic captured in Morphir available to the Lean theorem prover so that
properties of the logic can be stated and proven. Every Morphir module becomes a Lean module, Morphir types become
inductive types, structures or abbreviations and Morphir values become (total) Lean definitions.

The generated code depends on a small Lean library that implements the Morphir SDK (`Morphir/SDK.lean`). That library
is shipped as a redistributable and copied next to the generated code by the CLI.

@docs Options, Errors, mapDistribution, mapDistributionWithTests
@docs mapModuleDefinition, mapTypeDefinition, mapValueDefinition, mapType, mapValue, mapPattern
@docs Context, contextFor, leanToolchain

-}

import Dict exposing (Dict)
import Morphir.Correctness.Test exposing (TestCase, TestSuite)
import Morphir.File.FileMap exposing (FileMap)
import Morphir.IR.AccessControlled exposing (AccessControlled)
import Morphir.IR.Distribution as Distribution exposing (Distribution(..))
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Literal as Literal
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (Pattern, RawValue, TypedValue, Value)
import Morphir.Lean.AST as Lean
import Morphir.Lean.PrettyPrinter as PrettyPrinter
import Morphir.SDK.Decimal as Decimal
import Morphir.Type.Infer as Infer
import Set exposing (Set)


{-| Options for the Lean backend. There are none at the moment.
-}
type alias Options =
    {}


{-| Errors that prevent the backend from producing any output.
-}
type alias Errors =
    List String


{-| The Lean toolchain the generated code and the SDK library are tested against.
-}
leanToolchain : String
leanToolchain =
    "leanprover/lean4:v4.35.0"


{-| Information needed while mapping a single module.
-}
type alias Context =
    { distribution : Distribution
    , packageName : PackageName
    , moduleName : ModuleName
    , recordAliases : List ( FQName, List (Type.Field ()) )
    , typeVarsInScope : Set Name
    }


{-| Create a mapping context for a module in the distribution.
-}
contextFor : Distribution -> ModuleName -> Context
contextFor distribution moduleName =
    let
        packageName : PackageName
        packageName =
            Distribution.lookupPackageName distribution
    in
    { distribution = distribution
    , packageName = packageName
    , moduleName = moduleName
    , recordAliases = collectRecordAliases distribution
    , typeVarsInScope = Set.empty
    }


{-| Collect all record type aliases that do not take type parameters. Morphir type inference sometimes produces
anonymous record types where the source used an alias. Since Lean has no structural record types we map them back to
the alias by matching the fields.
-}
collectRecordAliases : Distribution -> List ( FQName, List (Type.Field ()) )
collectRecordAliases distribution =
    distribution
        |> Distribution.typeSpecifications
        |> Dict.toList
        |> List.filterMap
            (\( fqn, spec ) ->
                case spec of
                    Type.TypeAliasSpecification [] (Type.Record _ fields) ->
                        Just ( fqn, fields )

                    _ ->
                        Nothing
            )



-- DISTRIBUTION


{-| Map a whole distribution to a set of Lean files: one per module plus a root module that imports all the others
and the Lake project files.
-}
mapDistribution : Options -> Distribution -> Result Errors FileMap
mapDistribution opt distribution =
    mapDistributionWithTests opt Dict.empty distribution


{-| Same as `mapDistribution` but also turns the test cases in the test suite (`morphir-tests.json`) into Lean
`#guard` checks. The checks live in a separate library (`<Root>Tests`) so that a failing test does not prevent the
model itself from being used in proofs, but they are part of the default build targets.
-}
mapDistributionWithTests : Options -> TestSuite -> Distribution -> Result Errors FileMap
mapDistributionWithTests _ testSuite distribution =
    case distribution of
        Library packageName _ packageDef ->
            let
                moduleUnits : List Lean.CompilationUnit
                moduleUnits =
                    packageDef.modules
                        |> Dict.toList
                        |> List.map
                            (\( moduleName, accessControlledModuleDef ) ->
                                mapModuleDefinition distribution moduleName accessControlledModuleDef.value
                            )

                testUnits : List Lean.CompilationUnit
                testUnits =
                    mapTestSuite distribution testSuite

                rootModuleName : String
                rootModuleName =
                    packageNamespace packageName |> String.join ""

                testsLibName : String
                testsLibName =
                    rootModuleName ++ "Tests"

                rootModule : String
                rootModule =
                    String.concat
                        [ "-- Root of the Lean library generated from the Morphir package "
                        , Path.toString Name.toTitleCase "." packageName
                        , ".\n"
                        , "import Morphir.SDK\n"
                        , moduleUnits
                            |> List.map (\cu -> "import " ++ leanModuleName cu ++ "\n")
                            |> String.concat
                        ]

                quotedList : List String -> String
                quotedList items =
                    "[" ++ (items |> List.map (\m -> "\"" ++ m ++ "\"") |> String.join ", ") ++ "]"

                lakefile : String
                lakefile =
                    String.concat
                        [ "name = \""
                        , Path.toString Name.toSnakeCase "-" packageName |> String.replace "_" "-"
                        , "\"\n"
                        , "defaultTargets = "
                        , quotedList
                            (if List.isEmpty testUnits then
                                [ rootModuleName ]

                             else
                                [ rootModuleName, testsLibName ]
                            )
                        , "\n\n"
                        , "[[lean_lib]]\n"
                        , "name = \""
                        , rootModuleName
                        , "\"\n"
                        , "roots = "
                        , quotedList ("Morphir.SDK" :: rootModuleName :: List.map leanModuleName moduleUnits)
                        , "\n"
                        , if List.isEmpty testUnits then
                            ""

                          else
                            String.concat
                                [ "\n# Test cases from morphir-tests.json, checked with #guard.\n"
                                , "[[lean_lib]]\n"
                                , "name = \""
                                , testsLibName
                                , "\"\n"
                                , "roots = "
                                , quotedList (List.map leanModuleName testUnits)
                                , "\n"
                                ]
                        ]
            in
            (moduleUnits ++ testUnits)
                |> List.map (\cu -> ( ( cu.filePath, cu.fileName ), PrettyPrinter.printCompilationUnit cu ))
                |> List.append
                    [ ( ( [], rootModuleName ++ ".lean" ), rootModule )
                    , ( ( [], "lakefile.toml" ), lakefile )
                    , ( ( [], "lean-toolchain" ), leanToolchain ++ "\n" )
                    ]
                |> Dict.fromList
                |> Ok



-- TEST CASES


{-| Turn the test suite into one Lean module per Morphir module that has test cases. The test module for
`Pkg.Mod` is `Tests.Pkg.Mod`. It uses the same namespace as the module under test so references resolve the same way.
-}
mapTestSuite : Distribution -> TestSuite -> List Lean.CompilationUnit
mapTestSuite distribution testSuite =
    let
        packageName : PackageName
        packageName =
            Distribution.lookupPackageName distribution
    in
    testSuite
        |> Dict.toList
        |> List.filter (\( ( pkg, _, _ ), _ ) -> pkg == packageName)
        |> List.foldl
            (\( ( _, moduleName, _ ) as fqn, testCases ) byModule ->
                Dict.update moduleName
                    (\existing -> Just (Maybe.withDefault [] existing ++ [ ( fqn, testCases ) ]))
                    byModule
            )
            Dict.empty
        |> Dict.toList
        |> List.map
            (\( moduleName, functionTests ) ->
                let
                    ctx : Context
                    ctx =
                        contextFor distribution moduleName

                    namespace : List String
                    namespace =
                        moduleNamespace packageName moduleName
                in
                { filePath = "Tests" :: (namespace |> List.reverse |> List.drop 1 |> List.reverse)
                , fileName = (namespace |> List.reverse |> List.head |> Maybe.withDefault "Main") ++ ".lean"
                , doc = Just "Test cases from morphir-tests.json. Each `#guard` evaluates the generated Lean code and compares the result to the output expected by the Morphir test case."
                , imports = [ [ "Morphir", "SDK" ], namespace ]
                , namespace = namespace
                , decls =
                    functionTests
                        |> List.concatMap
                            (\( fqn, testCases ) ->
                                testCases
                                    |> List.indexedMap (mapTestCase ctx fqn)
                                    |> List.concat
                            )
                }
            )


{-| A single test case becomes a comment describing it followed by `#guard f input1 input2 == expectedOutput`.
Test cases that cannot be translated are kept as comments so that the gap is visible.
-}
mapTestCase : Context -> FQName -> Int -> TestCase -> List Lean.Decl
mapTestCase ctx (( _, _, localName ) as fqn) index testCase =
    let
        label : String
        label =
            String.concat
                [ toValueName localName
                , " #"
                , String.fromInt (index + 1)
                , if String.isEmpty (String.trim testCase.description) then
                    ""

                  else
                    ": " ++ String.trim testCase.description
                ]

        subject : Lean.Term
        subject =
            Lean.Ref (qualifiedName ctx toValueName fqn)

        guardResult : Result String Lean.Term
        guardResult =
            Distribution.lookupValueSpecification fqn ctx.distribution
                |> Result.fromMaybe "the function under test is not in the IR"
                |> Result.andThen
                    (\valueSpec ->
                        if containsFunction valueSpec.output then
                            Err "functions cannot be compared"

                        else if List.length testCase.inputs /= List.length valueSpec.inputs then
                            Err "the number of inputs does not match the function signature"

                        else
                            Result.map2
                                (\inputs expected ->
                                    if List.isEmpty inputs then
                                        Lean.BinOp subject "==" expected

                                    else
                                        Lean.BinOp (Lean.App subject inputs) "==" expected
                                )
                                (List.map2
                                    (\( _, inputType ) maybeInput ->
                                        maybeInput
                                            |> Result.fromMaybe "the test case leaves some inputs unset"
                                            |> Result.andThen (mapTestValue ctx inputType)
                                    )
                                    valueSpec.inputs
                                    testCase.inputs
                                    |> combine
                                )
                                (mapTestValue ctx valueSpec.output testCase.expectedOutput)
                    )
    in
    case guardResult of
        Ok guard ->
            [ Lean.Guard label guard ]

        Err error ->
            [ Lean.Comment (label ++ "\nMorphir: the test case could not be translated to Lean: " ++ error) ]


{-| Test values are stored untyped, so they go through type inference before they can be mapped. When the expected
type is polymorphic the value is inferred on its own since rigid type variables would not unify with concrete values.
-}
mapTestValue : Context -> Type () -> RawValue -> Result String Lean.Term
mapTestValue ctx expectedType rawValue =
    (if Set.isEmpty (Type.collectVariables expectedType) then
        Infer.inferValueDefinition ctx.distribution { inputTypes = [], outputType = expectedType, body = rawValue }
            |> Result.map .body

     else
        Infer.inferValue ctx.distribution rawValue
    )
        |> Result.map (Value.mapValueAttributes identity Tuple.second)
        |> Result.mapError Infer.typeErrorToMessage
        |> Result.andThen (mapValue ctx)


containsFunction : Type () -> Bool
containsFunction tpe =
    case tpe of
        Type.Function _ _ _ ->
            True

        Type.Reference _ _ args ->
            List.any containsFunction args

        Type.Tuple _ elems ->
            List.any containsFunction elems

        Type.Record _ fields ->
            List.any (.tpe >> containsFunction) fields

        Type.ExtensibleRecord _ _ fields ->
            List.any (.tpe >> containsFunction) fields

        _ ->
            False



-- MODULES


{-| The Lean module name of a compilation unit, as used in `import` statements.
-}
leanModuleName : Lean.CompilationUnit -> String
leanModuleName cu =
    String.join "." (cu.filePath ++ [ String.dropRight (String.length ".lean") cu.fileName ])


{-| Map a module definition to a Lean compilation unit.
-}
mapModuleDefinition : Distribution -> ModuleName -> Module.Definition () (Type ()) -> Lean.CompilationUnit
mapModuleDefinition distribution moduleName moduleDef =
    let
        ctx : Context
        ctx =
            contextFor distribution moduleName

        namespace : List String
        namespace =
            moduleNamespace ctx.packageName moduleName

        typeDecls : List Lean.Decl
        typeDecls =
            moduleDef.types
                |> Dict.toList
                |> List.map (\( name, acDoc ) -> ( name, acDoc.value ))
                |> orderDefinitions
                    (\( _, documented ) ->
                        Type.collectReferencesFromDefintion documented.value
                            |> localNames ctx
                    )
                |> List.map
                    (\group ->
                        case group of
                            [ ( typeName, documented ) ] ->
                                mapTypeDefinition ctx (isSelfReferencing ctx typeName documented.value) typeName documented

                            _ ->
                                Lean.MutualBlock
                                    (group
                                        |> List.map
                                            (\( typeName, documented ) ->
                                                mapTypeDefinition ctx True typeName documented
                                            )
                                    )
                    )

        valueDecls : List Lean.Decl
        valueDecls =
            moduleDef.values
                |> Dict.toList
                |> List.map (\( name, acDoc ) -> ( name, acDoc.value ))
                |> orderDefinitions
                    (\( _, documented ) ->
                        collectValueReferences documented.value.body
                            |> localNames ctx
                    )
                |> List.map
                    (\group ->
                        case group of
                            [ ( localValueName, documented ) ] ->
                                mapValueDefinition ctx localValueName documented

                            _ ->
                                Lean.MutualBlock
                                    (group
                                        |> List.map
                                            (\( localValueName, documented ) ->
                                                mapValueDefinition ctx localValueName documented
                                            )
                                    )
                    )

        decls : List Lean.Decl
        decls =
            typeDecls ++ valueDecls

        imports : List Lean.QualifiedName
        imports =
            [ "Morphir", "SDK" ]
                :: (decls
                        |> List.concatMap collectDeclNames
                        |> List.filterMap (moduleOfName ctx)
                        |> Set.fromList
                        |> Set.remove moduleName
                        |> Set.toList
                        |> List.map (moduleNamespace ctx.packageName)
                   )
    in
    { filePath = namespace |> List.reverse |> List.drop 1 |> List.reverse
    , fileName = (namespace |> List.reverse |> List.head |> Maybe.withDefault "Main") ++ ".lean"
    , doc = moduleDef.doc
    , imports = imports
    , namespace = namespace
    , decls = decls
    }


{-| Turn a set of fully-qualified names into the local names defined in the current module.
-}
localNames : Context -> Set FQName -> Set Name
localNames ctx fqns =
    fqns
        |> Set.toList
        |> List.filterMap
            (\( packageName, moduleName, localName ) ->
                if packageName == ctx.packageName && moduleName == ctx.moduleName then
                    Just localName

                else
                    Nothing
            )
        |> Set.fromList


isSelfReferencing : Context -> Name -> Type.Definition () -> Bool
isSelfReferencing ctx typeName typeDef =
    Type.collectReferencesFromDefintion typeDef
        |> localNames ctx
        |> Set.member typeName


{-| Order definitions so that every definition comes after the ones it depends on. Mutually recursive definitions are
grouped together. This is needed because Lean, unlike Elm, requires definitions to be declared before they are used.
-}
orderDefinitions : (( Name, a ) -> Set Name) -> List ( Name, a ) -> List (List ( Name, a ))
orderDefinitions getDependencies definitions =
    let
        defsByName : Dict Name a
        defsByName =
            Dict.fromList definitions

        successors : Name -> List Name
        successors name =
            defsByName
                |> Dict.get name
                |> Maybe.map (\def -> getDependencies ( name, def ) |> Set.toList |> List.filter (\n -> Dict.member n defsByName))
                |> Maybe.withDefault []
    in
    stronglyConnectedComponents successors (definitions |> List.map Tuple.first)
        |> List.map
            (\component ->
                component
                    |> List.filterMap (\name -> defsByName |> Dict.get name |> Maybe.map (Tuple.pair name))
            )


type alias TarjanState comparable =
    { index : Int
    , indices : Dict comparable Int
    , lowLinks : Dict comparable Int
    , stack : List comparable
    , onStack : Set comparable
    , components : List (List comparable)
    }


{-| Tarjan's algorithm. Components are returned in dependency order: a component only depends on components that
precede it.
-}
stronglyConnectedComponents : (comparable -> List comparable) -> List comparable -> List (List comparable)
stronglyConnectedComponents successors nodes =
    let
        strongConnect : comparable -> TarjanState comparable -> TarjanState comparable
        strongConnect node state =
            let
                initState : TarjanState comparable
                initState =
                    { state
                        | index = state.index + 1
                        , indices = Dict.insert node state.index state.indices
                        , lowLinks = Dict.insert node state.index state.lowLinks
                        , stack = node :: state.stack
                        , onStack = Set.insert node state.onStack
                    }

                lowLink : comparable -> TarjanState comparable -> Int
                lowLink n s =
                    Dict.get n s.lowLinks |> Maybe.withDefault 0

                afterSuccessors : TarjanState comparable
                afterSuccessors =
                    successors node
                        |> List.foldl
                            (\succ s ->
                                if not (Dict.member succ s.indices) then
                                    let
                                        s2 : TarjanState comparable
                                        s2 =
                                            strongConnect succ s
                                    in
                                    { s2 | lowLinks = Dict.insert node (min (lowLink node s2) (lowLink succ s2)) s2.lowLinks }

                                else if Set.member succ s.onStack then
                                    { s | lowLinks = Dict.insert node (min (lowLink node s) (Dict.get succ s.indices |> Maybe.withDefault 0)) s.lowLinks }

                                else
                                    s
                            )
                            initState
            in
            if lowLink node afterSuccessors == (Dict.get node afterSuccessors.indices |> Maybe.withDefault -1) then
                let
                    popUntil : List comparable -> List comparable -> ( List comparable, List comparable )
                    popUntil stack acc =
                        case stack of
                            top :: rest ->
                                if top == node then
                                    ( top :: acc, rest )

                                else
                                    popUntil rest (top :: acc)

                            [] ->
                                ( acc, [] )

                    ( component, remainingStack ) =
                        popUntil afterSuccessors.stack []
                in
                { afterSuccessors
                    | stack = remainingStack
                    , onStack = List.foldl Set.remove afterSuccessors.onStack component
                    , components = afterSuccessors.components ++ [ component ]
                }

            else
                afterSuccessors
    in
    nodes
        |> List.foldl
            (\node state ->
                if Dict.member node state.indices then
                    state

                else
                    strongConnect node state
            )
            { index = 0, indices = Dict.empty, lowLinks = Dict.empty, stack = [], onStack = Set.empty, components = [] }
        |> .components



-- NAMES


packageNamespace : PackageName -> List String
packageNamespace packageName =
    packageName |> List.map Name.toTitleCase


moduleNamespace : PackageName -> ModuleName -> List String
moduleNamespace packageName moduleName =
    (packageName ++ moduleName) |> List.map Name.toTitleCase


toTypeName : Name -> String
toTypeName =
    Name.toTitleCase


toValueName : Name -> String
toValueName =
    Name.toCamelCase


{-| Elm keeps type variables and values in separate namespaces (`identity : a -> a` with an argument named `a` is
fine) but Lean does not. Type variables are therefore mapped to Greek letters (single-letter names) or get a `τ`
prefix, which can never clash with an Elm value name.
-}
toTypeVarName : Name -> String
toTypeVarName name =
    let
        greek : Dict String String
        greek =
            Dict.fromList
                [ ( "a", "α" ), ( "b", "β" ), ( "c", "γ" ), ( "d", "δ" ), ( "e", "ε" ), ( "f", "ζ" ), ( "g", "η" ), ( "h", "θ" ), ( "i", "ι" ), ( "k", "κ" ), ( "m", "μ" ), ( "v", "ν" ) ]
    in
    case name of
        [ single ] ->
            Dict.get single greek
                |> Maybe.withDefault ("τ" ++ Name.toTitleCase name)

        _ ->
            "τ" ++ Name.toTitleCase name


{-| Qualified name used to refer to a type or value defined in a module. Names in the current module are left
unqualified for readability.
-}
qualifiedName : Context -> (Name -> String) -> FQName -> Lean.QualifiedName
qualifiedName ctx toLocal ( packageName, moduleName, localName ) =
    if packageName == ctx.packageName && moduleName == ctx.moduleName then
        [ toLocal localName ]

    else
        moduleNamespace packageName moduleName ++ [ toLocal localName ]


sdkPackageName : PackageName
sdkPackageName =
    Path.fromString "Morphir.SDK"


isSDK : FQName -> Bool
isSDK ( packageName, _, _ ) =
    packageName == sdkPackageName


{-| Find the module (within the current package) that a qualified Lean name refers to.
-}
moduleOfName : Context -> Lean.QualifiedName -> Maybe ModuleName
moduleOfName ctx name =
    case ctx.distribution of
        Library _ _ packageDef ->
            packageDef.modules
                |> Dict.keys
                |> List.filter
                    (\moduleName ->
                        let
                            ns : List String
                            ns =
                                moduleNamespace ctx.packageName moduleName
                        in
                        List.take (List.length ns) name == ns && List.length name > List.length ns
                    )
                |> List.sortBy (\moduleName -> -(List.length moduleName))
                |> List.head


{-| Collect every qualified name in a declaration. Used to compute imports.
-}
collectDeclNames : Lean.Decl -> List Lean.QualifiedName
collectDeclNames decl =
    case decl of
        Lean.InductiveDecl ind ->
            ind.constructors |> List.concatMap (.args >> List.concatMap (Tuple.second >> collectTypeNames))

        Lean.StructureDecl str ->
            str.fields |> List.concatMap (.tpe >> collectTypeNames)

        Lean.AbbrevDecl abbrev ->
            collectTypeNames abbrev.tpe

        Lean.Def def ->
            (def.binders
                |> List.concatMap
                    (\binder ->
                        case binder of
                            Lean.ExplicitBinder _ tpe ->
                                collectTypeNames tpe

                            Lean.ImplicitBinder _ tpe ->
                                collectTypeNames tpe

                            Lean.InstanceBinder tpe ->
                                collectTypeNames tpe
                    )
            )
                ++ collectTypeNames def.returnType
                ++ collectTermNames def.body

        Lean.MutualBlock decls ->
            decls |> List.concatMap collectDeclNames

        Lean.Comment _ ->
            []

        Lean.Guard _ term ->
            collectTermNames term


collectTypeNames : Lean.Type -> List Lean.QualifiedName
collectTypeNames tpe =
    case tpe of
        Lean.TypeRef name args ->
            name :: List.concatMap collectTypeNames args

        Lean.ProductType elems ->
            List.concatMap collectTypeNames elems

        Lean.FunctionType a b ->
            collectTypeNames a ++ collectTypeNames b

        _ ->
            []


collectTermNames : Lean.Term -> List Lean.QualifiedName
collectTermNames term =
    let
        bindingNames : Lean.LetBinding -> List Lean.QualifiedName
        bindingNames binding =
            (binding.params |> List.concatMap (Tuple.second >> Maybe.map collectTypeNames >> Maybe.withDefault []))
                ++ (binding.returnType |> Maybe.map collectTypeNames |> Maybe.withDefault [])
                ++ collectTermNames binding.value
    in
    case term of
        Lean.Ref name ->
            [ name ]

        Lean.App fun args ->
            List.concatMap collectTermNames (fun :: args)

        Lean.BinOp l _ r ->
            collectTermNames l ++ collectTermNames r

        Lean.Lambda patterns body ->
            List.concatMap collectPatternNames patterns ++ collectTermNames body

        Lean.Let binding body ->
            bindingNames binding ++ collectTermNames body

        Lean.LetRec bindings body ->
            List.concatMap bindingNames bindings ++ collectTermNames body

        Lean.IfThenElse c t e ->
            List.concatMap collectTermNames [ c, t, e ]

        Lean.Match scrutinees cases ->
            List.concatMap collectTermNames scrutinees
                ++ (cases |> List.concatMap (\( ps, rhs ) -> List.concatMap collectPatternNames ps ++ collectTermNames rhs))

        Lean.TupleTerm elems ->
            List.concatMap collectTermNames elems

        Lean.ListTerm elems ->
            List.concatMap collectTermNames elems

        Lean.StructInstance base fields ->
            (base |> Maybe.map collectTermNames |> Maybe.withDefault [])
                ++ (fields |> List.concatMap (Tuple.second >> collectTermNames))

        Lean.Projection subject _ ->
            collectTermNames subject

        Lean.Ascription subject tpe ->
            collectTermNames subject ++ collectTypeNames tpe

        _ ->
            []


collectPatternNames : Lean.Pattern -> List Lean.QualifiedName
collectPatternNames pattern =
    case pattern of
        Lean.CtorPattern name args ->
            name :: List.concatMap collectPatternNames args

        Lean.AsPattern _ p ->
            collectPatternNames p

        Lean.TuplePattern ps ->
            List.concatMap collectPatternNames ps

        Lean.ConsPattern h t ->
            collectPatternNames h ++ collectPatternNames t

        Lean.TypedPattern p tpe ->
            collectPatternNames p ++ collectTypeNames tpe

        _ ->
            []


{-| Collect references to values and constructors. Used to order definitions within a module.
-}
collectValueReferences : Value ta va -> Set FQName
collectValueReferences value =
    let
        collectAll : List (Value ta va) -> Set FQName
        collectAll values =
            values |> List.map collectValueReferences |> List.foldl Set.union Set.empty

        collectDef : Value.Definition ta va -> Set FQName
        collectDef def =
            collectValueReferences def.body
    in
    case value of
        Value.Constructor _ fqn ->
            Set.singleton fqn

        Value.Reference _ fqn ->
            Set.singleton fqn

        Value.Tuple _ elems ->
            collectAll elems

        Value.List _ items ->
            collectAll items

        Value.Record _ fields ->
            collectAll (Dict.values fields)

        Value.Field _ subject _ ->
            collectValueReferences subject

        Value.Apply _ fun arg ->
            collectAll [ fun, arg ]

        Value.Lambda _ _ body ->
            collectValueReferences body

        Value.LetDefinition _ _ def inValue ->
            Set.union (collectDef def) (collectValueReferences inValue)

        Value.LetRecursion _ defs inValue ->
            defs |> Dict.values |> List.map collectDef |> List.foldl Set.union (collectValueReferences inValue)

        Value.Destructure _ _ v inValue ->
            collectAll [ v, inValue ]

        Value.IfThenElse _ c t e ->
            collectAll [ c, t, e ]

        Value.PatternMatch _ subject cases ->
            collectAll (subject :: List.map Tuple.second cases)

        Value.UpdateRecord _ subject fields ->
            collectAll (subject :: Dict.values fields)

        _ ->
            Set.empty



-- TYPE DEFINITIONS


{-| Map a type definition to a Lean declaration. Records become structures, custom types become inductive types and
all other aliases become `abbrev`s. Type classes that are needed for equality and printing are derived when the type
supports them.
-}
mapTypeDefinition : Context -> Bool -> Name -> Documented (Type.Definition ()) -> Lean.Decl
mapTypeDefinition ctx isRecursive name documented =
    let
        doc : Maybe String
        doc =
            if String.isEmpty (String.trim documented.doc) then
                Nothing

            else
                Just documented.doc

        typeParams : List Name -> List String
        typeParams params =
            params |> List.map toTypeVarName

        ctxWithParams : List Name -> Context
        ctxWithParams params =
            { ctx | typeVarsInScope = Set.fromList params }

        deriving : List String
        deriving =
            if isRecursive then
                derivableClasses ctx documented.value
                    |> List.filter (\c -> c /= "DecidableEq")

            else
                derivableClasses ctx documented.value
    in
    case documented.value of
        Type.TypeAliasDefinition params (Type.Record _ fields) ->
            case fields |> List.map (\field -> mapType (ctxWithParams params) field.tpe |> Result.map (Lean.Field (toValueName field.name))) |> combine of
                Ok leanFields ->
                    Lean.StructureDecl
                        { name = toTypeName name
                        , doc = doc
                        , typeParams = typeParams params
                        , fields = leanFields
                        , deriving = deriving
                        }

                Err error ->
                    unsupportedDecl "type" name error

        Type.TypeAliasDefinition params tpe ->
            case mapType (ctxWithParams params) tpe of
                Ok leanType ->
                    Lean.AbbrevDecl
                        { name = toTypeName name
                        , doc = doc
                        , typeParams = typeParams params
                        , tpe = leanType
                        }

                Err error ->
                    unsupportedDecl "type" name error

        Type.CustomTypeDefinition params accessControlledCtors ->
            let
                ctorsResult : Result String (List Lean.Constructor)
                ctorsResult =
                    accessControlledCtors.value
                        |> Dict.toList
                        |> List.map
                            (\( ctorName, ctorArgs ) ->
                                ctorArgs
                                    |> List.map
                                        (\( argName, argType ) ->
                                            mapType (ctxWithParams params) argType
                                                |> Result.map (Tuple.pair (toValueName argName))
                                        )
                                    |> combine
                                    |> Result.map (Lean.Constructor (toValueName ctorName))
                            )
                        |> combine
            in
            case ctorsResult of
                Ok ctors ->
                    Lean.InductiveDecl
                        { name = toTypeName name
                        , doc = doc
                        , typeParams = typeParams params
                        , constructors = ctors
                        , deriving = deriving
                        }

                Err error ->
                    unsupportedDecl "type" name error


unsupportedDecl : String -> Name -> String -> Lean.Decl
unsupportedDecl kind name error =
    Lean.Comment
        (String.concat
            [ "Morphir: the "
            , kind
            , " `"
            , Name.toCamelCase name
            , "` could not be translated to Lean: "
            , error
            ]
        )


type alias TypeTraits =
    { hasFunction : Bool
    , hasFloat : Bool
    , hasOpaque : Bool
    }


{-| Decide which type classes can be derived for a type definition. Function types prevent all deriving, floats
prevent `DecidableEq` and types we know nothing about (opaque SDK types or types from other packages) are treated
conservatively.
-}
derivableClasses : Context -> Type.Definition () -> List String
derivableClasses ctx typeDef =
    let
        traits : TypeTraits
        traits =
            typeDefinitionTypes typeDef
                |> List.map (typeTraits ctx Set.empty)
                |> List.foldl mergeTraits noTraits
    in
    if traits.hasFunction || traits.hasOpaque then
        []

    else if traits.hasFloat then
        [ "Repr", "BEq" ]

    else
        [ "Repr", "BEq", "DecidableEq" ]


noTraits : TypeTraits
noTraits =
    { hasFunction = False, hasFloat = False, hasOpaque = False }


mergeTraits : TypeTraits -> TypeTraits -> TypeTraits
mergeTraits a b =
    { hasFunction = a.hasFunction || b.hasFunction
    , hasFloat = a.hasFloat || b.hasFloat
    , hasOpaque = a.hasOpaque || b.hasOpaque
    }


typeDefinitionTypes : Type.Definition () -> List (Type ())
typeDefinitionTypes typeDef =
    case typeDef of
        Type.TypeAliasDefinition _ tpe ->
            [ tpe ]

        Type.CustomTypeDefinition _ ctors ->
            ctors.value |> Dict.values |> List.concatMap (List.map Tuple.second)


typeTraits : Context -> Set FQName -> Type () -> TypeTraits
typeTraits ctx visited tpe =
    let
        all : List (Type ()) -> TypeTraits
        all types =
            types |> List.map (typeTraits ctx visited) |> List.foldl mergeTraits noTraits
    in
    case tpe of
        Type.Variable _ _ ->
            noTraits

        Type.Reference _ (( packageName, moduleName, localName ) as fqn) args ->
            if isSDK fqn then
                case ( Path.toString Name.toTitleCase "." moduleName, Name.toTitleCase localName ) of
                    ( "Basics", "Float" ) ->
                        { noTraits | hasFloat = True }

                    _ ->
                        if Dict.member ( Path.toString Name.toTitleCase "." moduleName, Name.toTitleCase localName ) sdkTypes then
                            all args

                        else
                            { noTraits | hasOpaque = True }

            else if packageName == ctx.packageName then
                if Set.member fqn visited then
                    all args

                else
                    case lookupTypeDefinition ctx fqn of
                        Just typeDef ->
                            typeDefinitionTypes typeDef
                                |> List.map (typeTraits ctx (Set.insert fqn visited))
                                |> List.foldl mergeTraits (all args)

                        Nothing ->
                            { noTraits | hasOpaque = True }

            else
                { noTraits | hasOpaque = True }

        Type.Tuple _ elems ->
            all elems

        Type.Record _ fields ->
            all (fields |> List.map .tpe)

        Type.ExtensibleRecord _ _ fields ->
            all (fields |> List.map .tpe)

        Type.Function _ _ _ ->
            { noTraits | hasFunction = True }

        Type.Unit _ ->
            noTraits


lookupTypeDefinition : Context -> FQName -> Maybe (Type.Definition ())
lookupTypeDefinition ctx ( packageName, moduleName, localName ) =
    case ctx.distribution of
        Library libPackageName _ packageDef ->
            if packageName == libPackageName then
                packageDef.modules
                    |> Dict.get moduleName
                    |> Maybe.andThen (\m -> m.value.types |> Dict.get localName)
                    |> Maybe.map (.value >> .value)

            else
                Nothing



-- TYPES


{-| SDK types that map directly to Lean types. Keyed by (module name, type name).
-}
sdkTypes : Dict ( String, String ) Lean.QualifiedName
sdkTypes =
    Dict.fromList
        [ ( ( "Basics", "Int" ), [ "Int" ] )
        , ( ( "Basics", "Float" ), [ "Float" ] )
        , ( ( "Basics", "Bool" ), [ "Bool" ] )
        , ( ( "Basics", "Order" ), [ "Ordering" ] )
        , ( ( "Basics", "Never" ), [ "Empty" ] )
        , ( ( "Char", "Char" ), [ "Char" ] )
        , ( ( "String", "String" ), [ "String" ] )
        , ( ( "List", "List" ), [ "List" ] )
        , ( ( "Maybe", "Maybe" ), [ "Option" ] )
        , ( ( "Result", "Result" ), [ "Except" ] )
        , ( ( "Dict", "Dict" ), [ "Morphir", "SDK", "Dict", "Dict" ] )
        , ( ( "Set", "Set" ), [ "Morphir", "SDK", "Set", "Set" ] )
        , ( ( "Decimal", "Decimal" ), [ "Morphir", "SDK", "Decimal", "Decimal" ] )
        , ( ( "Int", "Int8" ), [ "Int" ] )
        , ( ( "Int", "Int16" ), [ "Int" ] )
        , ( ( "Int", "Int32" ), [ "Int" ] )
        , ( ( "Int", "Int64" ), [ "Int" ] )
        ]


{-| Map a Morphir type to a Lean type.
-}
mapType : Context -> Type () -> Result String Lean.Type
mapType ctx tpe =
    case tpe of
        Type.Variable _ name ->
            Ok (Lean.TypeVar (toTypeVarName name))

        Type.Reference _ (( _, moduleName, localName ) as fqn) args ->
            args
                |> List.map (mapType ctx)
                |> combine
                |> Result.map
                    (\leanArgs ->
                        let
                            sdkName : Maybe Lean.QualifiedName
                            sdkName =
                                if isSDK fqn then
                                    Dict.get ( Path.toString Name.toTitleCase "." moduleName, Name.toTitleCase localName ) sdkTypes

                                else
                                    Nothing
                        in
                        case sdkName of
                            Just name ->
                                Lean.TypeRef name leanArgs

                            Nothing ->
                                Lean.TypeRef (qualifiedName ctx toTypeName fqn) leanArgs
                    )

        Type.Tuple _ [] ->
            Ok Lean.UnitType

        Type.Tuple _ [ single ] ->
            mapType ctx single

        Type.Tuple _ elems ->
            elems |> List.map (mapType ctx) |> combine |> Result.map Lean.ProductType

        Type.Record _ fields ->
            case findRecordAlias ctx fields of
                Just aliasName ->
                    Ok (Lean.TypeRef (qualifiedName ctx toTypeName aliasName) [])

                Nothing ->
                    Err
                        (String.concat
                            [ "anonymous record types are not supported in Lean (no type alias found for fields "
                            , fields |> List.map (.name >> Name.toCamelCase) |> String.join ", "
                            , ")"
                            ]
                        )

        Type.ExtensibleRecord _ varName _ ->
            Err ("extensible record types are not supported in Lean (type variable " ++ Name.toCamelCase varName ++ ")")

        Type.Function _ argType returnType ->
            Result.map2 Lean.FunctionType (mapType ctx argType) (mapType ctx returnType)

        Type.Unit _ ->
            Ok Lean.UnitType


{-| Find a record type alias that has exactly the given fields.
-}
findRecordAlias : Context -> List (Type.Field ()) -> Maybe FQName
findRecordAlias ctx fields =
    let
        fieldNames : List (Type.Field ()) -> List Name
        fieldNames fs =
            fs |> List.map .name |> List.sort

        sameNames : List ( FQName, List (Type.Field ()) )
        sameNames =
            ctx.recordAliases
                |> List.filter (\( _, aliasFields ) -> fieldNames aliasFields == fieldNames fields)

        sortedFields : List (Type.Field ()) -> List ( Name, Type () )
        sortedFields fs =
            fs |> List.map (\f -> ( f.name, f.tpe )) |> List.sortBy (Tuple.first >> String.concat)
    in
    case sameNames of
        [ ( fqn, _ ) ] ->
            Just fqn

        _ ->
            sameNames
                |> List.filter (\( _, aliasFields ) -> sortedFields aliasFields == sortedFields fields)
                |> List.head
                |> Maybe.map Tuple.first


{-| Map a type to be used in a type ascription. Type variables that are not in scope are left unconstrained by the
Morphir type checker (for example the error type in `Result.withDefault 0 (Ok 1)`). Lean needs a concrete type there,
so they are replaced by `Int` for `number` variables (Elm's default) and `Unit` for anything else.
-}
mapAscriptionType : Context -> Type () -> Maybe Lean.Type
mapAscriptionType ctx tpe =
    let
        substitution : Dict Name (Type ())
        substitution =
            Set.diff (Type.collectVariables tpe) ctx.typeVarsInScope
                |> Set.toList
                |> List.map
                    (\var ->
                        if String.startsWith "number" (List.head var |> Maybe.withDefault "") then
                            ( var, intType )

                        else
                            ( var, Type.Unit () )
                    )
                |> Dict.fromList
    in
    mapType ctx (Type.substituteTypeVariables substitution tpe) |> Result.toMaybe


intType : Type ()
intType =
    Type.Reference () ( sdkPackageName, [ [ "basics" ] ], [ "int" ] ) []


{-| Map a type only if all its type variables are in scope. Used for optional annotations.
-}
mapClosedType : Context -> Type () -> Maybe Lean.Type
mapClosedType ctx tpe =
    if Set.isEmpty (Set.diff (Type.collectVariables tpe) ctx.typeVarsInScope) then
        mapType ctx tpe |> Result.toMaybe

    else
        Nothing



-- VALUE DEFINITIONS


{-| Map a value definition to a Lean `def`. When the signature cannot be represented in Lean the definition is
replaced by a comment. When only the body fails to translate the body is replaced with `sorry` so that the rest of the
module can still be checked.
-}
mapValueDefinition : Context -> Name -> Documented (Value.Definition () (Type ())) -> Lean.Decl
mapValueDefinition ctx name documented =
    let
        def : Value.Definition () (Type ())
        def =
            documented.value

        typeVars : List Name
        typeVars =
            (def.inputTypes |> List.map (\( _, _, t ) -> t))
                ++ [ def.outputType ]
                |> List.map Type.collectVariables
                |> List.foldl Set.union Set.empty
                |> Set.toList

        defCtx : Context
        defCtx =
            { ctx | typeVarsInScope = Set.fromList typeVars }

        typeVarBinders : List Lean.Binder
        typeVarBinders =
            typeVars
                |> List.concatMap
                    (\var ->
                        Lean.ImplicitBinder (toTypeVarName var) Lean.TypeSort
                            :: typeClassConstraints var
                    )

        inputBindersResult : Result String (List Lean.Binder)
        inputBindersResult =
            def.inputTypes
                |> List.map
                    (\( argName, _, argType ) ->
                        mapType defCtx argType
                            |> Result.map (Lean.ExplicitBinder (toValueName argName))
                    )
                |> combine

        doc : Maybe String
        doc =
            if String.isEmpty (String.trim documented.doc) then
                Nothing

            else
                Just documented.doc
    in
    case Result.map2 Tuple.pair inputBindersResult (mapType defCtx def.outputType) of
        Ok ( inputBinders, returnType ) ->
            case mapValue defCtx def.body of
                Ok body ->
                    Lean.Def
                        { name = toValueName name
                        , doc = doc
                        , binders = typeVarBinders ++ inputBinders
                        , returnType = returnType
                        , body = body
                        }

                Err error ->
                    Lean.Def
                        { name = toValueName name
                        , doc =
                            Just
                                (String.concat
                                    [ doc |> Maybe.map (\d -> d ++ "\n\n") |> Maybe.withDefault ""
                                    , "Morphir: the body could not be translated to Lean: "
                                    , error
                                    ]
                                )
                        , binders = typeVarBinders ++ inputBinders
                        , returnType = returnType
                        , body = Lean.Sorry
                        }

        Err error ->
            unsupportedDecl "value" name error


{-| Elm's constrained type variables (`comparable`, `number`, `appendable`) become type class constraints. All type
variables get `BEq` since Elm's `==` works on any type.
-}
typeClassConstraints : Name -> List Lean.Binder
typeClassConstraints var =
    let
        v : Lean.Type
        v =
            Lean.TypeVar (toTypeVarName var)

        firstWord : String
        firstWord =
            List.head var |> Maybe.withDefault ""

        instance : Lean.QualifiedName -> Lean.Binder
        instance className =
            Lean.InstanceBinder (Lean.TypeRef className [ v ])
    in
    if String.startsWith "comparable" firstWord then
        [ instance [ "BEq" ], instance [ "Ord" ] ]

    else if String.startsWith "number" firstWord then
        [ instance [ "BEq" ], instance [ "Morphir", "SDK", "Number" ] ]

    else if String.startsWith "appendable" firstWord then
        [ instance [ "BEq" ], instance [ "Append" ] ]

    else
        [ instance [ "BEq" ] ]



-- VALUES


{-| Binary operators from `Morphir.SDK.Basics` (and friends) that are printed infix when fully applied.
-}
infixOperators : Dict ( String, String ) String
infixOperators =
    Dict.fromList
        [ ( ( "Basics", "add" ), "+" )
        , ( ( "Basics", "subtract" ), "-" )
        , ( ( "Basics", "multiply" ), "*" )
        , ( ( "Basics", "divide" ), "/" )
        , ( ( "Basics", "equal" ), "==" )
        , ( ( "Basics", "notEqual" ), "!=" )
        , ( ( "Basics", "and" ), "&&" )
        , ( ( "Basics", "or" ), "||" )
        , ( ( "Basics", "append" ), "++" )
        , ( ( "String", "append" ), "++" )
        , ( ( "List", "append" ), "++" )
        ]


{-| Comparison operators are only printed infix when the operands have a primitive type that has a decidable order
in Lean. Otherwise the SDK function (based on `Ord`) is used.
-}
comparisonOperators : Dict ( String, String ) String
comparisonOperators =
    Dict.fromList
        [ ( ( "Basics", "lessThan" ), "<" )
        , ( ( "Basics", "greaterThan" ), ">" )
        , ( ( "Basics", "lessThanOrEqual" ), "≤" )
        , ( ( "Basics", "greaterThanOrEqual" ), "≥" )
        ]


sdkKey : FQName -> ( String, String )
sdkKey ( _, moduleName, localName ) =
    ( Path.toString Name.toTitleCase "." moduleName, Name.toCamelCase localName )


hasPrimitiveOrder : Type () -> Bool
hasPrimitiveOrder tpe =
    case tpe of
        Type.Reference _ fqn [] ->
            isSDK fqn
                && List.member (sdkKey fqn)
                    [ ( "Basics", "int" ), ( "Basics", "float" ), ( "Char", "char" ), ( "String", "string" ), ( "Decimal", "decimal" ) ]

        _ ->
            False


{-| Map a typed Morphir value to a Lean term.
-}
mapValue : Context -> TypedValue -> Result String Lean.Term
mapValue ctx value =
    case value of
        Value.Literal tpe lit ->
            mapLiteral tpe lit |> Result.map Lean.Lit

        Value.Constructor tpe fqn ->
            mapConstructorName ctx fqn
                |> Result.map
                    (\name ->
                        case mapAscriptionType ctx tpe of
                            Just leanType ->
                                if hasTypeArgs tpe then
                                    Lean.Ascription (Lean.Ref name) leanType

                                else
                                    Lean.Ref name

                            Nothing ->
                                Lean.Ref name
                    )

        Value.Tuple _ [] ->
            Ok Lean.UnitTerm

        Value.Tuple _ elems ->
            elems |> List.map (mapValue ctx) |> combine |> Result.map Lean.TupleTerm

        Value.List tpe items ->
            items
                |> List.map (mapValue ctx)
                |> combine
                |> Result.map
                    (\leanItems ->
                        if List.isEmpty leanItems then
                            mapAscriptionType ctx tpe
                                |> Maybe.map (Lean.Ascription (Lean.ListTerm []))
                                |> Maybe.withDefault (Lean.ListTerm [])

                        else
                            Lean.ListTerm leanItems
                    )

        Value.Record tpe fields ->
            fields
                |> Dict.toList
                |> List.map (\( fieldName, fieldValue ) -> mapValue ctx fieldValue |> Result.map (Tuple.pair (toValueName fieldName)))
                |> combine
                |> Result.map
                    (\leanFields ->
                        case mapAscriptionType ctx tpe of
                            Just leanType ->
                                Lean.Ascription (Lean.StructInstance Nothing leanFields) leanType

                            Nothing ->
                                Lean.StructInstance Nothing leanFields
                    )

        Value.Variable _ name ->
            Ok (Lean.Var (toValueName name))

        Value.Reference _ fqn ->
            Ok (Lean.Ref (qualifiedName ctx toValueName fqn))

        Value.Field _ subject fieldName ->
            mapValue ctx subject
                |> Result.map (\s -> Lean.Projection s (toValueName fieldName))

        Value.FieldFunction tpe fieldName ->
            let
                argPattern : Lean.Pattern
                argPattern =
                    case tpe of
                        Type.Function _ argType _ ->
                            case mapAscriptionType ctx argType of
                                Just leanType ->
                                    Lean.TypedPattern (Lean.VarPattern "r") leanType

                                Nothing ->
                                    Lean.VarPattern "r"

                        _ ->
                            Lean.VarPattern "r"
            in
            Ok (Lean.Lambda [ argPattern ] (Lean.Projection (Lean.Var "r") (toValueName fieldName)))

        Value.Apply tpe fun arg ->
            mapApply ctx tpe (Value.uncurryApply fun arg)

        Value.Lambda tpe pattern body ->
            let
                argType : Maybe Lean.Type
                argType =
                    case tpe of
                        Type.Function _ t _ ->
                            mapAscriptionType ctx t

                        _ ->
                            Nothing

                leanPatternResult : Result String Lean.Pattern
                leanPatternResult =
                    mapPattern ctx pattern
                        |> Result.map
                            (\p ->
                                case ( p, argType ) of
                                    ( Lean.VarPattern _, Just t ) ->
                                        Lean.TypedPattern p t

                                    ( Lean.WildcardPattern, Just t ) ->
                                        Lean.TypedPattern p t

                                    _ ->
                                        p
                            )
            in
            Result.map2
                (\leanPattern leanBody ->
                    case leanBody of
                        Lean.Lambda innerPatterns innerBody ->
                            Lean.Lambda (leanPattern :: innerPatterns) innerBody

                        _ ->
                            Lean.Lambda [ leanPattern ] leanBody
                )
                leanPatternResult
                (mapValue ctx body)

        Value.LetDefinition _ name def inValue ->
            Result.map2 Lean.Let
                (mapLetBinding ctx name def)
                (mapValue ctx inValue)

        Value.LetRecursion _ defs inValue ->
            Result.map2 Lean.LetRec
                (defs |> Dict.toList |> List.map (\( name, def ) -> mapLetBinding ctx name def) |> combine)
                (mapValue ctx inValue)

        Value.Destructure _ pattern valueToDestruct inValue ->
            Result.map3 (\p v body -> Lean.Match [ v ] [ ( [ p ], body ) ])
                (mapPattern ctx pattern)
                (mapValue ctx valueToDestruct)
                (mapValue ctx inValue)

        Value.IfThenElse _ cond thenBranch elseBranch ->
            Result.map3 Lean.IfThenElse
                (mapValue ctx cond)
                (mapValue ctx thenBranch)
                (mapValue ctx elseBranch)

        Value.PatternMatch _ subject cases ->
            Result.map2 (\s leanCases -> Lean.Match [ s ] leanCases)
                (mapValue ctx subject)
                (cases
                    |> List.map
                        (\( pattern, caseValue ) ->
                            Result.map2 (\p v -> ( [ p ], v ))
                                (mapPattern ctx pattern)
                                (mapValue ctx caseValue)
                        )
                    |> combine
                )

        Value.UpdateRecord _ subject fields ->
            Result.map2 (\s leanFields -> Lean.StructInstance (Just s) leanFields)
                (mapValue ctx subject)
                (fields
                    |> Dict.toList
                    |> List.map (\( fieldName, fieldValue ) -> mapValue ctx fieldValue |> Result.map (Tuple.pair (toValueName fieldName)))
                    |> combine
                )

        Value.Unit _ ->
            Ok Lean.UnitTerm


{-| Constructors without arguments of a parameterized type (like `Nothing` or `[]`) often need a type ascription in
Lean because the type parameters cannot always be inferred.
-}
hasTypeArgs : Type () -> Bool
hasTypeArgs tpe =
    case tpe of
        Type.Reference _ _ (_ :: _) ->
            True

        _ ->
            False


mapApply : Context -> Type () -> ( TypedValue, List TypedValue ) -> Result String Lean.Term
mapApply ctx tpe ( fun, args ) =
    let
        app : (TypedValue -> Lean.Term -> Lean.Term) -> Result String Lean.Term
        app adjustArg =
            Result.map2 Lean.App
                (mapApplyTarget ctx fun)
                (args |> List.map (\arg -> mapValue ctx arg |> Result.map (adjustArg arg)) |> combine)

        binOp : String -> TypedValue -> TypedValue -> Result String Lean.Term
        binOp op left right =
            Result.map2
                (\l r ->
                    -- with two literal operands Lean has no type information and would default to `Nat`
                    if isLiteral left && isLiteral right then
                        Lean.BinOp (ascribeIntLiteral ctx left l) op r

                    else
                        Lean.BinOp l op r
                )
                (mapValue ctx left)
                (mapValue ctx right)
    in
    case fun of
        Value.Reference _ fqn ->
            if isSDK fqn then
                case ( Dict.get (sdkKey fqn) infixOperators, Dict.get (sdkKey fqn) comparisonOperators, args ) of
                    ( Just op, _, [ left, right ] ) ->
                        binOp op left right

                    ( _, Just op, [ left, right ] ) ->
                        if hasPrimitiveOrder (Value.valueAttribute left) then
                            binOp op left right

                        else
                            app (ascribeIntLiteral ctx)

                    ( _, _, [ left, _ ] ) ->
                        if List.member (sdkKey fqn) [ ( "Basics", "min" ), ( "Basics", "max" ) ] && hasPrimitiveOrder (Value.valueAttribute left) then
                            -- Lean's own `min` and `max` are understood by decision procedures like `omega`
                            Result.map2 Lean.App
                                (Ok (Lean.Ref [ Tuple.second (sdkKey fqn) ]))
                                (args |> List.map (\arg -> mapValue ctx arg |> Result.map (ascribeIntLiteral ctx arg)) |> combine)

                        else
                            app (ascribeIntLiteral ctx)

                    _ ->
                        -- SDK functions are polymorphic in Lean so integer literals need an explicit type
                        app (ascribeIntLiteral ctx)

            else
                app (\_ term -> term)

        Value.Constructor _ _ ->
            -- the type arguments of a constructor are not always determined by its arguments (e.g. `Ok 1`)
            app (\_ term -> term)
                |> Result.map
                    (\term ->
                        if hasTypeArgs tpe then
                            mapAscriptionType ctx tpe
                                |> Maybe.map (Lean.Ascription term)
                                |> Maybe.withDefault term

                        else
                            term
                    )

        _ ->
            app (\_ term -> term)


isLiteral : TypedValue -> Bool
isLiteral value =
    case value of
        Value.Literal _ _ ->
            True

        _ ->
            False


{-| Add an `Int` type ascription to whole number literals that are typed as `Int` (or as an unresolved `number`, which
Elm defaults to `Int`).
-}
ascribeIntLiteral : Context -> TypedValue -> Lean.Term -> Lean.Term
ascribeIntLiteral ctx value term =
    case ( value, term ) of
        ( Value.Literal tpe (Literal.WholeNumberLiteral _), Lean.Lit (Lean.IntLit _) ) ->
            let
                isInt : Bool
                isInt =
                    case tpe of
                        Type.Variable _ var ->
                            not (Set.member var ctx.typeVarsInScope)

                        _ ->
                            tpe == intType
            in
            if isInt then
                Lean.Ascription term (Lean.TypeRef [ "Int" ] [])

            else
                term

        _ ->
            term


{-| Constructors are referenced without their type ascription when they are applied to arguments.
-}
mapApplyTarget : Context -> TypedValue -> Result String Lean.Term
mapApplyTarget ctx fun =
    case fun of
        Value.Constructor _ fqn ->
            mapConstructorName ctx fqn |> Result.map Lean.Ref

        _ ->
            mapValue ctx fun


mapLetBinding : Context -> Name -> Value.Definition () (Type ()) -> Result String Lean.LetBinding
mapLetBinding ctx name def =
    mapValue ctx def.body
        |> Result.map
            (\body ->
                { name = toValueName name
                , params = def.inputTypes |> List.map (\( argName, _, argType ) -> ( toValueName argName, mapClosedType ctx argType ))
                , returnType = mapClosedType ctx def.outputType
                , value = body
                }
            )


mapLiteral : Type () -> Literal.Literal -> Result String Lean.Literal
mapLiteral tpe lit =
    case lit of
        Literal.BoolLiteral b ->
            Ok (Lean.BoolLit b)

        Literal.CharLiteral c ->
            Ok (Lean.CharLit c)

        Literal.StringLiteral s ->
            Ok (Lean.StringLit s)

        Literal.WholeNumberLiteral n ->
            case tpe of
                Type.Reference _ fqn [] ->
                    if isSDK fqn && sdkKey fqn == ( "Basics", "float" ) then
                        Ok (Lean.FloatLit (toFloat n))

                    else if isSDK fqn && sdkKey fqn == ( "Decimal", "decimal" ) then
                        Ok (Lean.DecimalLit (String.fromInt n))

                    else
                        Ok (Lean.IntLit n)

                _ ->
                    Ok (Lean.IntLit n)

        Literal.FloatLiteral f ->
            Ok (Lean.FloatLit f)

        Literal.DecimalLiteral d ->
            Ok (Lean.DecimalLit (Decimal.toString d))


{-| SDK constructors that map to Lean core constructors.
-}
sdkConstructors : Dict ( String, String ) Lean.QualifiedName
sdkConstructors =
    Dict.fromList
        [ ( ( "Maybe", "just" ), [ "some" ] )
        , ( ( "Maybe", "nothing" ), [ "none" ] )
        , ( ( "Result", "ok" ), [ "Except", "ok" ] )
        , ( ( "Result", "err" ), [ "Except", "error" ] )
        , ( ( "Basics", "lT" ), [ "Ordering", "lt" ] )
        , ( ( "Basics", "eQ" ), [ "Ordering", "eq" ] )
        , ( ( "Basics", "gT" ), [ "Ordering", "gt" ] )
        , ( ( "Basics", "true" ), [ "true" ] )
        , ( ( "Basics", "false" ), [ "false" ] )
        ]


{-| Lean constructors live in the namespace of their type, so we need to find the type a constructor belongs to.
Record type aliases used as constructors map to the structure's `mk` constructor.
-}
mapConstructorName : Context -> FQName -> Result String Lean.QualifiedName
mapConstructorName ctx (( packageName, moduleName, localName ) as fqn) =
    case
        if isSDK fqn then
            Dict.get (sdkKey fqn) sdkConstructors

        else
            Nothing
    of
        Just name ->
            Ok name

        Nothing ->
            case Distribution.lookupTypeConstructor fqn ctx.distribution of
                Just ( ( _, _, ctorTypeName ), _, _ ) ->
                    Ok (qualifiedName ctx toTypeName ( packageName, moduleName, ctorTypeName ) ++ [ toValueName localName ])

                Nothing ->
                    case Distribution.lookupTypeSpecification fqn ctx.distribution of
                        Just (Type.TypeAliasSpecification _ (Type.Record _ _)) ->
                            Ok (qualifiedName ctx toTypeName fqn ++ [ "mk" ])

                        _ ->
                            Err ("unknown constructor " ++ Name.toTitleCase localName)



-- PATTERNS


{-| Map a pattern to a Lean pattern.
-}
mapPattern : Context -> Pattern (Type ()) -> Result String Lean.Pattern
mapPattern ctx pattern =
    case pattern of
        Value.WildcardPattern _ ->
            Ok Lean.WildcardPattern

        Value.AsPattern _ (Value.WildcardPattern _) name ->
            Ok (Lean.VarPattern (toValueName name))

        Value.AsPattern _ subPattern name ->
            mapPattern ctx subPattern |> Result.map (Lean.AsPattern (toValueName name))

        Value.TuplePattern _ [] ->
            Ok Lean.UnitPattern

        Value.TuplePattern _ [ single ] ->
            mapPattern ctx single

        Value.TuplePattern _ elems ->
            elems |> List.map (mapPattern ctx) |> combine |> Result.map Lean.TuplePattern

        Value.ConstructorPattern _ fqn args ->
            Result.map2 Lean.CtorPattern
                (mapConstructorName ctx fqn)
                (args |> List.map (mapPattern ctx) |> combine)

        Value.EmptyListPattern _ ->
            Ok Lean.EmptyListPattern

        Value.HeadTailPattern _ head tail ->
            Result.map2 Lean.ConsPattern (mapPattern ctx head) (mapPattern ctx tail)

        Value.LiteralPattern tpe lit ->
            case lit of
                Literal.FloatLiteral _ ->
                    Err "pattern matching on floating point literals is not supported in Lean"

                Literal.DecimalLiteral _ ->
                    Err "pattern matching on decimal literals is not supported in Lean"

                _ ->
                    mapLiteral tpe lit |> Result.map Lean.LiteralPattern

        Value.UnitPattern _ ->
            Ok Lean.UnitPattern



-- UTILITIES


combine : List (Result e a) -> Result e (List a)
combine results =
    List.foldr (Result.map2 (::)) (Ok []) results
