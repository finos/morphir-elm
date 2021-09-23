module Morphir.TypeScript.AST exposing
    ( TypeDef(..), TypeExp(..)
    , CompilationUnit, ObjectExp
    )

{-| This module contains the TypeScript AST (Abstract Syntax Tree). The purpose of this AST is to make it easier to
generate valid TypeScript source code and to separate the language syntax from low-level formatting concerns. We use
this AST as the output of the TypeScript backend and also as the input of the pretty-printer that turns it into the
final text representation.

The AST is maintained manually and it does not have to cover the whole language. We focus on the parts of the language
that we use in the backend.

@docs TypeDef, TypeExp, FieldDef

-}


{-| -}
type alias CompilationUnit =
    { dirPath : List String
    , fileName : String
    , typeDefs : List TypeDef
    }


{-| Represents a type definition.
-}
type TypeDef
    = TypeAlias String (List String) TypeExp
    | Interface String (List String) ObjectExp


{-| A type expression represents the right-hand side of a type annotation or a type alias.

The structure follows the documentation here:
<https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#the-primitives-string-number-and-boolean>

Only a small subset of the type-system is currently implemented.

-}
type TypeExp
    = Any
    | Boolean
    | List TypeExp {- Represents a Morphir 'List' type, as a Typescript 'Array' type -}
    | LiteralString String
    | Number
    | Object ObjectExp
    | String
    | Tuple (List TypeExp)
    | TypeRef String (List String)
    | Union (List TypeExp)
    | Variable String
    | UnhandledType String


{-| Represents an object expression (or interface definition) as a list of name-and-type pairs.
-}
type alias ObjectExp =
    List ( String, TypeExp )
