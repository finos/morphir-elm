module Morphir.Ontology.OSSIE exposing (Ontology, project)

{-| Projects the data-shaped part of a Morphir model (type aliases, records and custom types) as an Apache OSSIE
ontology document (spec version 0.2.0.dev0), so that OSSIE tooling and catalogs such as DataHub can work with it.

Every concept and relationship carries the same `iri` as in `ontology.ttl`, which is what links the two. Functions are
not projected: OSSIE derives concepts with SQL expressions, which Morphir logic cannot be reduced to, so calculations
and their dependencies live in `ontology.ttl` only.

@docs Ontology, project

-}

import Dict exposing (Dict)
import Json.Encode as Encode
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Path as Path
import Morphir.IR.Type as Type exposing (Type)
import Morphir.Ontology.IRI as IRI


{-| The YAML document plus, for every projected element, the OSSIE identifier (`Concept` or `Concept.relationship`)
keyed by the element's IRI.
-}
type alias Ontology =
    { yaml : String
    , ids : Dict String String
    }


type ConceptType
    = EntityType
    | ValueType


type Shape
    = Alias (Type ())
    | Record (List (Type.Field ()))
    | Custom (List ( Name, List ( Name, Type () ) ))


type alias Declaration =
    { fqn : FQName
    , doc : String
    , shape : Shape
    }


type alias Concept =
    { name : String
    , iri : String
    , conceptType : ConceptType
    , doc : String
    , extends : List String
    , relationships : List Relationship
    }


type alias Relationship =
    { name : String
    , iri : Maybe String
    , target : String
    , role : Maybe String
    , manyToOne : Bool
    , words : String
    }


type Yaml
    = Str String
    | Seq (List Yaml)
    | Map (List ( String, Yaml ))


project : Distribution -> Ontology
project distro =
    case distro of
        Distribution.Library pkg _ def ->
            let
                declarations =
                    def.modules
                        |> Dict.toList
                        |> List.concatMap
                            (\( modulePath, m ) ->
                                m.value.types
                                    |> Dict.toList
                                    |> List.filterMap (\( name, t ) -> declaration ( pkg, modulePath, name ) t.value)
                            )

                declared =
                    declarations |> List.map (\d -> ( d.fqn, d )) |> Dict.fromList

                names =
                    conceptNames declarations

                concepts =
                    declarations |> List.concatMap (concepts_ declared names)

                ids =
                    concepts
                        |> List.concatMap
                            (\c ->
                                ( c.iri, c.name )
                                    :: List.filterMap (\r -> r.iri |> Maybe.map (\iri -> ( iri, c.name ++ "." ++ r.name ))) c.relationships
                            )
                        |> Dict.fromList

                pkgName =
                    Path.toString Name.toTitleCase "." pkg
            in
            { yaml =
                render
                    (Map
                        [ ( "version", Str "0.2.0.dev0" )
                        , ( "name", Str pkgName )
                        , ( "description", Str ("Lower ontology of the " ++ pkgName ++ " Morphir model: its types as business concepts. Functions and their dependencies are in ontology.ttl.") )
                        , ( "ontology", Seq (List.map conceptYaml concepts) )
                        ]
                    )
            , ids = ids
            }


declaration : FQName -> { a | doc : String, value : Type.Definition () } -> Maybe Declaration
declaration fqn documented =
    case documented.value of
        Type.TypeAliasDefinition _ (Type.Record _ fields) ->
            Just (Declaration fqn documented.doc (Record fields))

        Type.TypeAliasDefinition _ target ->
            Just (Declaration fqn documented.doc (Alias target))

        Type.CustomTypeDefinition _ ctors ->
            Just (Declaration fqn documented.doc (Custom (Dict.toList ctors.value)))


