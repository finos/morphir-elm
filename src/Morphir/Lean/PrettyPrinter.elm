module Morphir.Lean.PrettyPrinter exposing
    ( printCompilationUnit, printDecl, printType, printTerm, printPattern
    , escapeName, printQualifiedName
    )

{-| Pretty-printer for the Lean 4 AST.

Lean 4 is whitespace sensitive in a few places (most notably `let` bodies and application arguments, which must be
indented further than the enclosing construct). To stay on the safe side the printer:

  - always terminates `let` bindings with `;`
  - parenthesizes every non-atomic argument and operand
  - parenthesizes block expressions (`match`, `if`, `let`, `fun`) that appear inside other expressions

@docs printCompilationUnit, printDecl, printType, printTerm, printPattern
@docs escapeName, printQualifiedName

-}

import Morphir.Lean.AST exposing (..)
import Set exposing (Set)


{-| Print a full Lean source file.
-}
printCompilationUnit : CompilationUnit -> String
printCompilationUnit cu =
    let
        importsPart : String
        importsPart =
            cu.imports
                |> List.map (\i -> "import " ++ printQualifiedName i)
                |> String.join "\n"

        docPart : String
        docPart =
            case cu.doc of
                Just doc ->
                    "/-!\n" ++ escapeComment doc ++ "\n-/\n\n"

                Nothing ->
                    ""

        ns : String
        ns =
            printQualifiedName cu.namespace

        declsPart : String
        declsPart =
            cu.decls
                |> List.map printDecl
                |> String.join "\n\n"
    in
    String.concat
        [ importsPart
        , "\n\n"
        , docPart
        , "-- Elm code often binds variables it does not use (e.g. in patterns), which is fine in generated code.\n"
        , "set_option linter.unusedVariables false\n\n"
        , "namespace "
        , ns
        , "\n\n"
        , declsPart
        , if List.isEmpty cu.decls then
            ""

          else
            "\n\n"
        , "end "
        , ns
        , "\n"
        ]


{-| Print a top-level declaration.
-}
printDecl : Decl -> String
printDecl decl =
    case decl of
        InductiveDecl ind ->
            String.concat
                [ printDoc ind.doc
                , "inductive "
                , escapeName ind.name
                , printTypeParams ind.typeParams
                , " where"
                , ind.constructors
                    |> List.map
                        (\ctor ->
                            "\n  | "
                                ++ escapeName ctor.name
                                ++ (ctor.args
                                        |> List.map (\( argName, argType ) -> " (" ++ escapeName argName ++ " : " ++ printType argType ++ ")")
                                        |> String.concat
                                   )
                        )
                    |> String.concat
                , printDeriving ind.deriving
                ]

        StructureDecl str ->
            String.concat
                [ printDoc str.doc
                , "structure "
                , escapeName str.name
                , printTypeParams str.typeParams
                , " where"
                , str.fields
                    |> List.map (\field -> "\n  " ++ escapeName field.name ++ " : " ++ printType field.tpe)
                    |> String.concat
                , printDeriving str.deriving
                ]

        AbbrevDecl abbrev ->
            String.concat
                [ printDoc abbrev.doc
                , "abbrev "
                , escapeName abbrev.name
                , printTypeParams abbrev.typeParams
                , " := "
                , printType abbrev.tpe
                ]

        Def def ->
            String.concat
                [ printDoc def.doc
                , "def "
                , escapeName def.name
                , def.binders |> List.map (\b -> " " ++ printBinder b) |> String.concat
                , " : "
                , printType def.returnType
                , " :=\n  "
                , printTerm 2 def.body
                ]

        MutualBlock decls ->
            "mutual\n\n" ++ (decls |> List.map printDecl |> String.join "\n\n") ++ "\n\nend"

        Comment text ->
            text
                |> String.lines
                |> List.map (\line -> "-- " ++ line)
                |> String.join "\n"

        Guard label term ->
            printDecl (Comment label) ++ "\n#guard " ++ printTerm 2 term


printDoc : Maybe String -> String
printDoc maybeDoc =
    case maybeDoc |> Maybe.map String.trim of
        Just doc ->
            if String.isEmpty doc then
                ""

            else
                "/-- " ++ escapeComment doc ++ " -/\n"

        Nothing ->
            ""


escapeComment : String -> String
escapeComment text =
    text
        |> String.replace "-/" "- /"
        |> String.replace "/-" "/ -"


