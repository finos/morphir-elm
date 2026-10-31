module Morphir.Ontology.RDF exposing
    ( Term(..), Triple, Prefix
    , iri, curie, text, typed, a
    , toTurtle
    )

{-| A minimal RDF model and Turtle serializer. Projections build triples; this module takes care of prefixes,
escaping and stable ordering.

@docs Term, Triple, Prefix
@docs iri, curie, text, typed, a
@docs toTurtle

-}

import Set


{-| An RDF term that can appear in a triple.
-}
type Term
    = Iri String
    | Curie String String
    | Literal String
    | Typed String String


{-| A subject, predicate, object statement.
-}
type alias Triple =
    ( Term, Term, Term )


{-| A prefix declaration: the label and the namespace IRI.
-}
type alias Prefix =
    ( String, String )


{-| Full IRI.
-}
iri : String -> Term
iri =
    Iri


{-| Prefixed name, e.g. `curie "skos" "Concept"`.
-}
curie : String -> String -> Term
curie =
    Curie


{-| Plain string literal.
-}
text : String -> Term
text =
    Literal


{-| Literal with a datatype IRI, e.g. an integer.
-}
typed : String -> String -> Term
typed =
    Typed


{-| The `rdf:type` predicate.
-}
a : Term
a =
    Curie "rdf" "type"


{-| Serialize triples as Turtle. Triples are de-duplicated and sorted so the output is stable. Triples sharing a subject
are grouped.
-}
toTurtle : List Prefix -> List Triple -> String
toTurtle prefixes triples =
    let
        header =
            prefixes
                |> List.map (\( label, ns ) -> "@prefix " ++ label ++ ": <" ++ escapeIri ns ++ "> .")
                |> String.join "\n"

        lines =
            triples
                |> List.map (\( s, p, o ) -> ( renderTerm s, renderTerm p, renderTerm o ))
                |> Set.fromList
                |> Set.toList
                |> groupBySubject
                |> List.map renderSubject
    in
    header ++ "\n\n" ++ String.join "\n\n" lines ++ "\n"


groupBySubject : List ( String, String, String ) -> List ( String, List ( String, String ) )
groupBySubject sorted =
    case sorted of
        [] ->
            []

        ( s, p, o ) :: rest ->
            let
                ( same, others ) =
                    List.partition (\( s2, _, _ ) -> s2 == s) rest
            in
            ( s, ( p, o ) :: List.map (\( _, p2, o2 ) -> ( p2, o2 )) same ) :: groupBySubject others


renderSubject : ( String, List ( String, String ) ) -> String
renderSubject ( subject, predicateObjects ) =
    subject
        ++ "\n    "
        ++ (predicateObjects
                |> List.map (\( p, o ) -> p ++ " " ++ o)
                |> String.join " ;\n    "
           )
        ++ " ."


renderTerm : Term -> String
renderTerm term =
    case term of
        Iri value ->
            "<" ++ escapeIri value ++ ">"

        Curie prefix local ->
            prefix ++ ":" ++ local

        Literal value ->
            "\"" ++ escapeLiteral value ++ "\""

        Typed datatype value ->
            "\"" ++ escapeLiteral value ++ "\"^^<" ++ escapeIri datatype ++ ">"


escapeLiteral : String -> String
escapeLiteral =
    String.replace "\\" "\\\\"
        >> String.replace "\"" "\\\""
        >> String.replace "\n" "\\n"
        >> String.replace "\u{000D}" "\\r"
        >> String.replace "\t" "\\t"


escapeIri : String -> String
escapeIri =
    String.replace "<" "%3C"
        >> String.replace ">" "%3E"
        >> String.replace " " "%20"
        >> String.replace "\"" "%22"