{-| Concept names must be unique, so a name used more than once (across modules, or by a constructor and a type) is
qualified.
-}
conceptNames : List Declaration -> Dict String String
conceptNames declarations =
    let
        candidates =
            declarations
                |> List.concatMap
                    (\d ->
                        let
                            ( _, modulePath, name ) =
                                d.fqn

                            qualify parts =
                                String.join "_" (List.map Name.toTitleCase (modulePath ++ parts))
                        in
                        ( IRI.iriString (IRI.typeIRI d.fqn), Name.toTitleCase name, qualify [ name ] )
                            :: (case d.shape of
                                    Custom ctors ->
                                        if isEnum ctors then
                                            []

                                        else
                                            ctors
                                                |> List.map
                                                    (\( ctorName, _ ) ->
                                                        ( IRI.iriString (IRI.constructorIRI d.fqn ctorName), Name.toTitleCase ctorName, qualify [ name, ctorName ] )
                                                    )

                                    _ ->
                                        []
                               )
                    )

        counts =
            candidates
                |> List.foldl (\( _, simple, _ ) -> Dict.update simple (\n -> Just (Maybe.withDefault 0 n + 1))) Dict.empty
    in
    candidates
        |> List.map
            (\( key, simple, qualified ) ->
                if Dict.get simple counts |> Maybe.withDefault 0 |> (\n -> n > 1) then
                    ( key, qualified )

                else
                    ( key, simple )
            )
        |> Dict.fromList


isEnum : List ( Name, List a ) -> Bool
isEnum ctors =
    not (List.isEmpty ctors) && List.all (Tuple.second >> List.isEmpty) ctors


builtin : Name -> Maybe String
builtin name =
    case Name.toTitleCase name of
        "String" ->
            Just "String"

        "Int" ->
            Just "Integer"

        "Float" ->
            Just "Float"

        "Bool" ->
            Just "Boolean"

        "Decimal" ->
            Just "Decimal"

        "LocalDate" ->
            Just "Date"

        "Instant" ->
            Just "DateTime"

        _ ->
            Nothing


conceptOf : Dict FQName Declaration -> Dict String String -> FQName -> Maybe String
conceptOf declared names fqn =
    case Dict.get fqn declared of
        Just _ ->
            Dict.get (IRI.iriString (IRI.typeIRI fqn)) names

        Nothing ->
            let
                ( _, _, name ) =
                    fqn
            in
            builtin name


{-| Whether a type's concept is an entity or a value type. An alias takes the kind of what it aliases.
-}
kindOf : Dict FQName Declaration -> Int -> FQName -> Maybe ConceptType
kindOf declared depth fqn =
    case Dict.get fqn declared of
        Just d ->
            case d.shape of
                Record _ ->
                    Just EntityType

                Custom ctors ->
                    Just
                        (if isEnum ctors then
                            ValueType

                         else
                            EntityType
                        )

                Alias (Type.Reference _ target _) ->
                    if depth > 8 then
                        Nothing

                    else
                        kindOf declared (depth + 1) target

                Alias _ ->
                    Nothing

        Nothing ->
            let
                ( _, _, name ) =
                    fqn
            in
            builtin name |> Maybe.map (\_ -> ValueType)


concepts_ : Dict FQName Declaration -> Dict String String -> Declaration -> List Concept
concepts_ declared names d =
    let
        typeKey =
            IRI.iriString (IRI.typeIRI d.fqn)

        name =
            Dict.get typeKey names |> Maybe.withDefault ""

        resolve =
            conceptOf declared names

        relationship owner iriOf ( relName, tpe ) =
            relationshipOf resolve owner (iriOf relName) relName tpe
    in
    case d.shape of
        Record fields ->
            [ Concept name typeKey EntityType d.doc [] (fields |> List.filterMap (\f -> relationship name (\n -> Just (IRI.iriString (IRI.fieldIRI d.fqn n))) ( f.name, f.tpe ))) ]

        Alias (Type.Reference _ target _) ->
            case ( kindOf declared 0 target, resolve target ) of
                ( Just kind, Just parent ) ->
                    [ Concept name typeKey kind d.doc [ parent ] [] ]

                _ ->
                    []

        Alias _ ->
            []

        Custom ctors ->
            if isEnum ctors then
                let
                    values =
                        ctors |> List.map (Tuple.first >> Name.toTitleCase) |> String.join ", "
                in
                [ Concept name typeKey ValueType (String.trim (d.doc ++ "\n\nValues: " ++ values ++ ".")) [ "String" ] [] ]

            else
                Concept name typeKey EntityType d.doc [] []
                    :: (ctors
                            |> List.map
                                (\( ctorName, args ) ->
                                    let
                                        ctorKey =
                                            IRI.iriString (IRI.constructorIRI d.fqn ctorName)

                                        ctorConcept =
                                            Dict.get ctorKey names |> Maybe.withDefault ""
                                    in
                                    Concept ctorConcept ctorKey EntityType "" [ name ] (args |> List.filterMap (\( argName, tpe ) -> relationship ctorConcept (\_ -> Nothing) ( argName, tpe )))
                                )
                       )