printTypeParams : List Name -> String
printTypeParams params =
    params
        |> List.map (\p -> " (" ++ escapeName p ++ " : Type)")
        |> String.concat


printDeriving : List Name -> String
printDeriving classes =
    if List.isEmpty classes then
        ""

    else
        "\n  deriving " ++ String.join ", " classes


printBinder : Binder -> String
printBinder binder =
    case binder of
        ExplicitBinder name tpe ->
            "(" ++ escapeName name ++ " : " ++ printType tpe ++ ")"

        ImplicitBinder name tpe ->
            "{" ++ escapeName name ++ " : " ++ printType tpe ++ "}"

        InstanceBinder tpe ->
            "[" ++ printType tpe ++ "]"



-- TYPES


{-| Print a type expression.
-}
printType : Type -> String
printType tpe =
    case tpe of
        FunctionType argType returnType ->
            printTypeOperand argType ++ " → " ++ printType returnType

        ProductType elems ->
            elems |> List.map printTypeOperand |> String.join " × "

        _ ->
            printTypeApp tpe


printTypeApp : Type -> String
printTypeApp tpe =
    case tpe of
        TypeRef name args ->
            if List.isEmpty args then
                printQualifiedName name

            else
                printQualifiedName name ++ (args |> List.map (\a -> " " ++ printTypeAtom a) |> String.concat)

        _ ->
            printTypeAtom tpe


printTypeOperand : Type -> String
printTypeOperand tpe =
    case tpe of
        TypeRef _ _ ->
            printTypeApp tpe

        _ ->
            printTypeAtom tpe


printTypeAtom : Type -> String
printTypeAtom tpe =
    case tpe of
        TypeRef name [] ->
            printQualifiedName name

        TypeVar name ->
            escapeName name

        UnitType ->
            "Unit"

        TypeSort ->
            "Type"

        _ ->
            "(" ++ printType tpe ++ ")"



-- TERMS


{-| Print a term. The first line is not indented, every subsequent line is indented to at least `indent` columns.
-}
printTerm : Int -> Term -> String
printTerm indent term =
    case term of
        Var name ->
            escapeName name

        Ref name ->
            printQualifiedName name

        Lit lit ->
            printLiteral lit

        App fun args ->
            printArg indent fun ++ (args |> List.map (\arg -> " " ++ printArg indent arg) |> String.concat)

        BinOp left op right ->
            printArg indent left ++ " " ++ op ++ " " ++ printArg indent right

        Lambda params body ->
            "fun " ++ (params |> List.map printPatternArg |> String.join " ") ++ " => " ++ printNested (indent + 2) body

        Let binding body ->
            "let "
                ++ printLetBinding indent binding
                ++ ";\n"
                ++ spaces indent
                ++ printTerm indent body

        LetRec bindings body ->
            "let rec "
                ++ (bindings |> List.map (printLetBinding (indent + 4)) |> String.join (",\n" ++ spaces (indent + 4)))
                ++ ";\n"
                ++ spaces indent
                ++ printTerm indent body

        IfThenElse cond thenBranch elseBranch ->
            "if "
                ++ printNested (indent + 2) cond
                ++ " then\n"
                ++ spaces (indent + 2)
                ++ printNested (indent + 2) thenBranch
                ++ "\n"
                ++ spaces indent
                ++ (case elseBranch of
                        IfThenElse _ _ _ ->
                            "else " ++ printTerm indent elseBranch

                        _ ->
                            "else\n" ++ spaces (indent + 2) ++ printNested (indent + 2) elseBranch
                   )

        Match scrutinees cases ->
            "match "
                ++ (scrutinees |> List.map (printNested (indent + 2)) |> String.join ", ")
                ++ " with"
                ++ (cases
                        |> List.map
                            (\( patterns, rhs ) ->
                                "\n"
                                    ++ spaces indent
                                    ++ "| "
                                    ++ (patterns |> List.map printPattern |> String.join ", ")
                                    ++ " =>"
                                    ++ (let
                                            rhsText : String
                                            rhsText =
                                                printNested (indent + 4) rhs
                                        in
                                        if String.contains "\n" rhsText then
                                            "\n" ++ spaces (indent + 4) ++ rhsText

                                        else
                                            " " ++ rhsText
                                       )
                            )
                        |> String.concat
                   )

        TupleTerm elems ->
            "(" ++ (elems |> List.map (printTerm (indent + 1)) |> String.join ", ") ++ ")"

        ListTerm elems ->
            "[" ++ (elems |> List.map (printTerm (indent + 1)) |> String.join ", ") ++ "]"

        StructInstance maybeBase fields ->
            let
                fieldsText : String
                fieldsText =
                    fields
                        |> List.map (\( name, value ) -> escapeName name ++ " := " ++ printTerm (indent + 2) value)
                        |> String.join ", "
            in
            case maybeBase of
                Just base ->
                    "{ " ++ printArg (indent + 2) base ++ " with " ++ fieldsText ++ " }"

                Nothing ->
                    if List.isEmpty fields then
                        "{}"

                    else
                        "{ " ++ fieldsText ++ " }"

        Projection subject fieldName ->
            case subject of
                Var _ ->
                    printTerm indent subject ++ "." ++ escapeName fieldName

                _ ->
                    "(" ++ printTerm (indent + 1) subject ++ ")." ++ escapeName fieldName

        Ascription subject tpe ->
            "(" ++ printTerm (indent + 1) subject ++ " : " ++ printType tpe ++ ")"

        UnitTerm ->
            "()"

        Sorry ->
            "sorry"


