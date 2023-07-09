module Morphir.Value.Interpreter exposing
    ( evaluate, evaluateValue, evaluateFunctionValue, matchPattern, Variables
    , Config, complete, partial
    )

{-| This module contains an interpreter for Morphir expressions. The interpreter takes a piece of logic as input,
evaluates it and returns the resulting data. In Morphir both logic and data is captured as a `Value` so the interpreter
takes a `Value` and returns a `Value` (or an error for invalid expressions):

@docs evaluate, evaluateValue, evaluateFunctionValue, matchPattern, Variables
@docs Config, complete, partial

-}

import Dict exposing (Dict)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Type as Type
import Morphir.IR.Value as Value exposing (Pattern, RawValue, Value, toRawValue)
import Morphir.SDK.ResultList as ResultList
import Morphir.Value.Error exposing (Error(..), PatternMismatch(..))
import Morphir.Value.Native as Native


{-| Dictionary of variable name to value.
-}
type alias Variables =
    Dict Name RawValue


{-| Configuration for the interpreter

  - allowPartials: When turned on, allows partial evaluation of a Value.

-}
type alias Config =
    { allowPartial : Bool
    }


{-| Configuration for complete evaluation
-}
complete : Config
complete =
    { allowPartial = False
    }


{-| Configuration for partial evaluation
-}
partial : Config
partial =
    { allowPartial = True
    }


{-| -}
evaluateFunctionValue : Config -> Dict FQName Native.Function -> Distribution -> FQName -> List (Maybe RawValue) -> Result Error RawValue
evaluateFunctionValue config nativeFunctions ir fQName variableValues =
    ir
        |> Distribution.lookupValueDefinition fQName
        -- If we cannot find the value in the IR we return an error.
        |> Result.fromMaybe (ReferenceNotFound fQName)
        |> Result.andThen
            (\valueDef ->
                evaluateValue config
                    nativeFunctions
                    ir
                    (List.map2 Tuple.pair
                        (valueDef.inputTypes
                            |> List.map (\( name, _, _ ) -> name)
                        )
                        (List.map (Maybe.withDefault (Value.Unit ())) variableValues)
                        |> Dict.fromList
                    )
                    []
                    (valueDef.body |> toRawValue)
            )


{-| Evaluates a value expression and returns another value expression or an error. You can also pass in other values
by fully-qualified name that will be used for lookup if the expression contains references.

    evaluate
        SDK.nativeFunctions
        (Value.Apply ()
            (Value.Reference () (fqn "Morphir.SDK" "Basics" "not"))
            (Value.Literal () (BoolLiteral True))
        )
        -- (Value.Literal () (BoolLiteral False))

-}
evaluate : Dict FQName Native.Function -> Distribution -> RawValue -> Result Error RawValue
evaluate nativeFunctions ir value =
    --  do not permit partial evaluation
    evaluateValue complete nativeFunctions ir Dict.empty [] value


