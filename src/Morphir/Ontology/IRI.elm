module Morphir.Ontology.IRI exposing (constructorIRI, fieldIRI, iriString, moduleIRI, packageIRI, typeIRI, valueIRI)

{-| Mints the IRIs of a projected Morphir model. They are URNs of the form `urn:morphir:<Package>/<Module.Path>/<Name>`
where the package is the `name` from morphir.json, so they are unique per package and need no registered host. Fields
and constructors live under their type.

Types and constructors are PascalCase and values camelCase, so a type and a value that share a name (e.g. `App` and
`app`) get distinct IRIs.

@docs constructorIRI, fieldIRI, iriString, moduleIRI, packageIRI, typeIRI, valueIRI

-}

import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Package exposing (PackageName)
import Morphir.IR.Path as Path
import Morphir.Ontology.RDF as RDF exposing (Term)


iriString : Term -> String
iriString term =
    case term of
        RDF.Iri value ->
            value

        _ ->
            ""


packageIRI : PackageName -> Term
packageIRI pkg =
    RDF.iri ("urn:morphir:" ++ Path.toString Name.toTitleCase "." pkg)


moduleIRI : FQName -> Term
moduleIRI ( pkg, modulePath, localName ) =
    RDF.iri (iriString (packageIRI pkg) ++ "/" ++ Path.toString Name.toTitleCase "." (modulePath ++ [ localName ]))


memberIRI : FQName -> (Name -> String) -> Term
memberIRI ( pkg, modulePath, localName ) toCase =
    RDF.iri (iriString (packageIRI pkg) ++ "/" ++ Path.toString Name.toTitleCase "." modulePath ++ "/" ++ toCase localName)


typeIRI : FQName -> Term
typeIRI fqn =
    memberIRI fqn Name.toTitleCase


valueIRI : FQName -> Term
valueIRI fqn =
    memberIRI fqn Name.toCamelCase


constructorIRI : FQName -> Name -> Term
constructorIRI owner ctorName =
    RDF.iri (iriString (typeIRI owner) ++ "/" ++ Name.toTitleCase ctorName)


fieldIRI : FQName -> Name -> Term
fieldIRI owner fieldName =
    RDF.iri (iriString (typeIRI owner) ++ "/" ++ Name.toCamelCase fieldName)