printLetBinding : Int -> LetBinding -> String
printLetBinding indent binding =
    let
        paramsText : String
        paramsText =
            binding.params
                |> List.map
                    (\( name, maybeType ) ->
                        case maybeType of
                            Just tpe ->
                                " (" ++ escapeName name ++ " : " ++ printType tpe ++ ")"

                            Nothing ->
                                " " ++ escapeName name
                    )
                |> String.concat

        returnTypeText : String
        returnTypeText =
            case binding.returnType of
                Just tpe ->
                    " : " ++ printType tpe

                Nothing ->
                    ""

        valueText : String
        valueText =
            printNested (indent + 2) binding.value
    in
    escapeName binding.name
        ++ paramsText
        ++ returnTypeText
        ++ " :="
        ++ (if String.contains "\n" valueText then
                "\n" ++ spaces (indent + 2) ++ valueText

            else
                " " ++ valueText
           )


{-| Print a term that is nested inside another construct. Block constructs are wrapped in parentheses so that they
cannot accidentally swallow tokens that belong to the enclosing expression.
-}
printNested : Int -> Term -> String
printNested indent term =
    if isBlock term then
        "(" ++ printTerm (indent + 1) term ++ ")"

    else
        printTerm indent term


printArg : Int -> Term -> String
printArg indent term =
    if isAtomic term then
        printTerm indent term

    else
        "(" ++ printTerm (indent + 1) term ++ ")"


isBlock : Term -> Bool
isBlock term =
    case term of
        Lambda _ _ ->
            True

        Let _ _ ->
            True

        LetRec _ _ ->
            True

        IfThenElse _ _ _ ->
            True

        Match _ _ ->
            True

        _ ->
            False


isAtomic : Term -> Bool
isAtomic term =
    case term of
        Var _ ->
            True

        Ref _ ->
            True

        Lit (IntLit i) ->
            i >= 0

        Lit (FloatLit f) ->
            f >= 0

        Lit (DecimalLit _) ->
            True

        Lit _ ->
            True

        TupleTerm _ ->
            True

        ListTerm _ ->
            True

        StructInstance _ _ ->
            True

        Projection _ _ ->
            True

        Ascription _ _ ->
            True

        UnitTerm ->
            True

        Sorry ->
            True

        _ ->
            False


printLiteral : Literal -> String
printLiteral lit =
    case lit of
        BoolLit True ->
            "true"

        BoolLit False ->
            "false"

        CharLit c ->
            "'" ++ escapeChar '\'' c ++ "'"

        StringLit s ->
            "\"" ++ (s |> String.toList |> List.map (escapeChar '"') |> String.concat) ++ "\""

        IntLit i ->
            String.fromInt i

        FloatLit f ->
            let
                text : String
                text =
                    String.fromFloat (abs f)

                withPoint : String
                withPoint =
                    if String.contains "." text || String.contains "e" text then
                        text

                    else
                        text ++ ".0"
            in
            if f < 0 then
                "-" ++ withPoint

            else
                withPoint

        DecimalLit s ->
            "(" ++ s ++ " : Morphir.SDK.Decimal.Decimal)"


