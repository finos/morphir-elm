{-
   Copyright 2020 Morgan Stanley

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}


module Morphir.Spark.Backend exposing (..)

{-| This module encapsulates the Spark backend. It takes the Morphir IR as the input and returns an in-memory
representation of files generated. The consumer is responsible for getting the input IR and saving the output
to the file-system.

This uses a two-step process

1.  Map value nodes to the Spark IR
2.  Map the Spark IR to scala value nodes.

@docs mapDistribution, mapFunctionDefinition, mapValue, mapObjectExpression, mapExpression, mapNamedExpression, mapLiteral, mapFQName

-}

import Dict exposing (Dict)
import Json.Encode as Encode
import Morphir.File.FileMap exposing (FileMap)
import Morphir.IR as IR exposing (IR)
import Morphir.IR.AccessControlled as AccessControlled exposing (Access(..), AccessControlled)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented as Documented exposing (Documented)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Type.Codec as TypeCodec
import Morphir.IR.Value as Value exposing (TypedValue, Value)
import Morphir.SDK.ResultList as ResultList
import Morphir.Scala.AST as Scala
import Morphir.Scala.Feature.Core as ScalaBackend
import Morphir.Scala.PrettyPrinter as PrettyPrinter
import Morphir.Spark.API as Spark
import Morphir.Spark.AST as SparkAST exposing (..)
import Morphir.Spark.AST.Codec as ASTCodec


type alias Options =
    { modulesToProcess : Maybe (List ModuleName)
    , entryPoints : List FQName
    }


type Error
    = FunctionNotFound FQName
    | UnknownArgumentType (Type ())
    | MappingError FQName SparkAST.Error
    | EntryPointNotFound FQName


{-| Entry point for the Spark backend. It takes the Morphir IR as the input and returns an in-memory
representation of files generated.
-}
mapDistribution : Options -> Distribution -> Result (List String) FileMap
mapDistribution opts distro =
    let
        fixedDistro =
            fixDistribution distro
    in
    case fixedDistro of
        Distribution.Library packageName _ packageDef ->
            let
                ir : IR
                ir =
                    IR.fromDistribution fixedDistro

                modulesToProcess : Dict ModuleName (AccessControlled (Module.Definition () (Type ())))
                modulesToProcess =
                    case opts.modulesToProcess of
                        Just modNames ->
                            packageDef.modules
                                |> Dict.filter (\k _ -> List.member k modNames)

                        Nothing ->
                            packageDef.modules

                _ =
                    Debug.log "INFO:" ("Processing " ++ (Dict.size modulesToProcess |> String.fromInt) ++ " modules")
            in
            modulesToProcess
                |> Dict.toList
                |> List.map
                    (\( moduleName, accessControlledModuleDef ) ->
                        let
                            packagePath : List String
                            packagePath =
                                packageName
                                    ++ moduleName
                                    |> List.map (Name.toCamelCase >> String.toLower)

                            objectResult : Result Error Scala.TypeDecl
                            objectResult =
                                accessControlledModuleDef.value.values
                                    |> Dict.toList
                                    |> List.map
                                        (\( valueName, accCntrldDcmntedValueDef ) ->
                                            mapFunctionDefinition ir ( packageName, moduleName, valueName ) accCntrldDcmntedValueDef.value.value
                                                |> Result.map Scala.withoutAnnotation
                                        )
                                    |> ResultList.keepFirstError
                                    |> Result.map
                                        (\s ->
                                            Scala.Object
                                                { modifiers = []
                                                , name = "SparkJobs"
                                                , extends = []
                                                , members = s
                                                , body = Nothing
                                                }
                                        )

                            compilationUnitResult : Result Error Scala.CompilationUnit
                            compilationUnitResult =
                                objectResult
                                    |> Result.map
                                        (\object ->
                                            { dirPath = packagePath
                                            , fileName = "SparkJobs.scala"
                                            , packageDecl = packagePath
                                            , imports = []
                                            , typeDecls = [ Scala.Documented Nothing (Scala.withoutAnnotation object) ]
                                            }
                                        )
                        in
                        compilationUnitResult
                            |> Result.map
                                (\compilationUnit ->
                                    ( ( packagePath, "SparkJobs.scala" )
                                    , PrettyPrinter.mapCompilationUnit (PrettyPrinter.Options 2 80) compilationUnit
                                    )
                                )
                            |> Result.mapError (encodeError >> Encode.encode 0)
                    )
                |> ResultList.keepAllErrors
                |> Result.map Dict.fromList


