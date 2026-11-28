module Morphir.Value.Interpreter exposing
    ( evaluate, evaluateValue, evaluateFunctionValue, matchPattern, Variables
    , Libraries, evaluateWithLibraries, evaluateValueWithLibraries, evaluateFunctionValueWithLibraries
    )

{-| This module contains an interpreter for Morphir expressions. The interpreter takes a piece of logic as input,
evaluates it and returns the resulting data. In Morphir both logic and data is captured as a `Value` so the interpreter
takes a `Value` and returns a `Value` (or an error for invalid expressions):

@docs evaluate, evaluateValue, evaluateFunctionValue, matchPattern, Variables


# Evaluating across packages

A distribution holds only the specifications of its dependencies, so a model that calls a function from another
package needs that package's definition too. Pass the definitions of the dependency packages as `Libraries`.

@docs Libraries, evaluateWithLibraries, evaluateValueWithLibraries, evaluateFunctionValueWithLibraries

-}

import Dict exposing (Dict)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Module as Module
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (Pattern, RawValue, Value, toRawValue)
import Morphir.SDK.ResultList as ResultList
import Morphir.Value.Error exposing (Error(..), PatternMismatch(..))
import Morphir.Value.Native as Native


{-| Dictionary of variable name to value.
-}
type alias Variables =
    Dict Name RawValue


{-| The definitions of the packages a distribution depends on, by package name. Their functions can be evaluated
alongside the distribution's own.
-}
type alias Libraries =
    Dict PackageName (Package.Definition () (Type ()))


{-| -}
evaluateFunctionValue : Dict FQName Native.Function -> Distribution -> FQName -> List (Maybe RawValue) -> Result Error RawValue
evaluateFunctionValue nativeFunctions ir fQName variableValues =
    evaluateFunctionValueWithLibraries nativeFunctions Dict.empty ir fQName variableValues


{-| Same as `evaluateFunctionValue` but the function may also be defined in one of the `Libraries`.
-}
evaluateFunctionValueWithLibraries : Dict FQName Native.Function -> Libraries -> Distribution -> FQName -> List (Maybe RawValue) -> Result Error RawValue
evaluateFunctionValueWithLibraries nativeFunctions libraries ir fQName variableValues =
    lookupValueDefinition libraries ir fQName
        -- If we cannot find the value in the IR we return an error.
        |> Result.fromMaybe (ReferenceNotFound fQName)
        |> Result.andThen
            (\valueDef ->
                let
                    argumentValues : List RawValue
                    argumentValues =
                        List.map (Maybe.withDefault (Value.Unit ())) variableValues

                    inputCount : Int
                    inputCount =
                        List.length valueDef.inputTypes
                in
                evaluateValueWithLibraries nativeFunctions
                    libraries
                    ir
                    (List.map2 Tuple.pair
                        (valueDef.inputTypes
                            |> List.map (\( name, _, _ ) -> name)
                        )
                        argumentValues
                        |> Dict.fromList
                    )
                    -- Arguments beyond the named inputs go to the body. A function whose parameters are patterns, like
                    -- `add (Box a) (Box b)`, has no named inputs and a body of lambdas that take them.
                    (List.drop inputCount argumentValues)
                    (valueDef.body |> toRawValue)
            )


{-| Look up a value definition in the distribution, then in the libraries.
-}
lookupValueDefinition : Libraries -> Distribution -> FQName -> Maybe (Value.Definition () (Type ()))
lookupValueDefinition libraries ir (( packageName, moduleName, localName ) as fQName) =
    case Distribution.lookupValueDefinition fQName ir of
        Just valueDef ->
            Just valueDef

        Nothing ->
            libraries
                |> Dict.get packageName
                |> Maybe.andThen (Package.lookupModuleDefinition moduleName)
                |> Maybe.andThen (Module.lookupValueDefinition localName)


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
    evaluateWithLibraries nativeFunctions Dict.empty ir value


{-| Same as `evaluate` but references may also point to functions defined in the `Libraries`.
-}
evaluateWithLibraries : Dict FQName Native.Function -> Libraries -> Distribution -> RawValue -> Result Error RawValue
evaluateWithLibraries nativeFunctions libraries ir value =
    evaluateValueWithLibraries nativeFunctions libraries ir Dict.empty [] value