{-| Evaluates a value expression recursively in a single pass while keeping track of variables and arguments along the
evaluation.
-}
evaluateValue : Config -> Dict FQName Native.Function -> Distribution -> Variables -> List RawValue -> RawValue -> Result Error RawValue
evaluateValue ({ allowPartial } as config) nativeFunctions ir variables arguments value =
    case value of
        Value.Literal _ _ ->
            -- Literals cannot be evaluated any further
            Ok value

        Value.Constructor _ fQName ->
            arguments
                |> List.map (evaluateValue config nativeFunctions ir variables [])
                -- If any of those fails we return the first failure.
                |> ResultList.keepFirstError
                |> Result.andThen
                    (\evaluatedArgs ->
                        case ir |> Distribution.lookupTypeSpecification (ir |> Distribution.resolveAliases fQName) of
                            Just (Type.TypeAliasSpecification _ (Type.Record _ fields)) ->
                                Ok
                                    (Value.Record ()
                                        (Dict.fromList <|
                                            List.map2 Tuple.pair
                                                (fields |> List.map .name)
                                                evaluatedArgs
                                        )
                                    )

                            _ ->
                                let
                                    applyArgs : RawValue -> List RawValue -> RawValue
                                    applyArgs subject argsReversed =
                                        case argsReversed of
                                            [] ->
                                                subject

                                            lastArg :: restOfArgsReversed ->
                                                Value.Apply () (applyArgs subject restOfArgsReversed) lastArg
                                in
                                Ok (applyArgs value (List.reverse evaluatedArgs))
                    )

        Value.Tuple _ elems ->
            -- For a tuple we need to evaluate each element and return them wrapped back into a tuple
            elems
                -- We evaluate each element separately.
                |> List.map (evaluateValue config nativeFunctions ir variables [])
                -- If any of those fails we return the first failure.
                |> ResultList.keepFirstError
                -- If nothing fails we wrap the result in a tuple.
                |> Result.map (Value.Tuple ())

        Value.List _ items ->
            -- For a list we need to evaluate each element and return them wrapped back into a list
            items
                -- We evaluate each element separately.
                |> List.map (evaluateValue config nativeFunctions ir variables [])
                -- If any of those fails we return the first failure.
                |> ResultList.keepFirstError
                -- If nothing fails we wrap the result in a list.
                |> Result.map (Value.List ())

        Value.Record _ fields ->
            -- For a record we need to evaluate each element and return them wrapped back into a record
            fields
                |> Dict.toList
                -- We evaluate each field separately.
                |> List.map
                    (\( fieldName, fieldValue ) ->
                        evaluateValue config nativeFunctions ir variables [] fieldValue
                            |> Result.map (Tuple.pair fieldName)
                    )
                -- If any of those fails we return the first failure.
                |> ResultList.keepFirstError
                -- If nothing fails we wrap the result in a record.
                |> Result.map (Dict.fromList >> Value.Record ())

        Value.Variable _ varName ->
            -- When we run into a variable we simply look up the value of the variable in the state.
            variables
                |> Dict.get varName
                -- If we cannot find the variable in the state we return an error.
                |> Result.fromMaybe (VariableNotFound varName)
                -- Wrap the error to make it easier to understand where it happened
                |> Result.mapError (ErrorWhileEvaluatingVariable varName)
                |> Result.andThen
                    (\stateValue ->
                        if stateValue == value then
                            -- some variables may remain unresolved
                            Ok stateValue

                        else
                            -- evaluate value of the variable
                            evaluateValue config nativeFunctions ir variables [] stateValue
                    )

        Value.Reference _ fQName ->
            -- We check if there is a native function first
            case nativeFunctions |> Dict.get fQName of
                Just nativeFunction ->
                    let
                        result =
                            nativeFunction
                                (evaluateValue config
                                    -- This is the state that will be used when native functions call "eval".
                                    -- We need to retain most of the current state but clear out the argument since
                                    -- the native function will evaluate completely new expressions.
                                    nativeFunctions
                                    ir
                                    variables
                                    []
                                )
                                -- Pass down the arguments we collected before we got here (if we are inside an apply).
                                arguments
                                -- Wrap the error to make it easier to understand where it happened
                                |> Result.mapError (ErrorWhileEvaluatingReference fQName)
                    in
                    case result of
                        Ok _ ->
                            result

                        Err _ ->
                            -- We wrap the arguments to the native functions in an Apply
                            -- if the native function failed evaluation
                            if allowPartial then
                                arguments
                                    |> List.map (evaluateValue config nativeFunctions ir variables [])
                                    |> ResultList.keepFirstError
                                    |> Result.map (List.foldl (\arg target -> Value.Apply () target arg) value)

                            else
                                result

                Nothing ->
                    arguments
                        |> List.map
                            (evaluateValue config
                                nativeFunctions
                                ir
                                variables
                                []
                            )
                        |> ResultList.keepFirstError
                        -- If this is a reference to another Morphir value we need to look it up and evaluate.
                        |> Result.map (\resultList -> List.map (\result -> Just result) resultList)
                        |> Result.andThen (evaluateFunctionValue config nativeFunctions ir fQName)

        Value.Field _ subjectValue fieldName ->
            -- Field selection is evaluated by evaluating the subject first then matching on the resulting record and
            -- getting the field with the specified name.
            evaluateValue config nativeFunctions ir variables [] subjectValue
                |> Result.andThen
                    (\evaluatedSubjectValue ->
                        case evaluatedSubjectValue of
                            Value.Record _ fields ->
                                fields
                                    |> Dict.get fieldName
                                    |> Result.fromMaybe (FieldNotFound subjectValue fieldName)

                            simplified ->
                                if allowPartial then
                                    -- if we allow partial evaluation, wrap the field simplified subject with a Field value
                                    Ok (Value.Field () simplified fieldName)

                                else
                                    Err (RecordExpected subjectValue evaluatedSubjectValue)
                    )

        Value.FieldFunction _ fieldName ->
            -- A field function expects exactly one argument to be passed through the state as subject value. Otherwise
            -- it behaves exactly like a `Field` expression.
            case arguments of
                [ subjectValue ] ->
                    evaluateValue config nativeFunctions ir variables [] subjectValue
                        |> Result.andThen
                            (\evaluatedSubjectValue ->
                                case evaluatedSubjectValue of
                                    Value.Record _ fields ->
                                        fields
                                            |> Dict.get fieldName
                                            |> Result.fromMaybe (FieldNotFound subjectValue fieldName)

                                    _ ->
                                        if allowPartial then
                                            -- if we allow partial evaluation, wrap the field simplified subject with a Field value
                                            Ok (Value.FieldFunction () fieldName)

                                        else
                                            Err (RecordExpected subjectValue evaluatedSubjectValue)
                            )

                other ->
                    Err (ExactlyOneArgumentExpected other)

        Value.Apply _ function argument ->
            -- When we run into an Apply we simply add the argument to the state and recursively evaluate the function.
            -- When there are multiple arguments there will be another Apply within the function so arguments will be
            -- repeatedly collected until we hit another node (lambda, reference or variable) where the arguments will
            -- be used to execute the calculation.
            evaluateValue config
                nativeFunctions
                ir
                variables
                (argument :: arguments)
                function

        Value.Lambda _ argumentPattern body ->
            -- By the time we run into a lambda we expect arguments to be available in the state.
            arguments
                -- So we start by taking the last argument in the state (We use head because the arguments are reversed).
                |> List.head
                -- If there are no arguments then our expression was invalid so we return an error.
                |> Result.fromMaybe NoArgumentToPassToLambda
                -- If the argument is available we first need to match it against the argument pattern.
                -- In Morphir (just like in Elm) you can pattern-match on the argument of a lambda.
                |> Result.andThen
                    (\argumentValue ->
                        -- To match the pattern we call a helper function that both matches and extracts variables out
                        -- of the pattern.
                        matchPattern argumentPattern argumentValue
                            -- If the pattern does not match we error out. This should never happen with valid
                            -- expressions as lambda argument patterns should only be used for decomposition not
                            -- filtering.
                            |> Result.mapError LambdaArgumentDidNotMatch
                    )
                -- Finally we evaluate the body of the lambda using the variables extracted by the pattern.
                |> Result.andThen
                    (\argumentVariables ->
                        evaluateValue config
                            nativeFunctions
                            ir
                            (Dict.union argumentVariables variables)
                            (arguments |> List.tail |> Maybe.withDefault [])
                            body
                    )

        Value.LetDefinition _ defName def inValue ->
            -- We evaluate a let definition by first evaluating the definition, then assigning it to the variable name
            -- given in `defName`. Finally we evaluate the `inValue` passing in the new variable in the state.
            evaluateValue config nativeFunctions ir variables [] (Value.definitionToValue def)
                |> Result.andThen
                    (\defValue ->
                        evaluateValue config
                            nativeFunctions
                            ir
                            (variables |> Dict.insert defName defValue)
                            []
                            inValue
                    )

        Value.LetRecursion _ defs inValue ->
            -- Recursive let bindings will be evaluated simply by assigning them to variable names and evaluating the
            -- in value using them. The in value evaluation will evaluate the recursive definitions.
            let
                defVariables : Dict Name RawValue
                defVariables =
                    defs |> Dict.map (\_ def -> Value.definitionToValue def)
            in
            evaluateValue config
                nativeFunctions
                ir
                (Dict.union defVariables variables)
                []
                inValue

        Value.Destructure _ bindPattern bindValue inValue ->
            -- A destructure can be evaluated by evaluating the bind value, matching it against the bind pattern and
            -- finally evaluating the in value using the variables from the bind pattern.
            evaluateValue config nativeFunctions ir variables [] bindValue
                |> Result.andThen (matchPattern bindPattern >> Result.mapError (BindPatternDidNotMatch bindValue))
                |> Result.andThen
                    (\bindVariables ->
                        evaluateValue config
                            nativeFunctions
                            ir
                            (Dict.union bindVariables variables)
                            []
                            inValue
                    )

        (Value.IfThenElse _ condition thenBranch elseBranch) as ifThenElse ->
            if allowPartial then
                -- When allow partial is true, we first evaluate all the conditions.
                -- We need to go through the evaluated conditions, looking for either a True
                -- or a partially evaluated condition. If we find a True before a partially evaluated condition, we take
                -- that branch. If we find a condition that was only partially evaluated first, then we evaluate that and
                -- all other branches and preserve the IfThenElse structure with the evaluated branches and conditions.
                -- If neither was found, we take the else branch.
                let
                    flatten : RawValue -> List ( RawValue, RawValue ) -> ( List ( RawValue, RawValue ), RawValue )
                    flatten v branchesSoFar =
                        case v of
                            Value.IfThenElse _ cond then_ else_ ->
                                ( cond, then_ )
                                    :: branchesSoFar
                                    |> flatten else_

                            finalElse ->
                                ( branchesSoFar, finalElse )

                    ( flattened, finalElseBranch ) =
                        flatten ifThenElse []

                    chooseBranch : List ( RawValue, RawValue ) -> Result Error RawValue
                    chooseBranch conditionByBranches =
                        case conditionByBranches of
                            [] ->
                                -- We never encountered a partially evaluated condition or a True
                                -- evaluate the else branch
                                evaluateValue config nativeFunctions ir variables [] finalElseBranch

                            ( Value.Literal _ (BoolLiteral True), branch ) :: _ ->
                                -- We met a True first, evaluate this branch
                                evaluateValue config nativeFunctions ir variables [] branch

                            ( Value.Literal _ (BoolLiteral False), _ ) :: rest ->
                                -- Unreachable branch, skip entirely and continue looking
                                -- for True or a partially evaluated condition
                                chooseBranch rest

                            _ ->
                                -- We encountered a partially evaluated condition,
                                -- evaluate all branches and wrap with an IfThenElse
                                -- TODO we could remove all the unreachable branches
                                conditionByBranches
                                    |> -- starting from the tail, chain the values into an IfThenElse
                                       List.foldr
                                        (\( cond, branch ) ->
                                            Result.map2 (Value.IfThenElse () cond)
                                                (evaluateValue config nativeFunctions ir variables [] branch)
                                        )
                                        (evaluateValue config nativeFunctions ir variables [] finalElseBranch)
                in
                flattened
                    |> List.reverse
                    |> List.map
                        (\( cond, branch ) ->
                            -- evaluate all the conditions
                            evaluateValue config nativeFunctions ir variables [] cond
                                |> Result.map (\evaluatedCond -> ( evaluatedCond, branch ))
                        )
                    -- If any of those fails we return the first failure.
                    |> ResultList.keepFirstError
                    |> Result.andThen chooseBranch

            else
                -- When allow partial is false, If-then-else evaluation becomes trivial: you evaluate the condition
                -- and depending on the result you evaluate one of the branches
                evaluateValue config nativeFunctions ir variables [] condition
                    |> Result.andThen
                        (\conditionValue ->
                            case conditionValue of
                                Value.Literal _ (BoolLiteral conditionTrue) ->
                                    let
                                        branchToFollow : RawValue
                                        branchToFollow =
                                            if conditionTrue then
                                                thenBranch

                                            else
                                                elseBranch
                                    in
                                    evaluateValue config nativeFunctions ir variables [] branchToFollow

                                _ ->
                                    Err (IfThenElseConditionShouldEvaluateToBool condition conditionValue)
                        )

        Value.PatternMatch _ subjectValue cases ->
            -- For a pattern match we first need to evaluate the subject value then step through the cases, match
            -- each pattern until we find a matching case and when we do evaluate the body.
            -- However, when partial evaluation is turned on and no case match, we evaluate the body of all branches
            -- and wrap it back into a PatternMatch.
            let
                evaluatedSubjectResult =
                    evaluateValue config nativeFunctions ir variables [] subjectValue

                collectNewVars : Pattern () -> Variables
                collectNewVars pattern =
                    case pattern of
                        Value.WildcardPattern _ ->
                            variables

                        Value.AsPattern _ patt name ->
                            Dict.insert name (Value.Variable () name) variables
                                |> Dict.union (collectNewVars patt)

                        Value.TuplePattern _ patterns ->
                            List.foldl (\pat vars -> collectNewVars pat |> Dict.union vars) variables patterns

                        Value.ConstructorPattern _ _ patterns ->
                            List.foldl (\pat vars -> collectNewVars pat |> Dict.union vars) variables patterns

                        Value.EmptyListPattern _ ->
                            variables

                        Value.HeadTailPattern _ patt1 patt2 ->
                            Dict.union (collectNewVars patt1) variables |> Dict.union (collectNewVars patt2)

                        Value.LiteralPattern _ _ ->
                            variables

                        Value.UnitPattern _ ->
                            variables

                findMatch : List ( Pattern (), RawValue ) -> RawValue -> Result Error RawValue
                findMatch remainingCases evaluatedSubject =
                    case remainingCases of
                        ( nextPattern, nextBody ) :: restOfCases ->
                            case matchPattern nextPattern evaluatedSubject of
                                Ok patternVariables ->
                                    evaluateValue config
                                        nativeFunctions
                                        ir
                                        (Dict.union patternVariables variables)
                                        []
                                        nextBody

                                Err _ ->
                                    findMatch restOfCases evaluatedSubject

                        [] ->
                            Err (NoPatternsMatch evaluatedSubject (cases |> List.map Tuple.first))
            in
            evaluatedSubjectResult
                -- if the subject value was not evaluated further and we allow partial evaluation,
                -- then we exit with the entire evaluation with the
                |> Result.andThen
                    (\evalSubject ->
                        if allowPartial then
                            cases
                                |> List.foldr
                                    (\( patt, body ) evaluatedBranchesSoFar ->
                                        Result.map2 (\evaluatedBody lst -> ( patt, evaluatedBody ) :: lst)
                                            -- evaluate each body with any new variables from it's pattern added to the state
                                            (evaluateValue config nativeFunctions ir (collectNewVars patt) [] body)
                                            evaluatedBranchesSoFar
                                    )
                                    (Ok [])
                                |> Result.map (Value.PatternMatch () evalSubject)

                        else
                            findMatch cases evalSubject
                    )

        Value.UpdateRecord _ subjectValue fieldUpdates ->
            -- To update a record first we need to evaluate the subject value, then extract the record fields and
            -- finally replace all updated fields with the new values
            evaluateValue config nativeFunctions ir variables [] subjectValue
                |> Result.andThen
                    (\evaluatedSubjectValue ->
                        case evaluatedSubjectValue of
                            Value.Record _ fields ->
                                -- Once we hve the fields we fold through the field updates
                                fieldUpdates
                                    |> Dict.toList
                                    |> List.foldl
                                        -- For each field update we update a single field and return the new field dictionary
                                        (\( fieldName, newFieldValue ) fieldsResultSoFar ->
                                            fieldsResultSoFar
                                                |> Result.andThen
                                                    (\fieldsSoFar ->
                                                        -- Before we update the field we check if it exists. We do not
                                                        -- want to create new fields as part of an update.
                                                        fieldsSoFar
                                                            |> Dict.get fieldName
                                                            |> Result.fromMaybe (FieldNotFound subjectValue fieldName)
                                                            |> Result.andThen
                                                                (\_ ->
                                                                    -- Before we replace the field value we need to
                                                                    -- evaluate the updated value.
                                                                    evaluateValue config nativeFunctions ir variables [] newFieldValue
                                                                        |> Result.map
                                                                            (\evaluatedNewFieldValue ->
                                                                                fieldsSoFar
                                                                                    |> Dict.insert
                                                                                        fieldName
                                                                                        evaluatedNewFieldValue
                                                                            )
                                                                )
                                                    )
                                        )
                                        -- We start with the original fields
                                        (Ok fields)
                                    |> Result.map (Value.Record ())

                            partiallyEvaluated ->
                                if allowPartial then
                                    -- Evaluate all updates and wrap it into an UpdateRecord along with the partially
                                    -- evaluated record subject
                                    fieldUpdates
                                        |> Dict.foldl
                                            (\k v ->
                                                Result.map2
                                                    (Dict.insert k)
                                                    (evaluateValue config nativeFunctions ir variables [] v)
                                            )
                                            (Ok Dict.empty)
                                        |> Result.map (Value.UpdateRecord () partiallyEvaluated)

                                else
                                    Err (RecordExpected subjectValue evaluatedSubjectValue)
                    )

        Value.Unit _ ->
            -- Unit cannot be evaluated any further
            Ok value