{-| A field becomes a relationship from its owner to the field's type. Optional fields are many-to-one like required
ones, since an owner has at most one value; list fields have no multiplicity.
-}
relationshipOf : (FQName -> Maybe String) -> String -> Maybe String -> Name -> Type () -> Maybe Relationship
relationshipOf resolve owner iri relName tpe =
    let
        make target manyToOne =
            let
                role =
                    if target == owner then
                        Just (Name.toCamelCase relName)

                    else
                        Nothing
            in
            Relationship (Name.toCamelCase relName)
                iri
                target
                role
                manyToOne
                (String.join " " (Name.toHumanWords relName))
    in
    case tpe of
        Type.Reference _ ( _, _, name ) [ inner ] ->
            case ( Name.toTitleCase name, inner ) of
                ( "Maybe", Type.Reference _ innerFqn [] ) ->
                    resolve innerFqn |> Maybe.map (\target -> make target True)

                ( "List", Type.Reference _ innerFqn [] ) ->
                    resolve innerFqn |> Maybe.map (\target -> make target False)

                _ ->
                    Nothing

        Type.Reference _ fqn [] ->
            resolve fqn |> Maybe.map (\target -> make target True)

        _ ->
            Nothing


conceptYaml : Concept -> Yaml
conceptYaml c =
    Map
        ([ ( "concept", Str c.name )
         , ( "type"
           , Str
                (case c.conceptType of
                    EntityType ->
                        "EntityType"

                    ValueType ->
                        "ValueType"
                )
           )
         ]
            ++ optional "description" (Str (String.trim c.doc)) (not (String.isEmpty (String.trim c.doc)))
            ++ optional "extends" (Seq (List.map Str c.extends)) (not (List.isEmpty c.extends))
            ++ [ ( "iri", Str c.iri ) ]
            ++ optional "relationships" (Seq (List.map (relationshipYaml c.name) c.relationships)) (not (List.isEmpty c.relationships))
        )


relationshipYaml : String -> Relationship -> Yaml
relationshipYaml owner r =
    let
        targetRef =
            case r.role of
                Just role ->
                    r.target ++ ":" ++ role

                Nothing ->
                    r.target
    in
    Map
        ([ ( "name", Str r.name )
         , ( "roles", Seq [ Map (( "concept", Str r.target ) :: optional "name" (Str (Maybe.withDefault "" r.role)) (r.role /= Nothing)) ] )
         ]
            ++ optional "multiplicity" (Str "ManyToOne") r.manyToOne
            ++ [ ( "verbalizes", Seq [ Str ("{" ++ owner ++ "} has {" ++ targetRef ++ "} as " ++ r.words) ] ) ]
            ++ (r.iri |> Maybe.map (\iri -> [ ( "iri", Str iri ) ]) |> Maybe.withDefault [])
        )


optional : String -> Yaml -> Bool -> List ( String, Yaml )
optional key value present =
    if present then
        [ ( key, value ) ]

    else
        []


{-| A deliberately small YAML writer. Strings are always double-quoted with JSON escapes, which YAML accepts.
-}
render : Yaml -> String
render yaml =
    String.join "\n" (lines 0 yaml) ++ "\n"


lines : Int -> Yaml -> List String
lines indent yaml =
    let
        pad =
            String.repeat indent " "
    in
    case yaml of
        Str value ->
            [ pad ++ quote value ]

        Seq items ->
            items
                |> List.concatMap
                    (\item ->
                        case item of
                            Str value ->
                                [ pad ++ "- " ++ quote value ]

                            _ ->
                                case lines (indent + 2) item of
                                    first :: rest ->
                                        (pad ++ "- " ++ String.dropLeft (indent + 2) first) :: rest

                                    [] ->
                                        []
                    )

        Map pairs ->
            pairs
                |> List.concatMap
                    (\( key, value ) ->
                        case value of
                            Str text ->
                                [ pad ++ key ++ ": " ++ quote text ]

                            Seq [] ->
                                [ pad ++ key ++ ": []" ]

                            _ ->
                                (pad ++ key ++ ":") :: lines (indent + 2) value
                    )


quote : String -> String
quote value =
    Encode.encode 0 (Encode.string value)