{-| Entry point for the Spark backend. It takes the Morphir IR as the input and returns an in-memory
representation of files generated.
-}
mapDistribution2 : Options -> Distribution -> Result (List String) FileMap
mapDistribution2 opts distro =
    let
        fixedDistro =
            fixDistribution distro
    in
    case fixedDistro of
        Distribution.Library packageName _ packageDef ->
            let
                ir : IR
                ir =
                    IR.fromDistribution fixedDistro

                entryPoints : List (Result Error ( FQName, Value.Definition () (Type ()) ))
                entryPoints =
                    opts.entryPoints
                        |> List.map
                            (\fqn ->
                                IR.lookupValueDefinition fqn ir
                                    |> Maybe.map (Tuple.pair fqn)
                                    |> Result.fromMaybe (EntryPointNotFound fqn)
                            )

                _ =
                    Debug.log "INFO:" ("Processing " ++ (List.length entryPoints |> String.fromInt) ++ " values")
            in
            entryPoints
                |> List.map
                    (Result.andThen
                        (\( ( valPackagePath, valModulePath, valName ), valueDef ) ->
                            let
                                packagePath : List String
                                packagePath =
                                    packageName
                                        ++ valModulePath
                                        |> List.map (Name.toCamelCase >> String.toLower)

                                objectResult : Result Error Scala.TypeDecl
                                objectResult =
                                    valueDef
                                        |> simplifyValueDefinition ir
                                        |> mapFunctionDefinition2 ir ( valPackagePath, valModulePath, valName )
                                        |> Result.map Scala.withoutAnnotation
                                        |> Result.map
                                            (\members ->
                                                Scala.Object
                                                    { modifiers = []
                                                    , name = "SparkJobs"
                                                    , extends = []
                                                    , members = [ members ]
                                                    , body = Nothing
                                                    }
                                            )

                                compilationUnitResult : Result Error Scala.CompilationUnit
                                compilationUnitResult =
                                    objectResult
                                        |> Result.map
                                            (\object ->
                                                { dirPath = packagePath
                                                , fileName = "SparkJobs.scala"
                                                , packageDecl = packagePath
                                                , imports = []
                                                , typeDecls = [ Scala.Documented Nothing (Scala.withoutAnnotation object) ]
                                                }
                                            )
                            in
                            compilationUnitResult
                                |> Result.map
                                    (\compilationUnit ->
                                        ( ( packagePath, "SparkJobs.scala" )
                                        , PrettyPrinter.mapCompilationUnit (PrettyPrinter.Options 2 80) compilationUnit
                                        )
                                    )
                        )
                    )
                |> List.map (Result.mapError (encodeError >> Encode.encode 0))
                |> ResultList.keepAllErrors
                |> Result.map Dict.fromList


{-| Fix up the modules in the Distribution prior to generating Spark code
-}
fixDistribution : Distribution -> Distribution
fixDistribution distribution =
    case distribution of
        Distribution.Library libraryPackageName dependencies packageDef ->
            let
                updatedModules =
                    packageDef.modules
                        |> Dict.toList
                        |> List.map
                            (\( moduleName, accessControlledModuleDef ) ->
                                let
                                    updatedAccessControlledModuleDef =
                                        accessControlledModuleDef
                                            |> AccessControlled.map fixModuleDef
                                in
                                ( moduleName, updatedAccessControlledModuleDef )
                            )
                        |> Dict.fromList
            in
            Distribution.Library libraryPackageName dependencies { packageDef | modules = updatedModules }


