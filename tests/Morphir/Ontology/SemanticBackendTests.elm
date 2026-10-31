module Morphir.Ontology.SemanticBackendTests exposing (..)

import Dict
import Expect
import Morphir.Graph.SemanticBackend as SemanticBackend
import Morphir.IR.AccessControlled exposing (public)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Name as Name
import Morphir.IR.Path as Path
import Morphir.IR.Type as Type
import Morphir.IR.Value as Value
import Morphir.Ontology.RDF as RDF
import Test exposing (Test, describe, test)


pkg : Path.Path
pkg =
    Path.fromString "Morphir.Dapr"


sdk : Path.Path
sdk =
    [ [ "morphir" ], [ "sdk" ] ]


moduleName : Path.Path
moduleName =
    Path.fromString "Input.Example"


ref : String -> Type.Type ()
ref name =
    Type.Reference () ( pkg, moduleName, Name.fromString name ) []


distro : Distribution
distro =
    let
        types =
            Dict.fromList
                [ ( Name.fromString "price"
                  , public { doc = "Amount \"quoted\"", value = Type.TypeAliasDefinition [] (Type.Reference () ( [ [ "morphir" ], [ "sdk" ] ], [ [ "basics" ] ], Name.fromString "float" ) []) }
                  )
                , ( Name.fromString "deal"
                  , public { doc = "", value = Type.TypeAliasDefinition [] (Type.Record () [ { name = Name.fromString "price", tpe = ref "price" } ]) }
                  )
                , ( Name.fromString "deal cmd"
                  , public
                        { doc = ""
                        , value = Type.CustomTypeDefinition [] (public (Dict.fromList [ ( Name.fromString "close deal", [ ( Name.fromString "id", ref "price" ) ] ) ]))
                        }
                  )
                ]

        values =
            Dict.fromList
                [ ( Name.fromString "logic"
                  , public
                        { doc = "Decides whether to accept."
                        , value =
                            { inputTypes = [ ( Name.fromString "deal", ref "deal", ref "deal" ) ]
                            , outputType = ref "deal cmd"
                            , body =
                                Value.Apply (Type.Unit ())
                                    (Value.Reference (Type.Unit ()) ( pkg, moduleName, Name.fromString "helper" ))
                                    (Value.PatternMatch (Type.Unit ())
                                        (Value.Variable (Type.Unit ()) (Name.fromString "deal"))
                                        [ ( Value.ConstructorPattern (Type.Unit ()) ( pkg, moduleName, Name.fromString "close deal" ) [ Value.WildcardPattern (Type.Unit ()) ]
                                          , Value.Apply (Type.Unit ()) (Value.Constructor (Type.Unit ()) ( sdk, [ Name.fromString "maybe" ], Name.fromString "just" )) (Value.Unit (Type.Unit ()))
                                          )
                                        ]
                                    )
                            }
                        }
                  )
                ]
    in
    Distribution.Library pkg
        (Dict.fromList
            [ ( sdk
              , { modules =
                    Dict.fromList
                        [ ( [ Name.fromString "maybe" ]
                          , { types = Dict.fromList [ ( Name.fromString "maybe", { doc = "", value = Type.CustomTypeSpecification [ Name.fromString "a" ] (Dict.fromList [ ( Name.fromString "just", [ ( Name.fromString "arg 1", Type.Variable () (Name.fromString "a") ) ] ) ]) } ) ]
                            , values = Dict.empty
                            , doc = Nothing
                            }
                          )
                        ]
                }
              )
            ]
        )
        { modules = Dict.fromList [ ( moduleName, public { types = types, values = values, doc = Nothing } ) ] }


output : String
output =
    Dict.get ( [], "ontology.ttl" ) (SemanticBackend.mapDistribution {} distro)
        |> Maybe.withDefault ""


expectContains : String -> Test
expectContains fragment =
    test ("contains " ++ fragment) <|
        \_ -> output |> String.contains fragment |> Expect.equal True


