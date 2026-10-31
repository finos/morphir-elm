module Morphir.Value.Exhaustiveness exposing
    ( ConstructorLookup, Issue
    , constructorLookup, check
    )

{-| Exhaustiveness checking for pattern matches in the Morphir IR.

The check follows Maranget's "usefulness" algorithm (the one the Elm compiler uses): it computes the patterns that
none of the cases of a pattern match cover. Wildcards, nested patterns, literals, tuples, lists and the constructors of
custom types (including the ones from dependencies such as `Maybe` and `Result`) are taken into account.

@docs ConstructorLookup, Issue
@docs constructorLookup, check

-}

import Dict
import Morphir.IR.AccessControlled exposing (AccessControlled)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Type as Type
import Morphir.IR.Value as Value exposing (Pattern(..), Value(..))
import Set


{-| Describes the custom type that a constructor belongs to: the name of the type and all of its constructors with
their arities.
-}
type alias TypeInfo =
    { typeName : FQName
    , constructors : List ( Name, Int )
    }


{-| Finds the custom type that declares a constructor. Returns `Nothing` if the constructor is unknown.
-}
type alias ConstructorLookup =
    FQName -> Maybe TypeInfo


{-| A pattern match that does not cover all possible values.

  - `attributes` - attributes of the offending pattern match
  - `typeName` - the custom type of the matched value, when it can be determined from the patterns
  - `missing` - source-like rendering of the patterns that are not covered

-}
type alias Issue va =
    { attributes : va
    , typeName : Maybe FQName
    , missing : List String
    }


{-| Creates a constructor lookup for the types in the package and in its dependencies.
-}
constructorLookup : Distribution -> ConstructorLookup
constructorLookup (Library packageName dependencies packageDef) ( packagePath, modulePath, constructorName ) =
    let
        fromConstructors : Name -> Type.Constructors a -> Maybe TypeInfo
        fromConstructors typeName constructors =
            if Dict.member constructorName constructors then
                Just
                    { typeName = ( packagePath, modulePath, typeName )
                    , constructors =
                        constructors
                            |> Dict.toList
                            |> List.map (\( name, args ) -> ( name, List.length args ))
                    }

            else
                Nothing
    in
    if packagePath == packageName then
        packageDef.modules
            |> Dict.get modulePath
            |> Maybe.andThen
                (\accessControlledModule ->
                    accessControlledModule.value.types
                        |> Dict.toList
                        |> List.filterMap
                            (\( typeName, accessControlledType ) ->
                                case accessControlledType.value.value of
                                    Type.CustomTypeDefinition _ accessControlledConstructors ->
                                        fromConstructors typeName (accessControlledConstructors |> unwrap)

                                    _ ->
                                        Nothing
                            )
                        |> List.head
                )

    else
        dependencies
            |> Dict.get packagePath
            |> Maybe.andThen (.modules >> Dict.get modulePath)
            |> Maybe.andThen
                (\moduleSpec ->
                    moduleSpec.types
                        |> Dict.toList
                        |> List.filterMap
                            (\( typeName, documentedType ) ->
                                case documentedType.value of
                                    Type.CustomTypeSpecification _ constructors ->
                                        fromConstructors typeName constructors

                                    _ ->
                                        Nothing
                            )
                        |> List.head
                )


unwrap : AccessControlled a -> a
unwrap accessControlled =
    accessControlled.value


{-| Finds all pattern matches within a value that are not exhaustive.
-}
check : ConstructorLookup -> Value ta va -> List (Issue va)
check lookup value =
    let
        checkDefinition : Value.Definition ta va -> List (Issue va)
        checkDefinition def =
            check lookup def.body

        checkAll : List (Value ta va) -> List (Issue va)
        checkAll values =
            values |> List.concatMap (check lookup)
    in
    case value of
        Tuple _ elements ->
            checkAll elements

        List _ items ->
            checkAll items

        Record _ fields ->
            checkAll (Dict.values fields)

        Field _ subject _ ->
            check lookup subject

        Apply _ function argument ->
            checkAll [ function, argument ]

        Lambda _ _ body ->
            check lookup body

        LetDefinition _ _ def inValue ->
            checkDefinition def ++ check lookup inValue

        LetRecursion _ defs inValue ->
            (defs |> Dict.values |> List.concatMap checkDefinition) ++ check lookup inValue

        Destructure _ _ valueToDestructure inValue ->
            checkAll [ valueToDestructure, inValue ]

        IfThenElse _ condition thenBranch elseBranch ->
            checkAll [ condition, thenBranch, elseBranch ]

        UpdateRecord _ subject fields ->
            checkAll (subject :: Dict.values fields)

        PatternMatch attributes subject cases ->
            let
                patterns : List (Pattern va)
                patterns =
                    cases |> List.map Tuple.first

                uncovered : List String
                uncovered =
                    missingPatterns lookup patterns
            in
            (if List.isEmpty uncovered then
                []

             else
                [ { attributes = attributes
                  , typeName = patterns |> List.filterMap (rootTypeName lookup) |> List.head
                  , missing = uncovered
                  }
                ]
            )
                ++ check lookup subject
                ++ checkAll (cases |> List.map Tuple.second)

        _ ->
            []



-- Pattern matrix


type alias Ctor =
    { name : String
    , arity : Int
    }


type Signature
    = Finite (List Ctor)
    | Unknown


type Pat
    = Wild
    | Con Signature Ctor (List Pat)
    | Lit