{-| Fix up the values in a Module Definition prior to generating Spark code
-}
fixModuleDef : Module.Definition ta va -> Module.Definition ta va
fixModuleDef moduleDef =
    let
        updatedValues =
            moduleDef.values
                |> Dict.toList
                |> List.map
                    (\( valueName, accessControlledValueDef ) ->
                        let
                            updatedAccessControlledValueDef =
                                accessControlledValueDef
                                    |> AccessControlled.map
                                        (\documentedValueDef ->
                                            documentedValueDef
                                                |> Documented.map
                                                    (\valueDef ->
                                                        { valueDef | body = mapEnumToLiteral valueDef.body }
                                                    )
                                        )
                        in
                        ( valueName, updatedAccessControlledValueDef )
                    )
                |> Dict.fromList
    in
    { moduleDef | values = updatedValues }


{-| Replace no argument union constructors which correspond to enums, with string literals.
-}
mapEnumToLiteral : Value ta va -> Value ta va
mapEnumToLiteral value =
    value
        |> Value.rewriteValue
            (\currentValue ->
                case currentValue of
                    Value.Constructor va fqn ->
                        let
                            literal =
                                fqn
                                    |> FQName.getLocalName
                                    |> Name.toTitleCase
                                    |> StringLiteral
                                    |> Value.Literal va
                        in
                        Just literal

                    _ ->
                        Nothing
            )


{-| Maps function definitions defined within the current package to scala
-}
mapFunctionDefinition : IR -> FQName -> Value.Definition () (Type ()) -> Result Error Scala.MemberDecl
mapFunctionDefinition ir (( _, _, localFunctionName ) as fqName) valueDefinition =
    let
        mapFunctionInputs : List ( Name, va, Type () ) -> Result Error (List Scala.ArgDecl)
        mapFunctionInputs inputTypes =
            inputTypes
                |> List.map
                    (\( argName, _, argType ) ->
                        case argType of
                            Type.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "list" ] ], [ "list" ] ) [ _ ] ->
                                Ok
                                    { modifiers = []
                                    , tpe = Spark.dataFrame
                                    , name = Name.toCamelCase argName
                                    , defaultValue = Nothing
                                    }

                            other ->
                                Err (UnknownArgumentType other)
                    )
                |> ResultList.keepFirstError
    in
    Result.map2
        (\scalaArgs scalaFunctionBody ->
            Scala.FunctionDecl
                { modifiers = []
                , name = localFunctionName |> Name.toCamelCase
                , typeArgs = []
                , args = [ scalaArgs ]
                , returnType = Just Spark.dataFrame
                , body = Just scalaFunctionBody
                }
        )
        (mapFunctionInputs valueDefinition.inputTypes)
        (mapValue ir fqName valueDefinition.body)


{-| Maps morphir values to scala values
-}
mapValue : IR -> FQName -> TypedValue -> Result Error Scala.Value
mapValue ir fqn body =
    body
        |> SparkAST.objectExpressionFromValue ir
        |> Result.mapError (MappingError fqn)
        |> Result.andThen mapObjectExpressionToScala


type DefinitionType
    = Transformation
    | Aggregation
    | JoinFn
    | Unhandled


definitionType : IR -> Value.Definition () (Type ()) -> DefinitionType
definitionType ir valueDef =
    if isTransformation ir valueDef then
        Transformation

    else if isTransformationWithConfig ir valueDef then
        Transformation

    else
        Unhandled


isTransformation : IR -> Value.Definition () (Type ()) -> Bool
isTransformation ir valDef =
    List.all
        (\( _, _, tpe ) ->
            isDataTable ir tpe
        )
        valDef.inputTypes
        && isDataTable ir valDef.outputType