{-| Evaluates a value expression recursively in a single pass while keeping track of variables and arguments along the
evaluation.
-}
evaluateValue : Dict FQName Native.Function -> Distribution -> Variables -> List RawValue -> RawValue -> Result Error RawValue
evaluateValue nativeFunctions ir variables arguments value =
    evaluateValueWithLibraries nativeFunctions Dict.empty ir variables arguments value


{-| Same as `evaluateValue` but references may also point to functions defined in the `Libraries`.
-}
evaluateValueWithLibraries : Dict FQName Native.Function -> Libraries -> Distribution -> Variables -> List RawValue -> RawValue -> Result Error RawValue
evaluateValueWithLibraries nativeFunctions libraries ir variables arguments value =
    case value of
        Value.Literal _ _ ->
            -- Literals cannot be evaluated any further
            Ok value

        Value.Constructor _ fQName ->
            arguments
                |> List.map (evaluateValueWithLibraries nativeFunctions libraries ir variables [])
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
                |> List.map (evaluateValueWithLibraries nativeFunctions libraries ir variables [])
                -- If any of those fails we return the first failure.
                |> ResultList.keepFirstError
                -- If nothing fails we wrap the result in a tuple.
                |> Result.map (Value.Tuple ())

        Value.List _ items ->
            -- For a list we need to evaluate each element and return them wrapped back into a list
            items
                -- We evaluate each element separately.
                |> List.map (evaluateValueWithLibraries nativeFunctions libraries ir variables [])
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
                        evaluateValueWithLibraries nativeFunctions libraries ir variables [] fieldValue
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

        Value.Reference _ (( packageName, moduleName, localName ) as fQName) ->
            -- We check if there is a native function first
            case nativeFunctions |> Dict.get ( packageName, moduleName, localName ) of
                Just nativeFunction ->
                    nativeFunction
                        (evaluateValueWithLibraries
                            -- This is the state that will be used when native functions call "eval".
                            -- We need to retain most of the current state but clear out the argument since
                            -- the native function will evaluate completely new expressions.
                            nativeFunctions
                            libraries
                            ir
                            variables
                            []
                        )
                        -- Pass down the arguments we collected before we got here (if we are inside an apply).
                        arguments
                        -- Wrap the error to make it easier to understand where it happened
                        |> Result.mapError (ErrorWhileEvaluatingReference fQName)

                Nothing ->
                    arguments
                        |> List.map
                            (evaluateValueWithLibraries
                                nativeFunctions
                                libraries
                                ir
                                variables
                                []
                            )
                        |> ResultList.keepFirstError
                        -- If this is a reference to another Morphir value we need to look it up and evaluate.
                        |> Result.map (\resultList -> List.map (\result -> Just result) resultList)
                        |> Result.andThen (evaluateFunctionValueWithLibraries nativeFunctions libraries ir fQName)

        Value.Field _ subjectValue fieldName ->
            -- Field selection is evaluated by evaluating the subject first then matching on the resulting record and
            -- getting the field with the specified name.
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] subjectValue
                |> Result.andThen
                    (\evaluatedSubjectValue ->
                        case evaluatedSubjectValue of
                            Value.Record _ fields ->
                                fields
                                    |> Dict.get fieldName
                                    |> Result.fromMaybe (FieldNotFound subjectValue fieldName)

                            _ ->
                                Err (RecordExpected subjectValue evaluatedSubjectValue)
                    )

        Value.FieldFunction _ fieldName ->
            -- A field function expects exactly one argument to be passed through the state as subject value. Otherwise
            -- it behaves exactly like a `Field` expression.
            case arguments of
                [ subjectValue ] ->
                    evaluateValueWithLibraries nativeFunctions libraries ir variables [] subjectValue
                        |> Result.andThen
                            (\evaluatedSubjectValue ->
                                case evaluatedSubjectValue of
                                    Value.Record _ fields ->
                                        fields
                                            |> Dict.get fieldName
                                            |> Result.fromMaybe (FieldNotFound subjectValue fieldName)

                                    _ ->
                                        Err (RecordExpected subjectValue evaluatedSubjectValue)
                            )

                other ->
                    Err (ExactlyOneArgumentExpected other)

        Value.Apply _ function argument ->
            -- When we run into an Apply we simply add the argument to the state and recursively evaluate the function.
            -- When there are multiple arguments there will be another Apply within the function so arguments will be
            -- repeatedly collected until we hit another node (lambda, reference or variable) where the arguments will
            -- be used to execute the calculation.
            evaluateValueWithLibraries
                nativeFunctions
                libraries
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
                -- In Morphir (just like in Elm) you can not pattern-match on the argument of a lambda.
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
                        evaluateValueWithLibraries
                            nativeFunctions
                            libraries
                            ir
                            (Dict.union argumentVariables variables)
                            (arguments |> List.tail |> Maybe.withDefault [])
                            body
                    )

        Value.LetDefinition _ defName def inValue ->
            -- We evaluate a let definition by first evaluating the definition, then assigning it to the variable name
            -- given in `defName`. Finally we evaluate the `inValue` passing in the new variable in the state.
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] (Value.definitionToValue def)
                |> Result.andThen
                    (\defValue ->
                        evaluateValueWithLibraries
                            nativeFunctions
                            libraries
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
            evaluateValueWithLibraries
                nativeFunctions
                libraries
                ir
                (Dict.union defVariables variables)
                []
                inValue

        Value.Destructure _ bindPattern bindValue inValue ->
            -- A destructure can be evaluated by evaluating the bind value, matching it against the bind pattern and
            -- finally evaluating the in value using the variables from the bind pattern.
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] bindValue
                |> Result.andThen (matchPattern bindPattern >> Result.mapError (BindPatternDidNotMatch bindValue))
                |> Result.andThen
                    (\bindVariables ->
                        evaluateValueWithLibraries
                            nativeFunctions
                            libraries
                            ir
                            (Dict.union bindVariables variables)
                            []
                            inValue
                    )

        Value.IfThenElse _ condition thenBranch elseBranch ->
            -- If then else evaluation is trivial: you evaluate the condition and depending on the result you evaluate
            -- one of the branches
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] condition
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
                                evaluateValueWithLibraries nativeFunctions libraries ir variables [] branchToFollow

                            _ ->
                                Err (IfThenElseConditionShouldEvaluateToBool condition conditionValue)
                    )

        Value.PatternMatch _ subjectValue cases ->
            -- For a pattern match we first need to evaluate the subject value then step through th cases, match
            -- each pattern until we find a matching case and when we do evaluate the body
            let
                findMatch : List ( Pattern (), RawValue ) -> RawValue -> Result Error RawValue
                findMatch remainingCases evaluatedSubject =
                    case remainingCases of
                        ( nextPattern, nextBody ) :: restOfCases ->
                            case matchPattern nextPattern evaluatedSubject of
                                Ok patternVariables ->
                                    evaluateValueWithLibraries
                                        nativeFunctions
                                        libraries
                                        ir
                                        (Dict.union patternVariables variables)
                                        []
                                        nextBody

                                Err _ ->
                                    findMatch restOfCases evaluatedSubject

                        [] ->
                            Err (NoPatternsMatch evaluatedSubject (cases |> List.map Tuple.first))
            in
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] subjectValue
                |> Result.andThen (findMatch cases)

        Value.UpdateRecord _ subjectValue fieldUpdates ->
            -- To update a record first we need to evaluate the subject value, then extract the record fields and
            -- finally replace all updated fields with the new values
            evaluateValueWithLibraries nativeFunctions libraries ir variables [] subjectValue
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
                                                                    evaluateValueWithLibraries nativeFunctions libraries ir variables [] newFieldValue
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

                            _ ->
                                Err (RecordExpected subjectValue evaluatedSubjectValue)
                    )

        Value.Unit _ ->
            -- Unit cannot be evaluated any further
            Ok value


{-| Matches a value against a pattern recursively. It either returns an error if there is a mismatch or a dictionary of
variable names to values extracted out of the pattern.
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
