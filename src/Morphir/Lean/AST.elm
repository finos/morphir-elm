module Morphir.Lean.AST exposing
    ( CompilationUnit, Decl(..), Constructor, Field, DefDecl, Binder(..), Type(..), Term(..), LetBinding, Pattern(..), Literal(..)
    , Name, QualifiedName
    )

{-| Abstract syntax tree for the subset of Lean 4 that the Morphir Lean backend generates.

The AST is intentionally small: it covers what is needed to faithfully represent Morphir IR types and values as pure
Lean 4 definitions that can then be reasoned about with Lean's theorem proving facilities.

@docs CompilationUnit, Decl, Constructor, Field, DefDecl, Binder, Type, Term, LetBinding, Pattern, Literal
@docs Name, QualifiedName

-}


{-| A simple (unqualified) Lean identifier. Escaping of reserved words is done by the pretty-printer.
-}
type alias Name =
    String


{-| A dot-separated Lean identifier like `Morphir.SDK.List.map`, represented as its segments.
-}
type alias QualifiedName =
    List Name


{-| A single Lean source file.
-}
type alias CompilationUnit =
    { filePath : List String
    , fileName : String
    , doc : Maybe String
    , imports : List QualifiedName
    , namespace : QualifiedName
    , decls : List Decl
    }


{-| Top-level declarations.
-}
type Decl
    = InductiveDecl
        { name : Name
        , doc : Maybe String
        , typeParams : List Name
        , constructors : List Constructor
        , deriving : List Name
        }
    | StructureDecl
        { name : Name
        , doc : Maybe String
        , typeParams : List Name
        , fields : List Field
        , deriving : List Name
        }
    | AbbrevDecl
        { name : Name
        , doc : Maybe String
        , typeParams : List Name
        , tpe : Type
        }
    | Def DefDecl
    | MutualBlock (List Decl)
    | Comment String
    | Guard String Term


{-| Data constructor of an inductive type.
-}
type alias Constructor =
    { name : Name
    , args : List ( Name, Type )
    }


{-| Structure field.
-}
type alias Field =
    { name : Name
    , tpe : Type
    }


{-| Function or constant definition.
-}
type alias DefDecl =
    { name : Name
    , doc : Maybe String
    , binders : List Binder
    , returnType : Type
    , body : Term
    }


{-| Binders that can appear in a definition header.
-}
type Binder
    = ExplicitBinder Name Type
    | ImplicitBinder Name Type
    | InstanceBinder Type


{-| Lean type expressions. Lean types are terms, but keeping them separate makes the generator easier to read.
-}
type Type
    = TypeRef QualifiedName (List Type)
    | TypeVar Name
    | ProductType (List Type)
    | FunctionType Type Type
    | UnitType
    | TypeSort


{-| Lean terms.
-}
type Term
    = Var Name
    | Ref QualifiedName
    | Lit Literal
    | App Term (List Term)
    | BinOp Term String Term
    | Lambda (List Pattern) Term
    | Let LetBinding Term
    | LetRec (List LetBinding) Term
    | IfThenElse Term Term Term
    | Match (List Term) (List ( List Pattern, Term ))
    | TupleTerm (List Term)
    | ListTerm (List Term)
    | StructInstance (Maybe Term) (List ( Name, Term ))
    | Projection Term Name
    | Ascription Term Type
    | UnitTerm
    | Sorry


{-| A local definition introduced by `let` or `let rec`.
-}
type alias LetBinding =
    { name : Name
    , params : List ( Name, Maybe Type )
    , returnType : Maybe Type
    , value : Term
    }


{-| Patterns used in `match` and `fun`.
-}
type Pattern
    = WildcardPattern
    | VarPattern Name
    | AsPattern Name Pattern
    | TuplePattern (List Pattern)
    | CtorPattern QualifiedName (List Pattern)
    | EmptyListPattern
    | ConsPattern Pattern Pattern
    | LiteralPattern Literal
    | UnitPattern
    | TypedPattern Pattern Type


{-| Literal values.
-}
type Literal
    = BoolLit Bool
    | CharLit Char
    | StringLit String
    | IntLit Int
    | FloatLit Float
    | DecimalLit String