isTransformationWithConfig : IR -> Value.Definition () (Type ()) -> Bool
isTransformationWithConfig ir valDef =
    List.any
        (\( _, _, tpe ) ->
            isDataTable ir tpe
        )
        valDef.inputTypes
        && isDataTable ir valDef.outputType


isDataTable : IR -> Type () -> Bool
isDataTable ir tpe =
    let
        isList ref =
            ref == ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "list" ] ], [ "list" ] )

        isSimpleType : Type () -> Bool
        isSimpleType t =
            case t of
                Type.Reference () fQName [] ->
                    IR.lookupTypeSpecification fQName ir
                        |> Maybe.map
                            (\tpeSpec ->
                                case tpeSpec of
                                    Type.TypeAliasSpecification [] innerTpe ->
                                        isSimpleType innerTpe

                                    _ ->
                                        False
                            )
                        |> Maybe.withDefault False

                Type.Tuple () types ->
                    types
                        |> List.all isSimpleType

                _ ->
                    False

        isTableDef : Type () -> Bool
        isTableDef tableDef =
            case tableDef of
                Type.Reference () ref [] ->
                    IR.lookupTypeSpecification ref ir
                        |> Maybe.map
                            (\tpeSpec ->
                                case tpeSpec of
                                    Type.TypeAliasSpecification [] innerTpe ->
                                        isTableDef innerTpe

                                    _ ->
                                        False
                            )
                        |> Maybe.withDefault False

                Type.Record () fields ->
                    fields
                        |> List.all (.tpe >> isSimpleType)

                _ ->
                    False
    in
    case tpe of
        Type.Reference () fqn [ arg ] ->
            isList fqn && isTableDef arg

        _ ->
            False


{-| Maps function definitions defined within the current package to scala
Takes into account the input types and output type of the definition to figure out what kind of
scala object should be created
-}
mapFunctionDefinition2 : IR -> FQName -> Value.Definition () (Type ()) -> Result Error Scala.MemberDecl
mapFunctionDefinition2 ir (( _, _, localFunctionName ) as fqName) valueDefinition =
    let
        mapFunctionInputs : List ( Name, va, Type () ) -> Result Error (List Scala.ArgDecl)
        mapFunctionInputs inputTypes =
            inputTypes
                |> List.map
                    (\( argName, _, argType ) ->
                        case argType of
                            Type.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "list" ] ], [ "list" ] ) [ _ ] ->
                                Ok
                                    { modifiers = []
                                    , tpe = Spark.dataFrame
                                    , name = Name.toCamelCase argName
                                    , defaultValue = Nothing
                                    }

                            other ->
                                Err (UnknownArgumentType other)
                    )
                |> ResultList.keepFirstError
    in
    case definitionType ir valueDefinition of
        Transformation ->
            Result.map2
                (\scalaArgs scalaFunctionBody ->
                    Scala.FunctionDecl
                        { modifiers = []
                        , name = localFunctionName |> Name.toCamelCase
                        , typeArgs = []
                        , args = [ scalaArgs ]
                        , returnType = Just Spark.dataFrame
                        , body = Just scalaFunctionBody
                        }
                )
                (mapFunctionInputs valueDefinition.inputTypes)
                (mapValue2 ir fqName valueDefinition.body)

        Aggregation ->
            Debug.todo "Implement this"

        Unhandled ->
            Debug.todo "Implement this"

        JoinFn ->
            Debug.todo "Implement this"


{-| Maps morphir values to scala values
-}
mapValue2 : IR -> FQName -> TypedValue -> Result Error Scala.Value
mapValue2 ir fqn body =
    body
        |> SparkAST.objectExpressionFromValue ir
        |> Result.mapError (MappingError fqn)
        |> Result.andThen mapObjectExpressionToScala


