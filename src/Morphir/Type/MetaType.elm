module Morphir.Type.MetaType exposing (MetaType(..), Variable, boolType, charType, uuidType, contains, floatType, intType, listType, metaAlias, metaClosedRecord, metaFun, metaOpenRecord, metaRecord, metaRef, metaTuple, metaUnit, metaVar, removeAliases, stringType, substituteVariable, substituteVariables, toString, variableByIndex, variableGreaterThan, variables, wrapInAliases)

import Dict exposing (Dict)
import Morphir.IR.FQName as FQName exposing (FQName, fqn)
import Morphir.IR.Name as Name exposing (Name)
import Set exposing (Set)


type MetaType
    = MetaVar Variable
    | MetaRef (Set Variable) FQName (List MetaType) (Maybe MetaType)
    | MetaTuple (Set Variable) (List MetaType)
    | MetaRecord (Set Variable) Variable Bool (Dict Name MetaType)
    | MetaFun (Set Variable) MetaType MetaType
    | MetaUnit


metaVar : Variable -> MetaType
metaVar =
    MetaVar


metaRef : FQName -> List MetaType -> MetaType
metaRef fQName args =
    let
        vars =
            args |> List.map variables |> List.foldl Set.union Set.empty
    in
    MetaRef vars fQName args Nothing


metaTuple : List MetaType -> MetaType
metaTuple elems =
    let
        vars =
            elems |> List.map variables |> List.foldl Set.union Set.empty
    in
    MetaTuple vars elems


metaRecord : Variable -> Bool -> Dict Name MetaType -> MetaType
metaRecord var isOpen fields =
    let
        vars =
            fields
                |> Dict.toList
                |> List.map (Tuple.second >> variables)
                |> List.foldl Set.union Set.empty
                |> Set.insert var
    in
    MetaRecord vars var isOpen fields


metaOpenRecord : Variable -> Dict Name MetaType -> MetaType
metaOpenRecord var fields =
    metaRecord var True fields


metaClosedRecord : Variable -> Dict Name MetaType -> MetaType
metaClosedRecord var fields =
    metaRecord var False fields


metaFun : MetaType -> MetaType -> MetaType
metaFun arg body =
    let
        vars =
            Set.union (variables arg) (variables body)
    in
    MetaFun vars arg body


metaUnit : MetaType
metaUnit =
    MetaUnit


metaAlias : FQName -> List MetaType -> MetaType -> MetaType
metaAlias fQName args tpe =
    let
        vars : Set Variable
        vars =
            args
                |> List.map variables
                |> List.foldl Set.union Set.empty
                |> Set.union (variables tpe)
    in
    case tpe of
        MetaRef _ nestedFQName nestedArgs _ ->
            if fQName == nestedFQName && nestedArgs == args then
                tpe

            else
                MetaRef vars fQName args (Just tpe)

        _ ->
            MetaRef vars fQName args (Just tpe)


wrapInAliases : List ( FQName, List MetaType ) -> MetaType -> MetaType
wrapInAliases aliases tpe =
    case aliases of
        [] ->
            tpe

        ( alias, aliasArgs ) :: restOfAliases ->
            metaAlias alias aliasArgs (wrapInAliases restOfAliases tpe)


toString : MetaType -> String
toString metaType =
    case metaType of
        MetaVar var ->
            "t" ++ (var |> String.fromInt)

        MetaRef _ fQName args maybeAliasedType ->
            let
                refString =
                    if List.isEmpty args then
                        FQName.toString fQName

                    else
                        String.join " " [ FQName.toString fQName, args |> List.map (\arg -> String.concat [ "(", toString arg, ")" ]) |> String.join " " ]
            in
            case maybeAliasedType of
                Just aliasedType ->
                    String.concat [ refString, " = ", toString aliasedType ]

                Nothing ->
                    refString

        MetaTuple _ metaTypes ->
            String.concat [ "( ", metaTypes |> List.map toString |> String.join ", ", " )" ]

        MetaRecord _ var isOpen fields ->
            let
                prefix =
                    "t"
                        ++ (var |> String.fromInt)
                        ++ (if isOpen then
                                " <= "

                            else
                                " = "
                           )

                fieldStrings =
                    fields
                        |> Dict.toList
                        |> List.map
                            (\( fieldName, fieldType ) ->
                                String.concat [ Name.toCamelCase fieldName, " : ", toString fieldType ]
                            )
            in
            String.concat [ "{ ", prefix, fieldStrings |> String.join ", ", " }" ]

        MetaFun _ argType returnType ->
            String.concat [ toString argType, " -> ", toString returnType ]

        MetaUnit ->
            "()"