escapeChar : Char -> Char -> String
escapeChar quote c =
    if c == quote then
        "\\" ++ String.fromChar c

    else
        case c of
            '\\' ->
                "\\\\"

            '\n' ->
                "\\n"

            '\t' ->
                "\\t"

            '\u{000D}' ->
                "\\r"

            _ ->
                if Char.toCode c < 32 then
                    "\\x" ++ String.padLeft 2 '0' (toHex (Char.toCode c))

                else
                    String.fromChar c


toHex : Int -> String
toHex n =
    let
        digit : Int -> String
        digit d =
            String.slice d (d + 1) "0123456789abcdef"
    in
    if n < 16 then
        digit n

    else
        toHex (n // 16) ++ digit (modBy 16 n)



-- PATTERNS


{-| Print a pattern.
-}
printPattern : Pattern -> String
printPattern pattern =
    case pattern of
        WildcardPattern ->
            "_"

        VarPattern name ->
            escapeName name

        AsPattern name subPattern ->
            escapeName name ++ "@" ++ printPatternArg subPattern

        TuplePattern elems ->
            "(" ++ (elems |> List.map printPattern |> String.join ", ") ++ ")"

        CtorPattern name args ->
            printQualifiedName name ++ (args |> List.map (\a -> " " ++ printPatternArg a) |> String.concat)

        EmptyListPattern ->
            "[]"

        ConsPattern head tail ->
            printPatternArg head ++ " :: " ++ printPattern tail

        LiteralPattern lit ->
            printLiteral lit

        UnitPattern ->
            "()"

        TypedPattern subPattern tpe ->
            "(" ++ printPattern subPattern ++ " : " ++ printType tpe ++ ")"


printPatternArg : Pattern -> String
printPatternArg pattern =
    case pattern of
        CtorPattern _ [] ->
            printPattern pattern

        CtorPattern _ _ ->
            "(" ++ printPattern pattern ++ ")"

        ConsPattern _ _ ->
            "(" ++ printPattern pattern ++ ")"

        AsPattern _ _ ->
            "(" ++ printPattern pattern ++ ")"

        LiteralPattern (IntLit i) ->
            if i < 0 then
                "(" ++ printPattern pattern ++ ")"

            else
                printPattern pattern

        _ ->
            printPattern pattern



-- NAMES


{-| Print a dot-separated name, escaping each segment if needed.
-}
printQualifiedName : QualifiedName -> String
printQualifiedName name =
    name |> List.map escapeName |> String.join "."


{-| Escape an identifier that collides with a Lean keyword using Lean's `«»` quoting.
-}
escapeName : Name -> String
escapeName name =
    if Set.member name reservedWords then
        "«" ++ name ++ "»"

    else
        name


spaces : Int -> String
spaces n =
    String.repeat n " "


reservedWords : Set String
reservedWords =
    Set.fromList
        [ "abbrev"
        , "at"
        , "attribute"
        , "axiom"
        , "break"
        , "by"
        , "calc"
        , "catch"
        , "class"
        , "continue"
        , "decreasing_by"
        , "def"
        , "deriving"
        , "do"
        , "else"
        , "end"
        , "example"
        , "exists"
        , "export"
        , "extends"
        , "finally"
        , "for"
        , "forall"
        , "from"
        , "fun"
        , "have"
        , "if"
        , "import"
        , "in"
        , "include"
        , "inductive"
        , "infix"
        , "infixl"
        , "infixr"
        , "instance"
        , "let"
        , "local"
        , "macro"
        , "match"
        , "mutual"
        , "namespace"
        , "nofun"
        , "nomatch"
        , "noncomputable"
        , "notation"
        , "obtain"
        , "omit"
        , "opaque"
        , "open"
        , "partial"
        , "postfix"
        , "prefix"
        , "private"
        , "protected"
        , "rec"
        , "return"
        , "section"
        , "set_option"
        , "show"
        , "suffices"
        , "syntax"
        , "termination_by"
        , "then"
        , "theorem"
        , "this"
        , "try"
        , "universe"
        , "unless"
        , "unsafe"
        , "variable"
        , "where"
        , "with"
        , "mut"
        , "structure"
        , "Type"
        , "Prop"
        , "Sort"
        , "fun"
        , "λ"
        , "using"
        , "renaming"
        , "hiding"
        , "private"
        , "elab"
        , "initialize"
        , "builtin_initialize"
        , "meta"
        , "public"
        , "module"
        , "lemma"
        , "repeat"
        , "while"
        ]