{-| Matches a value against a pattern recursively. It either returns an error if there is a mismatch or a dictionary of
variable names to values extracted out of the pattern.

During partial evaluation, we accept the possibility of values that may not match the pattern in which case, we try to
extract variables regardless of matches.

-}
matchPattern : Pattern () -> RawValue -> Result PatternMismatch Variables
matchPattern pattern value =
    let
        error : Result PatternMismatch Variables
        error =
            Err (PatternMismatch pattern value)
    in
    case pattern of
        Value.WildcardPattern _ ->
            -- Wildcard patterns will always succeed and produce any variables
            Ok Dict.empty

        Value.AsPattern _ subjectPattern alias ->
            -- As patterns always succeed and will assign the alias as variable name to the value passed in
            matchPattern subjectPattern value
                |> Result.map
                    (\subjectVariables ->
                        subjectVariables
                            |> Dict.insert alias value
                    )

        Value.TuplePattern _ elemPatterns ->
            case value of
                -- A tuple pattern only matches on tuples
                Value.Tuple _ elemValues ->
                    let
                        patternLength =
                            List.length elemPatterns

                        valueLength =
                            List.length elemValues
                    in
                    -- The number of elements in the pattern and the value have to match
                    if patternLength == valueLength then
                        -- We recursively match each element
                        List.map2 matchPattern elemPatterns elemValues
                            -- If there is a mismatch we return the first error
                            |> ResultList.keepFirstError
                            -- If the match is successful we union the variables returned
                            |> Result.map (List.foldl Dict.union Dict.empty)

                    else
                        error

                _ ->
                    error

        Value.ConstructorPattern _ ctorPatternFQName argPatterns ->
            -- When we match on a constructor pattern we need to match the constructor name and all the arguments
            let
                -- Constructor invocations are curried (wrapped into Apply as many times as many arguments there are)
                -- so we need to uncurry them before matching. Constructor matches on the other hand are not curried
                -- since it's not allowed to partially apply them in a pattern.
                uncurry : Value ta va -> ( Value ta va, List (Value ta va) )
                uncurry v =
                    case v of
                        Value.Apply _ f a ->
                            let
                                ( nestedV, nestedArgs ) =
                                    uncurry f
                            in
                            ( nestedV, nestedArgs ++ [ a ] )

                        _ ->
                            ( v, [] )

                ( ctorValue, argValues ) =
                    uncurry value
            in
            case ctorValue of
                Value.Constructor _ ctorFQName ->
                    -- We first check the constructor name
                    if ctorPatternFQName == ctorFQName then
                        let
                            patternLength =
                                List.length argPatterns

                            valueLength =
                                List.length argValues
                        in
                        -- Then the arguments
                        if patternLength == valueLength then
                            List.map2 matchPattern argPatterns argValues
                                |> ResultList.keepFirstError
                                |> Result.map (List.foldl Dict.union Dict.empty)

                        else
                            error

                    else
                        error

                _ ->
                    error

        Value.EmptyListPattern _ ->
            -- Empty list pattern only matches on empty lists and does not produce variables
            case value of
                Value.List _ [] ->
                    Ok Dict.empty

                _ ->
                    error

        Value.HeadTailPattern _ headPattern tailPattern ->
            -- Head-tail pattern matches on any list with at least one element
            case value of
                Value.List a (headValue :: tailValue) ->
                    -- We recursively apply the head and tail patterns and union the resulting variables
                    Result.map2 Dict.union
                        (matchPattern headPattern headValue)
                        (matchPattern tailPattern (Value.List a tailValue))

                _ ->
                    error

        Value.LiteralPattern _ matchLiteral ->
            -- Literal matches simply do an exact match on the value and don't produce any variables
            case value of
                Value.Literal _ valueLiteral ->
                    if matchLiteral == valueLiteral then
                        Ok Dict.empty

                    else
                        error

                _ ->
                    error

        Value.UnitPattern _ ->
            -- Unit pattern only matches on unit and does not produce any variables
            case value of
                Value.Unit _ ->
                    Ok Dict.empty

                _ ->
                    error