simplifyValueDefinition : IR -> Value.Definition () (Type ()) -> Value.Definition () (Type ())
simplifyValueDefinition ir definition =
    let
        rewrittenValueDef =
            definition
                |> Value.mapDefinition Ok
                    (Ok << simplifyValue ir)

        _ =
            Debug.log "Rewritten Value Definition Body"
                (Result.map (Value.toString << .body) rewrittenValueDef)
    in
    definition
        |> Value.mapDefinition Ok
            (Ok << simplifyValue ir)
        |> Result.withDefault definition


simplifyValue : IR -> Value () (Type ()) -> Value () (Type ())
simplifyValue ir value =
    case value of
        Value.Literal _ _ ->
            value

        Value.Constructor _ _ ->
            value

        Value.Tuple va values ->
            values
                |> List.map (simplifyValue ir)
                |> Value.Tuple va

        Value.List va values ->
            values
                |> List.map (simplifyValue ir)
                |> Value.Tuple va

        Value.Record va keyByValues ->
            keyByValues
                |> Dict.map (\_ -> simplifyValue ir)
                |> Value.Record va

        Value.Variable _ _ ->
            value

        Value.Reference _ fQName ->
            let
                isMorphirSDKReference =
                    case fQName of
                        ( [ [ "morphir" ], [ "s", "d", "k" ] ], _, _ ) ->
                            True

                        _ ->
                            False
            in
            if isMorphirSDKReference then
                value

            else
                case IR.lookupValueDefinition fQName ir of
                    Just valueDef ->
                        valueDef.body
                            |> simplifyValue ir

                    Nothing ->
                        value

        Value.Field _ _ _ ->
            value

        Value.FieldFunction _ _ ->
            value

        Value.Lambda va pattern body ->
            simplifyValue ir body
                |> Value.Lambda va pattern

        Value.LetDefinition _ name definition v ->
            inlineLetDef [] [] value

        Value.LetRecursion _ dict v ->
            value

        Value.Destructure _ _ _ _ ->
            value

        Value.IfThenElse va condVal thenVal elseVal ->
            Value.IfThenElse va
                (simplifyValue ir condVal)
                (simplifyValue ir thenVal)
                (simplifyValue ir elseVal)

        Value.PatternMatch va val list ->
            list
                |> List.map (Tuple.mapSecond (simplifyValue ir))
                |> Value.PatternMatch va (simplifyValue ir val)

        Value.UpdateRecord va rec update ->
            update
                |> Dict.map (\_ -> simplifyValue ir)
                |> Value.UpdateRecord va rec

        Value.Unit _ ->
            value

        Value.Apply _ _ _ ->
            case collectArgValues value [] of
                ( args, (Value.Reference _ ( [ [ "morphir" ], [ "s", "d", "k" ] ], _, _ )) as finalTarget ) ->
                    args
                        |> List.map (Tuple.mapFirst (simplifyValue ir))
                        |> List.foldl (\( arg, va ) t -> Value.Apply va t arg) finalTarget

                ( args, Value.Reference _ fQName ) ->
                    args
                        |> List.map (Tuple.mapFirst (simplifyValue ir))
                        |> (\simplifiedArgs ->
                                IR.lookupValueDefinition fQName ir
                                    |> Maybe.map
                                        (\{ inputTypes, body } ->
                                            let
                                                paramNames =
                                                    inputTypes
                                                        |> List.map (\( n, _, _ ) -> n)
                                            in
                                            inlineArguments paramNames (List.map Tuple.first simplifiedArgs) body
                                                |> simplifyValue ir
                                        )
                                    |> Maybe.withDefault value
                           )

                _ ->
                    value