expectYaml : String -> Test
expectYaml fragment =
    test ("yaml contains " ++ fragment) <|
        \_ ->
            Dict.get ( [], "Morphir.Dapr.ontology.yaml" ) (SemanticBackend.mapDistribution {} distro)
                |> Maybe.withDefault ""
                |> String.contains fragment
                |> Expect.equal True


suite : Test
suite =
    describe "SemanticBackend"
        [ describe "ontology.ttl"
            [ expectContains "rdf:type owl:Class"
            , expectContains "rdfs:domain <urn:morphir:Morphir.Dapr/Input.Example/Deal>"
            , expectContains "rdfs:range <urn:morphir:Morphir.Dapr/Input.Example/Price>"
            , expectContains "skos:definition \"Amount \\\"quoted\\\"\""
            , expectContains "rdf:type fno:Function"
            , expectContains "morphir:calls <urn:morphir:Morphir.Dapr/Input.Example/helper>"
            , expectContains "fno:expects <urn:morphir:Morphir.Dapr/Input.Example/logic/deal>"
            , expectContains "fno:type <urn:morphir:Morphir.Dapr/Input.Example/Deal>"
            , expectContains "fno:returns <urn:morphir:Morphir.Dapr/Input.Example/logic/result>"
            , expectContains "fno:type <urn:morphir:Morphir.Dapr/Input.Example/DealCmd>"
            , expectContains "rdfs:subClassOf <urn:morphir:Morphir.Dapr/Input.Example/DealCmd>"
            , expectContains "morphir:matches <urn:morphir:Morphir.Dapr/Input.Example/DealCmd/CloseDeal>"
            , expectContains "morphir:constructs <urn:morphir:Morphir.Sdk/Maybe/Maybe/Just>"
            , expectContains "<urn:morphir:Morphir.Sdk/Maybe/Maybe/Just>\n    rdf:type owl:Class"
            , expectContains "skos:narrower <urn:morphir:Morphir.Dapr/Input.Example/DealCmd/CloseDeal>"
            , expectContains "<urn:morphir:Morphir.Sdk/Basics/Float>\n    rdf:type owl:Class"
            ]
        , test "vocabulary.ttl declares the extension on top of the standards" <|
            \_ ->
                Dict.get ( [], "vocabulary.ttl" ) (SemanticBackend.mapDistribution {} distro)
                    |> Maybe.withDefault ""
                    |> String.contains "morphir:calls\n"
                    |> Expect.equal True
        , describe "RDF.toTurtle"
            [ test "escapes literals and removes duplicates" <|
                \_ ->
                    let
                        triple =
                            ( RDF.iri "http://x/a", RDF.curie "skos" "prefLabel", RDF.text "a \"b\"\nc" )
                    in
                    RDF.toTurtle [] [ triple, triple ]
                        |> Expect.equal "\n\n<http://x/a>\n    skos:prefLabel \"a \\\"b\\\"\\nc\" .\n"
            ]
        , test "links.json lists every element" <|
            \_ ->
                Dict.get ( [], "links.json" ) (SemanticBackend.mapDistribution {} distro)
                    |> Maybe.withDefault ""
                    |> String.contains "\"kind\": \"Function\""
                    |> Expect.equal True
        , describe "OSSIE ontology"
            [ expectYaml "- concept: \"Price\""
            , expectYaml "extends:\n      - \"Float\""
            , expectYaml "- concept: \"Deal\"\n    type: \"EntityType\""
            , expectYaml "multiplicity: \"ManyToOne\""
            , expectYaml "iri: \"urn:morphir:Morphir.Dapr/Input.Example/Deal/price\""
            , expectYaml "- concept: \"CloseDeal\"\n    type: \"EntityType\"\n    extends:\n      - \"DealCmd\""
            , test "links.json carries the OSSIE id" <|
                \_ ->
                    Dict.get ( [], "links.json" ) (SemanticBackend.mapDistribution {} distro)
                        |> Maybe.withDefault ""
                        |> String.contains "\"ossie\": \"Deal.price\""
                        |> Expect.equal True
            ]
        ]
