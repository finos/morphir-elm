module Morphir.Spark.AST.Codec exposing (..)

import Json.Encode as Encode
import Morphir.IR.FQName as FQName
import Morphir.IR.Literal.Codec exposing (encodeLiteral)
import Morphir.IR.Name as Name
import Morphir.IR.Type as IRType
import Morphir.IR.Type.Codec exposing (encodeType)
import Morphir.IR.Value.Codec exposing (encodePattern, encodeValue)
import Morphir.Spark.AST exposing (Error(..), Expression(..), NamedExpressions)


typeAttributeEncoder : ta -> Encode.Value
typeAttributeEncoder =
    always Encode.null


valueAttributeEncoder : IRType.Type () -> Encode.Value
valueAttributeEncoder =
    encodeType typeAttributeEncoder


encodeError : Error -> Encode.Value
encodeError error =
    case error of
        UnhandledValue typedValue ->
            Encode.list identity
                [ Encode.string "UnhandledValue"
                , encodeValue typeAttributeEncoder valueAttributeEncoder typedValue
                ]

        FunctionNotFound fQName ->
            Encode.list Encode.string
                [ "FunctionNotFound"
                , FQName.toString fQName
                ]

        UnsupportedOperatorReference fQName ->
            Encode.list Encode.string
                [ "UnsupportedOperatorReference"
                , FQName.toString fQName
                ]

        LambdaExpected typedValue ->
            Encode.list identity
                [ Encode.string "LambdaExpected"
                , encodeValue typeAttributeEncoder valueAttributeEncoder typedValue
                ]

        UnsupportedSDKFunction fQName ->
            Encode.list Encode.string
                [ "UnsupportedSDKFunction"
                , FQName.toString fQName
                ]

        EmptyPatternMatch ->
            Encode.string "EmptyPatternMatch"

        UnhandledPatternMatch ( pattern, typedValue ) ->
            Encode.list identity
                [ Encode.string "UnhandledPatternMatch"
                , encodePattern valueAttributeEncoder pattern
                , encodeValue typeAttributeEncoder valueAttributeEncoder typedValue
                ]

        UnhandledNamedExpressions namedExpressions ->
            Encode.list identity
                [ Encode.string "UnhandledNamedExpressions"
                , encodeNamedExpression namedExpressions
                ]

        UnhandledObjectExpression objectExpression ->
            Debug.todo "implement"

        UnhandledExpression expression ->
            Encode.list identity
                [ Encode.string "UnhandledExpression"
                , encodeExpression expression
                ]

        AggregationError constructAggregationError ->
            Debug.todo "implement"

        ObjectExpressionsNotUnique objectExpressions ->
            Debug.todo "implement"


encodeNamedExpression : NamedExpressions -> Encode.Value
encodeNamedExpression namedExpressions =
    namedExpressions
        |> Encode.list
            (\( name, expression ) ->
                Encode.list identity
                    [ Encode.string (Name.toTitleCase name)
                    , encodeExpression expression
                    ]
            )


encodeExpression : Expression -> Encode.Value
encodeExpression expression =
    case expression of
        Column identifier ->
            Encode.list Encode.string
                [ "Column"
                , identifier
                ]

        Literal literal ->
            Encode.list identity
                [ Encode.string "Literal"
                , encodeLiteral literal
                ]

        Variable id ->
            Encode.list Encode.string
                [ "Variable"
                , id
                ]

        Not expr ->
            Encode.list identity
                [ Encode.string "Not"
                , encodeExpression expr
                ]

        BinaryOperation op leftExp rightExp ->
            Encode.list identity
                [ Encode.string "BinaryOperation"
                , Encode.string op
                , encodeExpression leftExp
                , encodeExpression rightExp
                ]

        WhenOtherwise conditionExp thenBranchExp otherwiseBranch ->
            Encode.list identity
                [ Encode.string "WhenOtherwise"
                , encodeExpression conditionExp
                , encodeExpression thenBranchExp
                , encodeExpression otherwiseBranch
                ]

        Method target methodName args ->
            Encode.list identity
                [ Encode.string "Method"
                , encodeExpression target
                , Encode.string methodName
                , Encode.list encodeExpression args
                ]

        Function functionName args ->
            Encode.list identity
                [ Encode.string "Function"
                , Encode.string functionName
                , Encode.list encodeExpression args
                ]