{-| Inline simple let bindings
-}
inlineLetDef : List Name -> List TypedValue -> TypedValue -> TypedValue
inlineLetDef names letValues v =
    case v of
        Value.LetDefinition va name def inValue ->
            let
                inlined : TypedValue
                inlined =
                    inlineArguments names letValues def.body
            in
            inlineLetDef
                (List.append names [ name ])
                ({ def | body = inlined }
                    |> lambdaFromDefinition
                    |> List.singleton
                    |> List.append letValues
                )
                inValue

        _ ->
            inlineArguments names letValues v


{-| A utility function that replaces variables in a function with their values.
-}
inlineArguments : List Name -> List TypedValue -> TypedValue -> TypedValue
inlineArguments paramList argList fnBody =
    let
        overwriteValue : Name -> TypedValue -> TypedValue -> TypedValue
        overwriteValue searchTerm replacement scope =
            -- TODO handle replacement of the variable within a lambda
            case scope of
                Value.Variable _ name ->
                    if name == searchTerm then
                        replacement

                    else
                        scope

                Value.Apply a target arg ->
                    Value.Apply a
                        (overwriteValue searchTerm replacement target)
                        (overwriteValue searchTerm replacement arg)

                Value.Lambda a pattern body ->
                    overwriteValue searchTerm replacement body
                        |> Value.Lambda a pattern

                Value.Record a args ->
                    args
                        |> Dict.toList
                        |> List.map
                            (\( name, value ) ->
                                overwriteValue searchTerm replacement value
                                    |> Tuple.pair name
                            )
                        |> Dict.fromList
                        |> Value.Record a

                _ ->
                    scope
    in
    paramList
        |> List.map2 Tuple.pair argList
        |> List.foldl
            (\( arg, varName ) body ->
                overwriteValue varName arg body
            )
            fnBody


{-| Turns a Value definition into a lambda function.
-}
lambdaFromDefinition : Value.Definition () (Type.Type ()) -> TypedValue
lambdaFromDefinition valueDef =
    valueDef.inputTypes
        |> List.foldr
            (\( name, va, _ ) val ->
                Value.Lambda va
                    (Value.AsPattern va
                        (Value.WildcardPattern va)
                        name
                    )
                    val
            )
            valueDef.body


{-| Collect arguments that are applied on a value
-}
collectArgValues : TypedValue -> List ( TypedValue, Type () ) -> ( List ( TypedValue, Type () ), TypedValue )
collectArgValues v argsSoFar =
    case v of
        Value.Apply va body a ->
            collectArgValues body (( a, va ) :: argsSoFar)

        _ ->
            ( argsSoFar, v )


{-| Maps Spark ObjectExpressions to scala values.
ObjectExpressions are defined as part of the SparkIR
-}
mapObjectExpressionToScala : ObjectExpression -> Result Error Scala.Value
mapObjectExpressionToScala objectExpression =
    case objectExpression of
        From name ->
            Name.toCamelCase name |> Scala.Variable |> Ok

        Filter predicate sourceRelation ->
            mapObjectExpressionToScala sourceRelation
                |> Result.map
                    (Spark.filter
                        (mapExpression predicate)
                    )

        Select fieldExpressions sourceRelation ->
            mapObjectExpressionToScala sourceRelation
                |> Result.map
                    (Spark.select
                        (fieldExpressions
                            |> mapNamedExpressions
                        )
                    )

        Aggregate groupfield fieldExpressions sourceRelation ->
            mapObjectExpressionToScala sourceRelation
                |> Result.map
                    (Spark.aggregate
                        groupfield
                        (mapNamedExpressions fieldExpressions)
                    )

        Join joinType baseRelation joinedRelation onClause ->
            let
                joinTypeName : String
                joinTypeName =
                    case joinType of
                        Inner ->
                            "inner"

                        Left ->
                            "left"
            in
            Result.map2
                (\baseDataFrame joinedDataFrame ->
                    Spark.join
                        baseDataFrame
                        (mapExpression onClause)
                        joinTypeName
                        joinedDataFrame
                )
                (mapObjectExpressionToScala baseRelation)
                (mapObjectExpressionToScala joinedRelation)


