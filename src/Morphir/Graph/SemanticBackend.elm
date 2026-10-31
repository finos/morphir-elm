{-
   Copyright 2020 Morgan Stanley

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


module Morphir.Graph.SemanticBackend exposing (mapDistribution, project, vocabulary, Element)

{-| Projects a Morphir distribution as a lower ontology: SKOS concepts for the business terms (modules, types, fields,
constructors and functions) plus `morphir:` properties that record structure and dependencies. Every element gets an
IRI derived from its fully-qualified name, which is the stable key for mapping to upper ontologies and for linking
other artifacts (e.g. semantic-layer models or catalog entries).

IRIs are minted as `urn:morphir:<Package>/<Module.Path>/<Name>`, where the package is the `name` from morphir.json.
Fields and constructors live under their type, and function parameters under their function.

@docs mapDistribution, project, vocabulary, Element

-}

import Dict
import Json.Encode as Encode
import Morphir.File.FileMap exposing (FileMap)
import Morphir.Graph.CypherBackend exposing (Options)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value
import Morphir.Ontology.IRI exposing (constructorIRI, fieldIRI, iriString, moduleIRI, packageIRI, typeIRI, valueIRI)
import Morphir.Ontology.OSSIE as OSSIE
import Morphir.Ontology.RDF as RDF exposing (Term, Triple)
import Set exposing (Set)


{-| An ontology element together with the identity needed to link it to other artifacts.
-}
type alias Element =
    { iri : String
    , fqn : String
    , kind : String
    }


vocabularyNamespace : String
vocabularyNamespace =
    "https://morphir.finos.org/ontology#"


{-| Generates `ontology.ttl` (the projection), `vocabulary.ttl` (the `morphir:` terms), `<package>.ontology.yaml` (the
data-shaped part as an Apache OSSIE ontology) and `links.json` (the IRI, FQN and OSSIE id of every element, so other
tools can connect to it later).
-}
mapDistribution : Options -> Distribution -> FileMap
mapDistribution _ distro =
    let
        ( triples, elements ) =
            project distro

        ossie =
            OSSIE.project distro
    in
    Dict.fromList
        [ ( ( [], "ontology.ttl" ), RDF.toTurtle prefixes triples )
        , ( ( [], "vocabulary.ttl" ), RDF.toTurtle prefixes vocabulary )
        , ( ( [], packageName distro ++ ".ontology.yaml" ), ossie.yaml )
        , ( ( [], "links.json" ), Encode.encode 2 (encodeLinks distro ossie.ids elements) )
        ]


prefixes : List RDF.Prefix
prefixes =
    [ ( "rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#" )
    , ( "rdfs", "http://www.w3.org/2000/01/rdf-schema#" )
    , ( "owl", "http://www.w3.org/2002/07/owl#" )
    , ( "skos", "http://www.w3.org/2004/02/skos/core#" )
    , ( "dcterms", "http://purl.org/dc/terms/" )
    , ( "prov", "http://www.w3.org/ns/prov#" )
    , ( "xsd", "http://www.w3.org/2001/XMLSchema#" )
    , ( "fno", "https://w3id.org/function/ontology#" )
    , ( "morphir", vocabularyNamespace )
    ]


encodeLinks : Distribution -> Dict.Dict String String -> List Element -> Encode.Value
encodeLinks distro ossieIds elements =
    Encode.object
        [ ( "package", Encode.string (packageName distro) )
        , ( "elements"
          , Encode.list
                (\e ->
                    Encode.object
                        ([ ( "iri", Encode.string e.iri )
                         , ( "fqn", Encode.string e.fqn )
                         , ( "kind", Encode.string e.kind )
                         ]
                            ++ (Dict.get e.iri ossieIds |> Maybe.map (\id -> [ ( "ossie", Encode.string id ) ]) |> Maybe.withDefault [])
                        )
                )
                elements
          )
        ]


packageName : Distribution -> String
packageName distro =
    Path.toString Name.toTitleCase "." (Distribution.lookupPackageName distro)


{-| Project the distribution into triples and the list of elements they describe.
-}
project : Distribution -> ( List Triple, List Element )
project distro =
    case distro of
        Distribution.Library pkg dependencies def ->
            let
                owners =
                    constructorOwners pkg dependencies def

                scheme =
                    packageIRI pkg

                packageTriples =
                    [ ( scheme, RDF.a, sk "ConceptScheme" )
                    , ( scheme, RDF.a, RDF.curie "owl" "Ontology" )
                    , ( scheme, sk "prefLabel", RDF.text (packageName distro) )
                    , ( scheme, RDF.curie "rdfs" "label", RDF.text (packageName distro) )
                    , ( scheme, RDF.curie "owl" "imports", vocabularyIRI )
                    ]

                allTriples =
                    packageTriples ++ List.concatMap Tuple.first moduleResults

                moduleResults =
                    def.modules
                        |> Dict.toList
                        |> List.map (\( moduleName, m ) -> projectModule owners pkg moduleName m.value)
            in
            ( declareExternals allTriples ++ allTriples
            , Element (iriString scheme) (packageName distro) "Package"
                :: List.concatMap Tuple.second moduleResults
            )


projectModule : ConstructorOwners -> PackageName -> Path -> Module.Definition ta va -> ( List Triple, List Element )
projectModule owners pkg moduleName def =
    let
        moduleFqn =
            moduleFQName pkg moduleName

        moduleTerm =
            moduleIRI moduleFqn

        parentTriples =
            case List.take (List.length moduleName - 1) moduleName of
                [] ->
                    [ ( moduleTerm, sk "topConceptOf", packageIRI pkg ) ]

                parent ->
                    [ ( moduleTerm, sk "broader", moduleIRI (moduleFQName pkg parent) ) ]

        moduleTriples =
            concept moduleTerm (Name.toHumanWords (lastName moduleName)) (def.doc |> Maybe.withDefault "") (packageIRI pkg)
                ++ parentTriples

        typeResults =
            def.types
                |> Dict.toList
                |> List.map (\( name, t ) -> projectType pkg moduleName moduleTerm name t.value)

        valueResults =
            def.values
                |> Dict.toList
                |> List.map (\( name, v ) -> projectValue owners pkg moduleName moduleTerm name v.value)
    in
    ( moduleTriples ++ List.concatMap Tuple.first typeResults ++ List.concatMap Tuple.first valueResults
    , Element (iriString moduleTerm) (FQName.toString moduleFqn) "Module"
        :: List.concatMap Tuple.second typeResults
        ++ List.concatMap Tuple.second valueResults
    )


{-| Records, aliases and custom types are both SKOS concepts (business meaning) and OWL classes (structure).
-}
projectType : PackageName -> Path -> Term -> Name -> Documented (Type.Definition ta) -> ( List Triple, List Element )
projectType pkg moduleName moduleTerm name documented =
    let
        fqn =
            ( pkg, moduleName, name )

        term =
            typeIRI fqn

        base =
            concept term (Name.toHumanWords name) documented.doc (packageIRI pkg)
                ++ [ ( term, RDF.a, owl "Class" )
                   , ( term, sk "broader", moduleTerm )
                   , ( term, dcId, RDF.text (typeId fqn) )
                   ]
    in
    case documented.value of
        Type.TypeAliasDefinition _ (Type.Record _ fields) ->
            let
                fieldResults =
                    fields |> List.map (projectField pkg fqn term)
            in
            ( base ++ List.concatMap Tuple.first fieldResults
            , Element (iriString term) (typeId fqn) "Record" :: List.map Tuple.second fieldResults
            )

        Type.TypeAliasDefinition _ target ->
            ( base ++ typeTriples term (rdfs "subClassOf") target
            , [ Element (iriString term) (typeId fqn) "TypeAlias" ]
            )

        Type.CustomTypeDefinition _ constructors ->
            let
                constructorResults =
                    constructors.value
                        |> Dict.toList
                        |> List.map
                            (\( ctorName, args ) ->
                                let
                                    ctorFqn =
                                        ( pkg, moduleName, ctorName )

                                    ctorTerm =
                                        constructorIRI fqn ctorName
                                in
                                ( concept ctorTerm (Name.toHumanWords ctorName) "" (packageIRI pkg)
                                    ++ [ ( ctorTerm, RDF.a, owl "Class" )
                                       , ( ctorTerm, rdfs "subClassOf", term )
                                       , ( ctorTerm, sk "broader", term )
                                       , ( term, sk "narrower", ctorTerm )
                                       , ( ctorTerm, dcId, RDF.text (typeId ctorFqn) )
                                       ]
                                    ++ List.concatMap (\( _, argType ) -> typeTriples ctorTerm (mo "argumentType") argType) args
                                , Element (iriString ctorTerm) (typeId ctorFqn) "Constructor"
                                )
                            )
            in
            ( base ++ List.concatMap Tuple.first constructorResults
            , Element (iriString term) (typeId fqn) "CustomType" :: List.map Tuple.second constructorResults
            )


{-| A field is an OWL property whose domain is the record and whose range is the field's type.
-}
projectField : PackageName -> FQName -> Term -> Type.Field ta -> ( List Triple, Element )
projectField pkg ownerFqn ownerTerm field =
    let
        term =
            fieldIRI ownerFqn field.name

        identifier =
            typeId ownerFqn ++ "#" ++ Name.toCamelCase field.name
    in
    ( concept term (Name.toHumanWords field.name) "" (packageIRI pkg)
        ++ [ ( term, RDF.a, owl "ObjectProperty" )
           , ( term, rdfs "domain", ownerTerm )
           , ( term, sk "broader", ownerTerm )
           , ( term, dcId, RDF.text identifier )
           ]
        ++ typeTriples term (rdfs "range") field.tpe
    , Element (iriString term) identifier "Field"
    )


{-| A value is a Function Ontology function. Its parameters and result are described with `fno:expects` and
`fno:returns`, and the functions it invokes are recorded with `morphir:calls` (a kind of `prov:wasDerivedFrom`).
-}
projectValue : ConstructorOwners -> PackageName -> Path -> Term -> Name -> Documented (Value.Definition ta va) -> ( List Triple, List Element )
projectValue owners pkg moduleName moduleTerm name documented =
    let
        fqn =
            ( pkg, moduleName, name )

        term =
            valueIRI fqn

        def =
            documented.value

        parameterTriples =
            def.inputTypes
                |> List.indexedMap
                    (\index ( paramName, _, tpe ) ->
                        let
                            param =
                                RDF.iri (iriString term ++ "/" ++ Name.toCamelCase paramName)
                        in
                        [ ( term, fno "expects", param )
                        , ( param, RDF.a, fno "Parameter" )
                        , ( param, sk "prefLabel", RDF.text (String.join " " (Name.toHumanWords paramName)) )
                        , ( param, mo "parameterIndex", RDF.typed "http://www.w3.org/2001/XMLSchema#integer" (String.fromInt index) )
                        ]
                            ++ typeTriples param (fno "type") tpe
                    )
                |> List.concat

        output =
            RDF.iri (iriString term ++ "/result")
    in
    ( concept term (Name.toHumanWords name) documented.doc (packageIRI pkg)
        ++ [ ( term, RDF.a, fno "Function" )
           , ( term, sk "broader", moduleTerm )
           , ( term, dcId, RDF.text (FQName.toString fqn) )
           , ( term, fno "returns", output )
           , ( output, RDF.a, fno "Output" )
           ]
        ++ typeTriples output (fno "type") def.outputType
        ++ parameterTriples
        ++ dependencyTriples owners term (collectDependencies def.body)
    , [ Element (iriString term) (FQName.toString fqn) "Function" ]
    )


{-| Maps each constructor to the custom type that owns it, across this package and its dependencies.
-}
type alias ConstructorOwners =
    Dict.Dict FQName FQName


constructorOwners : PackageName -> Dict.Dict PackageName (Package.Specification ()) -> Package.Definition ta va -> ConstructorOwners
constructorOwners pkg dependencies def =
    let
        owned owner ctors =
            ctors |> Dict.keys |> List.map (\ctorName -> ( ( (\( a, _, _ ) -> a) owner, (\( _, b, _ ) -> b) owner, ctorName ), owner ))

        local =
            def.modules
                |> Dict.toList
                |> List.concatMap
                    (\( modulePath, m ) ->
                        m.value.types
                            |> Dict.toList
                            |> List.concatMap
                                (\( typeName, t ) ->
                                    case t.value.value of
                                        Type.CustomTypeDefinition _ ctors ->
                                            owned ( pkg, modulePath, typeName ) ctors.value

                                        _ ->
                                            []
                                )
                    )

        external =
            dependencies
                |> Dict.toList
                |> List.concatMap
                    (\( depPkg, spec ) ->
                        spec.modules
                            |> Dict.toList
                            |> List.concatMap
                                (\( modulePath, m ) ->
                                    m.types
                                        |> Dict.toList
                                        |> List.concatMap
                                            (\( typeName, t ) ->
                                                case t.value of
                                                    Type.CustomTypeSpecification _ ctors ->
                                                        owned ( depPkg, modulePath, typeName ) ctors

                                                    _ ->
                                                        []
                                            )
                                )
                    )
    in
    Dict.fromList (external ++ local)


type alias Dependencies =
    { calls : Set FQName
    , constructs : Set FQName
    , matches : Set FQName
    }


{-| Everything a function body depends on: the functions it calls, the constructors it builds and the constructors it
matches against.
-}
collectDependencies : Value.Value ta va -> Dependencies
collectDependencies value =
    let
        none =
            Dependencies Set.empty Set.empty Set.empty

        union a b =
            Dependencies (Set.union a.calls b.calls) (Set.union a.constructs b.constructs) (Set.union a.matches b.matches)

        all =
            List.foldl union none

        ofDefinition def =
            collectDependencies def.body
    in
    case value of
        Value.Reference _ fqn ->
            { none | calls = Set.singleton fqn }

        Value.Constructor _ fqn ->
            { none | constructs = Set.singleton fqn }

        Value.Tuple _ items ->
            all (List.map collectDependencies items)

        Value.List _ items ->
            all (List.map collectDependencies items)

        Value.Record _ fields ->
            all (List.map collectDependencies (Dict.values fields))

        Value.Field _ subject _ ->
            collectDependencies subject

        Value.Apply _ function argument ->
            all [ collectDependencies function, collectDependencies argument ]

        Value.Lambda _ pattern body ->
            all [ patternDependencies pattern, collectDependencies body ]

        Value.LetDefinition _ _ def inValue ->
            all [ ofDefinition def, collectDependencies inValue ]

        Value.LetRecursion _ defs inValue ->
            all (collectDependencies inValue :: List.map ofDefinition (Dict.values defs))

        Value.Destructure _ pattern subject inValue ->
            all [ patternDependencies pattern, collectDependencies subject, collectDependencies inValue ]

        Value.IfThenElse _ condition thenBranch elseBranch ->
            all (List.map collectDependencies [ condition, thenBranch, elseBranch ])

        Value.PatternMatch _ subject cases ->
            all (collectDependencies subject :: List.concatMap (\( pattern, body ) -> [ patternDependencies pattern, collectDependencies body ]) cases)

        Value.UpdateRecord _ subject fields ->
            all (collectDependencies subject :: List.map collectDependencies (Dict.values fields))

        _ ->
            none


patternDependencies : Value.Pattern va -> Dependencies
patternDependencies pattern =
    let
        none =
            Dependencies Set.empty Set.empty Set.empty

        union a b =
            Dependencies (Set.union a.calls b.calls) (Set.union a.constructs b.constructs) (Set.union a.matches b.matches)

        all =
            List.foldl union none
    in
    case pattern of
        Value.ConstructorPattern _ fqn args ->
            union { none | matches = Set.singleton fqn } (all (List.map patternDependencies args))

        Value.AsPattern _ inner _ ->
            patternDependencies inner

        Value.TuplePattern _ items ->
            all (List.map patternDependencies items)

        Value.HeadTailPattern _ head tail ->
            all [ patternDependencies head, patternDependencies tail ]

        _ ->
            none


dependencyTriples : ConstructorOwners -> Term -> Dependencies -> List Triple
dependencyTriples owners term deps =
    let
        constructorTerm fqn =
            case Dict.get fqn owners of
                Just owner ->
                    [ constructorIRI owner (FQName.getLocalName fqn) ]

                Nothing ->
                    []
    in
    (deps.calls |> Set.toList |> List.map (\ref -> ( term, mo "calls", valueIRI ref )))
        ++ (deps.constructs |> Set.toList |> List.concatMap constructorTerm |> List.map (\ref -> ( term, mo "constructs", ref )))
        ++ (deps.matches |> Set.toList |> List.concatMap constructorTerm |> List.map (\ref -> ( term, mo "matches", ref )))


{-| Relates a subject to a type: the head type through `predicate`, and any type arguments (e.g. the `Deal` in
`Maybe Deal`) through `morphir:typeArgument`.
-}
typeTriples : Term -> Term -> Type ta -> List Triple
typeTriples subject predicate tpe =
    case tpe of
        Type.Reference _ fqn args ->
            ( subject, predicate, typeIRI fqn )
                :: (args
                        |> List.map Type.collectReferences
                        |> List.foldl Set.union Set.empty
                        |> Set.toList
                        |> List.map (\ref -> ( subject, mo "typeArgument", typeIRI ref ))
                   )

        _ ->
            Type.collectReferences tpe
                |> Set.toList
                |> List.map (\ref -> ( subject, mo "typeArgument", typeIRI ref ))


{-| Declares everything the projection refers to but does not define (e.g. SDK types and functions), so the ontology
has no dangling references.
-}
declareExternals : List Triple -> List Triple
declareExternals triples =
    let
        defined =
            triples |> List.map (\( s, _, _ ) -> s) |> List.foldl (\t -> Set.insert (iriString t)) Set.empty

        external ( _, predicate, object ) =
            let
                iriValue =
                    iriString object
            in
            if iriValue == "" || Set.member iriValue defined then
                []

            else if predicate == mo "calls" then
                [ ( object, RDF.a, fno "Function" ), ( object, rdfs "isDefinedBy", RDF.iri (externalPackage iriValue) ) ]

            else if List.member predicate [ mo "constructs", mo "matches" ] then
                [ ( object, RDF.a, owl "Class" )
                , ( object, rdfs "subClassOf", RDF.iri (parentIRI iriValue) )
                , ( object, rdfs "isDefinedBy", RDF.iri (externalPackage iriValue) )
                ]

            else if List.member predicate [ rdfs "range", rdfs "subClassOf", fno "type", mo "argumentType", mo "typeArgument" ] then
                [ ( object, RDF.a, owl "Class" ), ( object, rdfs "isDefinedBy", RDF.iri (externalPackage iriValue) ) ]

            else
                []
    in
    triples |> List.concatMap external


parentIRI : String -> String
parentIRI iriValue =
    iriValue |> String.split "/" |> List.reverse |> List.drop 1 |> List.reverse |> String.join "/"


externalPackage : String -> String
externalPackage iriValue =
    iriValue
        |> String.split "/"
        |> List.take 1
        |> String.join "/"


concept : Term -> List String -> String -> Term -> List Triple
concept term words doc scheme =
    [ ( term, RDF.a, sk "Concept" )
    , ( term, sk "prefLabel", RDF.text (String.join " " words) )
    , ( term, sk "inScheme", scheme )
    ]
        ++ (if String.isEmpty (String.trim doc) then
                []

            else
                [ ( term, sk "definition", RDF.text (String.trim doc) ) ]
           )


{-| The small `morphir:` extension. Business meaning is SKOS, structure is OWL, functions are FnO and lineage is
PROV-O. Only what those standards lack is declared here.
-}
vocabulary : List Triple
vocabulary =
    let
        objectProperty name comment domain range =
            [ ( mo name, RDF.a, owl "ObjectProperty" )
            , ( mo name, rdfs "comment", RDF.text comment )
            , ( mo name, rdfs "domain", domain )
            , ( mo name, rdfs "range", range )
            ]
    in
    [ ( vocabularyIRI, RDF.a, owl "Ontology" )
    , ( vocabularyIRI, rdfs "label", RDF.text "Morphir lower ontology vocabulary" )
    , ( vocabularyIRI, rdfs "comment", RDF.text "Extension of SKOS, OWL, the Function Ontology and PROV-O for projecting a Morphir model as a lower ontology." )
    , ( vocabularyIRI, owl "versionInfo", RDF.text "1" )
    , ( vocabularyIRI, owl "imports", RDF.iri "http://www.w3.org/2004/02/skos/core" )
    , ( vocabularyIRI, owl "imports", RDF.iri "https://w3id.org/function/ontology" )
    , ( vocabularyIRI, owl "imports", RDF.iri "http://www.w3.org/ns/prov#" )
    ]
        ++ objectProperty "dependsOn" "A function depends on the referenced element. A kind of derivation, so lineage tools can follow it." (fno "Function") (RDF.curie "rdfs" "Resource")
        ++ [ ( mo "dependsOn", rdfs "subPropertyOf", RDF.curie "prov" "wasDerivedFrom" ) ]
        ++ List.concatMap
            (\( name, comment, range ) ->
                objectProperty name comment (fno "Function") range
                    ++ [ ( mo name, rdfs "subPropertyOf", mo "dependsOn" ) ]
            )
            [ ( "calls", "A function invokes the referenced function.", fno "Function" )
            , ( "constructs", "A function builds a value with the referenced constructor.", owl "Class" )
            , ( "matches", "A function takes values apart by pattern matching on the referenced constructor.", owl "Class" )
            ]
        ++ objectProperty "argumentType" "The type of a constructor argument." (owl "Class") (owl "Class")
        ++ objectProperty "typeArgument" "A type used as an argument of the type of a field, parameter or result, e.g. Deal in Maybe Deal." (RDF.curie "rdfs" "Resource") (owl "Class")
        ++ [ ( mo "parameterIndex", RDF.a, owl "DatatypeProperty" )
           , ( mo "parameterIndex", rdfs "comment", RDF.text "Zero-based position of a parameter in its function." )
           , ( mo "parameterIndex", rdfs "domain", fno "Parameter" )
           , ( mo "parameterIndex", rdfs "range", RDF.curie "xsd" "integer" )
           ]


vocabularyIRI : Term
vocabularyIRI =
    RDF.iri (String.dropRight 1 vocabularyNamespace)


mo : String -> Term
mo =
    RDF.curie "morphir"


owl : String -> Term
owl =
    RDF.curie "owl"


rdfs : String -> Term
rdfs =
    RDF.curie "rdfs"


fno : String -> Term
fno =
    RDF.curie "fno"


sk : String -> Term
sk =
    RDF.curie "skos"


lastName : Path -> Name
lastName path =
    path |> List.reverse |> List.head |> Maybe.withDefault []


moduleFQName : PackageName -> Path -> FQName
moduleFQName pkg modulePath =
    ( pkg, List.take (List.length modulePath - 1) modulePath, lastName modulePath )


typeId : FQName -> String
typeId ( pkg, modulePath, localName ) =
    FQName.toString ( pkg, modulePath, [] ) |> String.dropRight 1 |> (\prefix -> prefix ++ ":" ++ Name.toTitleCase localName)


aliasedTypes : Type ta -> List FQName
aliasedTypes tpe =
    case tpe of
        Type.Reference _ fqn _ ->
            [ fqn ]

        _ ->
            Type.collectReferences tpe |> Set.toList


dcId : Term
dcId =
    RDF.curie "dcterms" "identifier"