type alias Variable =
    Int


variableByIndex : Int -> Variable
variableByIndex i =
    i


variableGreaterThan : Variable -> Variable -> Bool
variableGreaterThan var1 var2 =
    var1 < var2


variables : MetaType -> Set Variable
variables metaType =
    case metaType of
        MetaVar variable ->
            Set.singleton variable

        MetaRef vars _ _ _ ->
            vars

        MetaTuple vars _ ->
            vars

        MetaRecord vars _ _ _ ->
            vars

        MetaFun vars _ _ ->
            vars

        MetaUnit ->
            Set.empty


{- Stack-safe substitution using an explicit continuation stack.

   The original recursive versions of substituteVariable and substituteVariables
   could overflow the JavaScript stack on deeply nested MetaType trees (see #1258).

   The trampoline pattern works by:
   1. Converting the tree traversal into a single tail-recursive function
   2. Using an explicit stack of "frames" to track what work remains
   3. Alternating between Process mode (descend into children) and Apply mode (combine results)

   Elm's compiler optimizes self-tail-calls into while loops, so this uses O(1) stack space.
-}


{-| A frame on the explicit continuation stack. Each variant captures the context
needed to reconstruct a parent node once its children have been processed.
-}
type SubstFrame
    = -- Tuple: processed elements (reversed), remaining elements
      TupleElems (List MetaType) (List MetaType)
      -- Record: recordVar, isOpen, processed fields (reversed), current field name, remaining fields
    | RecordFields Variable Bool (List ( Name, MetaType )) Name (List ( Name, MetaType ))
      -- Fun: unprocessed second child (we're processing the first)
    | FunLeft MetaType
      -- Fun: processed first child (we're processing the second)
    | FunRight MetaType
      -- Ref: fQName, processed args (reversed), remaining args, maybe alias
    | RefArgs FQName (List MetaType) (List MetaType) (Maybe MetaType)
      -- Ref alias: fQName, processed args (alias is being processed)
    | RefAlias FQName (List MetaType)


substituteVariable : Variable -> MetaType -> MetaType -> MetaType
substituteVariable var replacement original =
    substVarLoop var replacement True original []


{-| Tail-recursive loop for single-variable substitution.
The Bool parameter indicates mode: True = Process (descend), False = Apply (combine).
When processing, `current` is the node to examine.
When applying, `current` is the result to combine with the stack.
-}
substVarLoop : Variable -> MetaType -> Bool -> MetaType -> List SubstFrame -> MetaType
substVarLoop var replacement isProcess current stack =
    if isProcess then
        -- Process mode: examine current node and either produce a result or descend
        if not (Set.member var (variables current)) then
            substVarLoop var replacement False current stack

        else
            case current of
                MetaVar thisVar ->
                    if thisVar == var then
                        substVarLoop var replacement False replacement stack

                    else
                        substVarLoop var replacement False current stack

                MetaUnit ->
                    substVarLoop var replacement False current stack

                MetaTuple _ metaElems ->
                    case metaElems of
                        [] ->
                            substVarLoop var replacement False (metaTuple []) stack

                        first :: rest ->
                            substVarLoop var replacement True first (TupleElems [] rest :: stack)

                MetaRecord _ recordVar isOpen metaFields ->
                    let
                        useVar =
                            if recordVar == var then
                                case replacement of
                                    MetaVar replacementVar ->
                                        Just replacementVar

                                    _ ->
                                        Nothing

                            else
                                Just recordVar
                    in
                    case useVar of
                        Nothing ->
                            -- recordVar matches and replacement is not a MetaVar: return replacement
                            substVarLoop var replacement False replacement stack

                        Just rv ->
                            case Dict.toList metaFields of
                                [] ->
                                    substVarLoop var replacement False (metaRecord rv isOpen Dict.empty) stack

                                ( name, ft ) :: rest ->
                                    substVarLoop var replacement True ft (RecordFields rv isOpen [] name rest :: stack)

                MetaFun _ metaFunc metaArg ->
                    substVarLoop var replacement True metaFunc (FunLeft metaArg :: stack)

                MetaRef _ fQName args maybeAliasedType ->
                    case args of
                        [] ->
                            case maybeAliasedType of
                                Just alias ->
                                    substVarLoop var replacement True alias (RefAlias fQName [] :: stack)

                                Nothing ->
                                    substVarLoop var replacement False (metaRef fQName []) stack

                        first :: rest ->
                            substVarLoop var replacement True first (RefArgs fQName [] rest maybeAliasedType :: stack)

    else
        -- Apply mode: combine result with continuation stack
        case stack of
            [] ->
                current

            (TupleElems done remaining) :: restStack ->
                let
                    newDone =
                        current :: done
                in
                case remaining of
                    [] ->
                        substVarLoop var replacement False (metaTuple (List.reverse newDone)) restStack

                    next :: rest ->
                        substVarLoop var replacement True next (TupleElems newDone rest :: restStack)

            (RecordFields recordVar isOpen done currentName remaining) :: restStack ->
                let
                    newDone =
                        ( currentName, current ) :: done
                in
                case remaining of
                    [] ->
                        substVarLoop var replacement False (metaRecord recordVar isOpen (Dict.fromList (List.reverse newDone))) restStack

                    ( nextName, nextType ) :: rest ->
                        substVarLoop var replacement True nextType (RecordFields recordVar isOpen newDone nextName rest :: restStack)

            (FunLeft secondChild) :: restStack ->
                substVarLoop var replacement True secondChild (FunRight current :: restStack)

            (FunRight firstResult) :: restStack ->
                substVarLoop var replacement False (metaFun firstResult current) restStack

            (RefArgs fQName done remaining maybeAlias) :: restStack ->
                let
                    newDone =
                        current :: done
                in
                case remaining of
                    [] ->
                        case maybeAlias of
                            Just alias ->
                                substVarLoop var replacement True alias (RefAlias fQName (List.reverse newDone) :: restStack)

                            Nothing ->
                                substVarLoop var replacement False (metaRef fQName (List.reverse newDone)) restStack

                    next :: rest ->
                        substVarLoop var replacement True next (RefArgs fQName newDone rest maybeAlias :: restStack)

            (RefAlias fQName processedArgs) :: restStack ->
                substVarLoop var replacement False (metaAlias fQName processedArgs current) restStack


substituteVariables : Dict Variable MetaType -> MetaType -> MetaType
substituteVariables replacements original =
    let
        varSet =
            replacements |> Dict.keys |> Set.fromList
    in
    if Set.isEmpty (Set.intersect varSet (variables original)) then
        original

    else
        substVarsLoop replacements varSet True original []


{-| Tail-recursive loop for multi-variable substitution.
Same structure as substVarLoop but checks against a set of variables.
-}
substVarsLoop : Dict Variable MetaType -> Set Variable -> Bool -> MetaType -> List SubstFrame -> MetaType
substVarsLoop replacements varSet isProcess current stack =
    if isProcess then
        if Set.isEmpty (Set.intersect varSet (variables current)) then
            substVarsLoop replacements varSet False current stack

        else
            case current of
                MetaVar thisVar ->
                    case Dict.get thisVar replacements of
                        Just found ->
                            substVarsLoop replacements varSet False found stack

                        Nothing ->
                            substVarsLoop replacements varSet False current stack

                MetaUnit ->
                    substVarsLoop replacements varSet False current stack

                MetaTuple _ metaElems ->
                    case metaElems of
                        [] ->
                            substVarsLoop replacements varSet False (metaTuple []) stack

                        first :: rest ->
                            substVarsLoop replacements varSet True first (TupleElems [] rest :: stack)

                MetaRecord _ recordVar isOpen metaFields ->
                    let
                        useVar =
                            case Dict.get recordVar replacements of
                                Just found ->
                                    case found of
                                        MetaVar replacementVar ->
                                            Just replacementVar

                                        _ ->
                                            Nothing

                                Nothing ->
                                    Just recordVar
                    in
                    case useVar of
                        Nothing ->
                            -- recordVar found in replacements but replacement is not MetaVar
                            case Dict.get recordVar replacements of
                                Just found ->
                                    substVarsLoop replacements varSet False found stack

                                Nothing ->
                                    -- unreachable, but handle gracefully
                                    substVarsLoop replacements varSet False current stack

                        Just rv ->
                            case Dict.toList metaFields of
                                [] ->
                                    substVarsLoop replacements varSet False (metaRecord rv isOpen Dict.empty) stack

                                ( name, ft ) :: rest ->
                                    substVarsLoop replacements varSet True ft (RecordFields rv isOpen [] name rest :: stack)

                MetaFun _ metaFunc metaArg ->
                    substVarsLoop replacements varSet True metaFunc (FunLeft metaArg :: stack)

                MetaRef _ fQName args maybeAliasedType ->
                    case args of
                        [] ->
                            case maybeAliasedType of
                                Just alias ->
                                    substVarsLoop replacements varSet True alias (RefAlias fQName [] :: stack)

                                Nothing ->
                                    substVarsLoop replacements varSet False (metaRef fQName []) stack

                        first :: rest ->
                            substVarsLoop replacements varSet True first (RefArgs fQName [] rest maybeAliasedType :: stack)

    else
        case stack of
            [] ->
                current

            (TupleElems done remaining) :: restStack ->
                let
                    newDone =
                        current :: done
                in
                case remaining of
                    [] ->
                        substVarsLoop replacements varSet False (metaTuple (List.reverse newDone)) restStack

                    next :: rest ->
                        substVarsLoop replacements varSet True next (TupleElems newDone rest :: restStack)

            (RecordFields recordVar isOpen done currentName remaining) :: restStack ->
                let
                    newDone =
                        ( currentName, current ) :: done
                in
                case remaining of
                    [] ->
                        substVarsLoop replacements varSet False (metaRecord recordVar isOpen (Dict.fromList (List.reverse newDone))) restStack

                    ( nextName, nextType ) :: rest ->
                        substVarsLoop replacements varSet True nextType (RecordFields recordVar isOpen newDone nextName rest :: restStack)

            (FunLeft secondChild) :: restStack ->
                substVarsLoop replacements varSet True secondChild (FunRight current :: restStack)

            (FunRight firstResult) :: restStack ->
                substVarsLoop replacements varSet False (metaFun firstResult current) restStack

            (RefArgs fQName done remaining maybeAlias) :: restStack ->
                let
                    newDone =
                        current :: done
                in
                case remaining of
                    [] ->
                        case maybeAlias of
                            Just alias ->
                                substVarsLoop replacements varSet True alias (RefAlias fQName (List.reverse newDone) :: restStack)

                            Nothing ->
                                substVarsLoop replacements varSet False (metaRef fQName (List.reverse newDone)) restStack

                    next :: rest ->
                        substVarsLoop replacements varSet True next (RefArgs fQName newDone rest maybeAlias :: restStack)

            (RefAlias fQName processedArgs) :: restStack ->
                substVarsLoop replacements varSet False (metaAlias fQName processedArgs current) restStack


boolType : MetaType
boolType =
    metaRef (fqn "Morphir.SDK" "Basics" "Bool") []


charType : MetaType
charType =
    metaRef (fqn "Morphir.SDK" "Char" "Char") []


stringType : MetaType
stringType =
    metaRef (fqn "Morphir.SDK" "String" "String") []


intType : MetaType
intType =
    metaRef (fqn "Morphir.SDK" "Basics" "Int") []


floatType : MetaType
floatType =
    metaRef (fqn "Morphir.SDK" "Basics" "Float") []

uuidType : MetaType
uuidType =
    metaRef (fqn "Morphir.SDK" "UUID" "UUID") []


listType : MetaType -> MetaType
listType itemType =
    metaRef (fqn "Morphir.SDK" "List" "List") [ itemType ]


contains : MetaType -> MetaType -> Bool
contains innerType outerType =
    if innerType == outerType then
        True

    else
        case outerType of
            MetaVar _ ->
                False

            MetaTuple _ metaElems ->
                metaElems
                    |> List.any (contains innerType)

            MetaRecord _ _ _ metaFields ->
                metaFields
                    |> Dict.values
                    |> List.any (contains innerType)

            MetaFun _ metaFunc metaArg ->
                contains innerType metaFunc || contains innerType metaArg

            MetaRef _ _ args maybeAliasedType ->
                case maybeAliasedType of
                    Just aliasedType ->
                        args
                            |> List.any (contains innerType)
                            |> (||) (contains innerType aliasedType)

                    Nothing ->
                        args
                            |> List.any (contains innerType)

            MetaUnit ->
                False


removeAliases : MetaType -> MetaType
removeAliases original =
    case original of
        MetaVar _ ->
            original

        MetaTuple _ metaElems ->
            metaTuple
                (metaElems
                    |> List.map removeAliases
                )

        MetaRecord _ recordVar isOpen metaFields ->
            metaRecord recordVar
                isOpen
                (metaFields
                    |> Dict.map
                        (\_ fieldType ->
                            removeAliases fieldType
                        )
                )

        MetaFun _ metaFunc metaArg ->
            metaFun
                (removeAliases metaFunc)
                (removeAliases metaArg)

        MetaRef _ fQName args maybeAliasedType ->
            case maybeAliasedType of
                Just aliasedType ->
                    removeAliases aliasedType

                Nothing ->
                    metaRef fQName
                        (args
                            |> List.map removeAliases
                        )

        MetaUnit ->
            original
