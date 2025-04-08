module Morphir.TypeScript.Backend.Values exposing (..)

import Decimal
import Dict
import Morphir.File.FileMap exposing (FileMap)
import Morphir.IR.AccessControlled exposing (Access(..), AccessControlled)
import Morphir.IR.Distribution as Distribution exposing (Distribution(..))
import Morphir.IR.Literal as Literal
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name
import Morphir.IR.Package as Package
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value
import Morphir.TypeScript.AST as TS
import Morphir.TypeScript.Backend.Imports exposing (getTypeScriptPackagePathAndModuleName, getUniqueImportRefs, makeRelativeImport, renderInternalImport)
import Morphir.TypeScript.Backend.TopLevelNamespace exposing (makeTopLevelNamespaceModule)
import Morphir.TypeScript.Backend.Types as Types exposing (mapPrivacy, mapTypeDefinition, mapTypeExp)
import Morphir.TypeScript.PrettyPrinter as PrettyPrinter


mapConstAndFunctionDefinition : Name.Name -> Value.Definition ta (Type ()) -> Module.ModuleName -> TS.Statement
mapConstAndFunctionDefinition valueName valueDef moduleName =
    let
        name : String
        name =
            Name.toCamelCase valueName

        body : TS.TSExpression
        body =
            mapValue valueDef.body

        expressionTpe =
            mapTypeExp moduleName valueDef.outputType

        tpeParams : List TS.TypeExp
        tpeParams =
            valueDef.inputTypes
                |> List.filterMap
                    (\( _, _, tpe ) ->
                        case tpe of
                            Type.Variable _ tpeVarName ->
                                Name.toTitleCase tpeVarName
                                    |> TS.Variable
                                    |> Just

                            _ ->
                                Nothing
                    )

        params : List TS.Parameter
        params =
            valueDef.inputTypes
                |> List.map
                    (\( paramName, _, tpe ) ->
                        { name = Name.toCamelCase paramName
                        , typeAnnotation = Just (mapTypeExp moduleName tpe)
                        , modifiers = []
                        }
                    )
    in
    case valueDef.inputTypes of
        [] ->
            TS.ConstStatement (TS.Identifier name)
                (Maybe.Just expressionTpe)
                body

        _ ->
            TS.FunctionDeclaration
                { name = name
                , typeVariables = tpeParams
                , parameters = params
                , returnType = Maybe.Just expressionTpe
                , body = [ TS.ReturnStatement body ]
                }
                TS.ModuleFunction
                TS.Public


mapValue : Value.Value ta va -> TS.TSExpression
mapValue value =
    case value of
        Value.Literal va literal ->
            case literal of
                Literal.BoolLiteral bool ->
                    TS.BooleanLiteral bool
                        |> TS.LiteralExpression

                Literal.CharLiteral char ->
                    String.fromChar char
                        |> TS.StringLiteral
                        |> TS.LiteralExpression

                Literal.StringLiteral string ->
                    TS.StringLiteral string
                        |> TS.LiteralExpression

                Literal.WholeNumberLiteral int ->
                    TS.IntNumberLiteral int
                        |> TS.LiteralExpression

                Literal.FloatLiteral float ->
                    TS.FloatNumberLiteral float
                        |> TS.LiteralExpression

                Literal.DecimalLiteral decimal ->
                    -- TODO should map to SDK decimal `fromString`
                    TS.StringLiteral (Decimal.toString decimal)
                        |> TS.LiteralExpression

        Value.Constructor va fQName ->
            TS.LiteralExpression <| TS.StringLiteral "Not yet implemented"

        Value.Tuple va values ->
            List.map mapValue values
                |> TS.ArrayLiteralExpression

        Value.List va values ->
            List.map mapValue values
                |> TS.ArrayLiteralExpression

        Value.Record va dict ->
            TS.ObjectLiteralExpression
                { spread = []
                , properties =
                    dict
                        |> Dict.toList
                        |> List.map (Tuple.mapBoth Name.toCamelCase mapValue)
                }

        Value.Variable va name ->
            TS.Identifier (Name.toCamelCase name)

        Value.Reference va ( pkgName, modName, localName ) ->
            TS.MemberExpression
                { object = TS.Identifier (TS.namespaceNameFromPackageAndModule pkgName modName)
                , member = TS.Identifier (Name.toCamelCase localName)
                }

        Value.Field _ value1 name ->
            TS.MemberExpression
                { object = mapValue value1
                , member = TS.Identifier (Name.toCamelCase name)
                }

        Value.FieldFunction va name ->
            TS.ArrowFunction
                { params = [ "rec" ]
                , body =
                    TS.MemberExpression
                        { object = TS.Identifier "rec"
                        , member = TS.Identifier (Name.toCamelCase name)
                        }
                }

        Value.Apply va value1 value2 ->
            let
                ( target, args ) =
                    Value.uncurryApply value1 value2
            in
            TS.Call
                { function = mapValue target
                , arguments = List.map mapValue args
                }

        Value.Lambda va pattern value1 ->
            let
                uncurryLambda params lambda =
                    case lambda of
                        Value.Lambda _ p l ->
                            uncurryLambda (p :: params) l

                        _ ->
                            ( lambda, params )

                ( body, extractedParams ) =
                    uncurryLambda [ pattern ] value1
            in
            TS.ArrowFunction
                { params = []
                , body = mapValue value1
                }

        Value.LetDefinition va name definition value1 ->
            TS.LiteralExpression <| TS.StringLiteral "Not yet implemented"

        Value.LetRecursion va dict value1 ->
            TS.LiteralExpression <| TS.StringLiteral "Not yet implemented"

        Value.Destructure va pattern value1 value2 ->
            TS.LiteralExpression <| TS.StringLiteral "Not yet implemented"

        Value.IfThenElse va value1 value2 value3 ->
            TS.IfElse
                (mapValue value1)
                (mapValue value2)
                (mapValue value3)

        Value.PatternMatch va value1 list ->
            TS.LiteralExpression <| TS.StringLiteral "Not yet implemented"

        Value.UpdateRecord va value1 dict ->
            TS.ObjectLiteralExpression
                { spread = [ mapValue value1 ]
                , properties =
                    dict
                        |> Dict.toList
                        |> List.map (Tuple.mapBoth Name.toCamelCase mapValue)
                }

        Value.Unit va ->
            TS.emptyObject