{-| Maps Spark Expressions to scala values.
Expressions are defined as part of the SparkIR.
-}
mapExpression : Expression -> Scala.Value
mapExpression expression =
    case expression of
        BinaryOperation simpleExpression leftExpr rightExpr ->
            Scala.BinOp
                (mapExpression leftExpr)
                simpleExpression
                (mapExpression rightExpr)

        Column colName ->
            Spark.column colName

        Literal literal ->
            mapLiteral literal |> Scala.Literal

        Variable name ->
            Scala.Variable name

        Not expr ->
            Scala.Apply
                (Scala.Ref [ "org", "apache", "spark", "sql", "functions" ] "not")
                (mapExpression expr |> Scala.ArgValue Nothing |> List.singleton)

        WhenOtherwise condition thenBranch elseBranch ->
            let
                toIfElseChain : Expression -> Scala.Value -> Scala.Value
                toIfElseChain v branchesSoFar =
                    case v of
                        WhenOtherwise cond nextThenBranch nextElseBranch ->
                            Spark.andWhen
                                (mapExpression cond)
                                (mapExpression nextThenBranch)
                                branchesSoFar
                                |> toIfElseChain nextElseBranch

                        _ ->
                            Spark.otherwise
                                (mapExpression v)
                                branchesSoFar
            in
            Spark.when
                (mapExpression condition)
                (mapExpression thenBranch)
                |> toIfElseChain elseBranch

        Method target name argList ->
            Scala.Apply
                (Scala.Select (mapExpression target) name)
                (argList
                    |> List.map mapExpression
                    |> List.map (Scala.ArgValue Nothing)
                )

        Function name argList ->
            Scala.Apply
                (Scala.Ref [ "org", "apache", "spark", "sql", "functions" ] name)
                (argList
                    |> List.map mapExpression
                    |> List.map (Scala.ArgValue Nothing)
                )


{-| Maps NamedExpressions to scala values.
-}
mapNamedExpressions : NamedExpressions -> List Scala.Value
mapNamedExpressions nameExpressions =
    List.map
        (\( columnName, named ) ->
            mapExpression named
                |> Spark.alias (Name.toCamelCase columnName)
        )
        nameExpressions


{-| Maps Spark Literals to scala Literals.
-}
mapLiteral : Literal -> Scala.Lit
mapLiteral l =
    case l of
        BoolLiteral bool ->
            Scala.BooleanLit bool

        CharLiteral char ->
            Scala.CharacterLit char

        StringLiteral string ->
            Scala.StringLit string

        WholeNumberLiteral int ->
            Scala.IntegerLit int

        FloatLiteral float ->
            Scala.FloatLit float

        DecimalLiteral _ ->
            Debug.todo "branch 'DecimalLiteral _' not implemented"


{-| Maps a fully qualified name to scala Ref value.
-}
mapFQName : FQName -> Scala.Value
mapFQName fQName =
    let
        ( path, name ) =
            ScalaBackend.mapFQNameToPathAndName fQName
    in
    Scala.Ref path (ScalaBackend.mapValueName name)



--Error Encoders


encodeError : Error -> Encode.Value
encodeError err =
    case err of
        FunctionNotFound fQName ->
            Encode.list Encode.string
                [ "FunctionNotFound"
                , FQName.toString fQName
                ]

        UnknownArgumentType tpe ->
            Encode.list identity
                [ Encode.string "UnknownArgumentType"
                , TypeCodec.encodeType (always Encode.null) tpe
                ]

        MappingError fqn error ->
            Encode.list identity
                [ Encode.string "MappingError"
                , Encode.string (FQName.toString fqn)
                , ASTCodec.encodeError error
                ]

        EntryPointNotFound fQName ->
            Encode.list Encode.string
                [ "EntryPointNotFound"
                , FQName.toString fQName
                ]