rootTypeName : ConstructorLookup -> Pattern va -> Maybe FQName
rootTypeName lookup pattern =
    case pattern of
        AsPattern _ inner _ ->
            rootTypeName lookup inner

        ConstructorPattern _ fqName _ ->
            lookup fqName |> Maybe.map .typeName

        _ ->
            Nothing


missingPatterns : ConstructorLookup -> List (Pattern va) -> List String
missingPatterns lookup patterns =
    patterns
        |> List.map (\pattern -> [ normalize lookup pattern ])
        |> (\rows -> missing rows 1)
        |> List.filterMap
            (\witness ->
                case witness of
                    [ pat ] ->
                        Just (render False pat)

                    _ ->
                        Nothing
            )
        |> uniqueSorted


uniqueSorted : List String -> List String
uniqueSorted strings =
    strings |> Set.fromList |> Set.toList


boolSignature : Signature
boolSignature =
    Finite [ Ctor "False" 0, Ctor "True" 0 ]


listSignature : Signature
listSignature =
    Finite [ Ctor "[]" 0, Ctor "::" 2 ]


unitSignature : Signature
unitSignature =
    Finite [ Ctor "()" 0 ]


tupleCtor : Int -> Ctor
tupleCtor size =
    Ctor "(,)" size


normalize : ConstructorLookup -> Pattern va -> Pat
normalize lookup pattern =
    case pattern of
        WildcardPattern _ ->
            Wild

        AsPattern _ inner _ ->
            normalize lookup inner

        TuplePattern _ elements ->
            Con (Finite [ tupleCtor (List.length elements) ])
                (tupleCtor (List.length elements))
                (elements |> List.map (normalize lookup))

        ConstructorPattern _ fqName args ->
            let
                ( _, _, localName ) =
                    fqName

                ctor : Ctor
                ctor =
                    Ctor (Name.toTitleCase localName) (List.length args)

                signature : Signature
                signature =
                    case lookup fqName of
                        Just typeInfo ->
                            Finite
                                (typeInfo.constructors
                                    |> List.map (\( name, arity ) -> Ctor (Name.toTitleCase name) arity)
                                )

                        Nothing ->
                            -- Unknown constructors are assumed to be covered to avoid false positives.
                            Finite [ ctor ]
            in
            Con signature ctor (args |> List.map (normalize lookup))

        EmptyListPattern _ ->
            Con listSignature (Ctor "[]" 0) []

        HeadTailPattern _ headPattern tailPattern ->
            Con listSignature (Ctor "::" 2) [ normalize lookup headPattern, normalize lookup tailPattern ]

        LiteralPattern _ (BoolLiteral bool) ->
            Con boolSignature
                (Ctor
                    (if bool then
                        "True"

                     else
                        "False"
                    )
                    0
                )
                []

        LiteralPattern _ _ ->
            Lit

        UnitPattern _ ->
            Con unitSignature (Ctor "()" 0) []


{-| Returns the vectors of patterns that are not matched by any of the rows. Each row and each returned vector has
`columns` patterns.
-}
missing : List (List Pat) -> Int -> List (List Pat)
missing rows columns =
    if columns == 0 then
        if List.isEmpty rows then
            [ [] ]

        else
            []

    else
        let
            heads : List Pat
            heads =
                rows |> List.filterMap List.head

            defaultRows : List (List Pat)
            defaultRows =
                rows
                    |> List.filterMap
                        (\row ->
                            case row of
                                Wild :: rest ->
                                    Just rest

                                _ ->
                                    Nothing
                        )

            signature : Maybe Signature
            signature =
                heads
                    |> List.filterMap
                        (\head ->
                            case head of
                                Con sig _ _ ->
                                    Just sig

                                Lit ->
                                    Just Unknown

                                Wild ->
                                    Nothing
                        )
                    |> List.head
        in
        case signature of
            Nothing ->
                missing defaultRows (columns - 1)
                    |> List.map ((::) Wild)

            Just Unknown ->
                missing defaultRows (columns - 1)
                    |> List.map ((::) Wild)

            Just (Finite ctors) ->
                ctors
                    |> List.concatMap
                        (\ctor ->
                            missing (specialize ctor rows) (ctor.arity + columns - 1)
                                |> List.map
                                    (\vector ->
                                        Con (Finite ctors) ctor (List.take ctor.arity vector)
                                            :: List.drop ctor.arity vector
                                    )
                        )


specialize : Ctor -> List (List Pat) -> List (List Pat)
specialize ctor rows =
    rows
        |> List.filterMap
            (\row ->
                case row of
                    (Con _ rowCtor args) :: rest ->
                        if rowCtor.name == ctor.name then
                            Just (args ++ rest)

                        else
                            Nothing

                    Wild :: rest ->
                        Just (List.repeat ctor.arity Wild ++ rest)

                    _ ->
                        Nothing
            )


render : Bool -> Pat -> String
render nested pat =
    let
        parenthesize : String -> String
        parenthesize text =
            if nested then
                "(" ++ text ++ ")"

            else
                text
    in
    case pat of
        Wild ->
            "_"

        Lit ->
            "_"

        Con _ ctor args ->
            case ( ctor.name, args ) of
                ( "(,)", _ ) ->
                    "( " ++ (args |> List.map (render False) |> String.join ", ") ++ " )"

                ( "::", [ headPat, tailPat ] ) ->
                    parenthesize (render True headPat ++ " :: " ++ render True tailPat)

                ( _, [] ) ->
                    ctor.name

                _ ->
                    parenthesize (ctor.name ++ " " ++ (args |> List.map (render True) |> String.join " "))
