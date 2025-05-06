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


module Morphir.IR.Source exposing
    ( Component, ComponentName, DataSourceName, OutputName, OutputSource, DataType(..)
    , component, outputSource
    , ParameterName
    )

{-| This module defines a JSON Source format for producing a new kind of Morphir IR defined in
[Distribution](Distribution#Component). This format allows for the definition of entry points and their inputs that
allows for the production of an encapsulated and tree-shaken component that has no external dependencies.


# Types

@docs Component, ComponentName, DataSourceName, OutputName, ArgumentName, OutputSource, DataType


# Creation

@docs component, outputSource

-}

import Dict exposing (Dict)
import Morphir.Dependency.DAG as DAG exposing (DAG)
import Morphir.IR.AccessControlled exposing (AccessControlled)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (Value)
import Set exposing (Set)


{-| Type that defines the entry points of [Component](Distribution#Component).
The fields of a component are:

  - name: The name of the component
  - inputs: The inputs of the component as a dictionary of the unique input name and [data type](#DataType).
  - states: The states of the component as a dictionary of the unique state name and [data type](#DataType).
  - outputs: The outputs of the component as a dictionary of unique names and a list of [sources](#OutputSource) that contribute to the output.

-}
type alias Component =
    { name : ComponentName
    , inputs : Dict DataSourceName DataType
    , states : Dict DataSourceName DataType
    , outputs : Dict OutputName (List OutputSource)
    }


{-| Represents a Component name.
-}
type alias ComponentName =
    Path


{-| Represents a DataSource name.
-}
type alias DataSourceName =
    Name


type Literal
    = BoolLiteral
    | StringLiteral
    | WholeNumberLiteral
    | FloatLiteral
    | DecimalLiteral
    | LocalDateLiteral
    | LocalTimeLiteral


{-| Represents the types of data that can be used as a data source in either the inputs or states field of a [Component](#Component).
-}
type DataType
    = RowSet FQName
    | Literal Literal


{-| Represents an Output name.
-}
type alias OutputName =
    Name


{-| Represents the dependencies that contribute to an Output. The fields of an OutputSource are:

  - functionReference: A fully qualified reference to a function that produces a slice of an output.
  - arguments: The arguments that are passed to the function reference. The keys are the parameter names and the values
    are the data source names. The data source names must be declared in inputs or states field of the [Component](#Component).

-}
type alias OutputSource =
    { functionReference : FQName
    , arguments : Dict ParameterName DataSourceName
    }


{-| Represents an Argument name.
-}
type alias ParameterName =
    Name


{-| Creates a new component with the given name, inputs, states and outputs.
-}
component : ComponentName -> Dict DataSourceName DataType -> Dict DataSourceName DataType -> Dict OutputName (List OutputSource) -> Component
component name inputs states outputs =
    { name = name
    , inputs = inputs
    , states = states
    , outputs = outputs
    }


{-| Creates a new output source with the given function reference and arguments.
-}
outputSource : FQName -> Dict ParameterName DataSourceName -> OutputSource
outputSource functionName arguments =
    { functionReference = functionName
    , arguments = arguments
    }


type Error
    = CyclicDependency (DAG.CycleDetected ( NodeType, FQName ))
    | BrokenFunctionReference FQName
    | MissingPackage PackageName
    | MultiplePackageShareSameName Int PackageName
    | UnknownInputStateReference OutputName (List DataSourceName)
    | ParamNotSupplied OutputName Int FQName ParameterName
    | InputStateNameConflict (List DataSourceName)
    | OutputSourceTypeMismatch OutputName (Type ()) (Type ())
    | UnexpectedError


type alias NodeType =
    -- using String because DAG doesn't support union types
    String


toDistributionComponent : List Distribution -> Component -> Result (List Error) Distribution.Component
toDistributionComponent distros comp =
    let
        entryPoints : Set FQName
        entryPoints =
            comp.outputs
                |> Dict.foldl
                    (\_ outputSources acc ->
                        outputSources
                            |> List.map .functionReference
                            |> Set.fromList
                            |> Set.union acc
                    )
                    Set.empty

        inputs =
            comp.inputs |> Dict.map (\_ -> dataTypeToType)

        states =
            comp.states |> Dict.map (\_ -> dataTypeToType)

        outputs : Result (List Error) (Dict Name (Value () (Type ())))
        outputs =
            comp.outputs
                |> Dict.foldl
                    (\outputName outputSources outputResultSoFar ->
                        outputSourcesToValue
                            (distros |> distrosToMap)
                            (Dict.union inputs states)
                            outputName
                            outputSources
                            |> Result.map2
                                (\outputSoFar v ->
                                    Dict.insert outputName
                                        v
                                        outputSoFar
                                )
                                outputResultSoFar
                    )
                    (Ok Dict.empty)

        createDistributionComponent : Dict PackageName Distribution -> Result (List Error) Distribution.Component
        createDistributionComponent treeShakenDistros =
            outputs
                |> Result.map
                    (\outputValues ->
                        { name = comp.name
                        , libraries =
                            treeShakenDistros
                                |> Dict.map (\_ (Distribution.Library _ _ pkgDef) -> pkgDef)
                        , inputs = inputs
                        , states = states
                        , outputs = outputValues
                        }
                    )
    in
    case
        List.concat
            [ collectNonUniqueDistributionErrors distros
            , collectNonInputReferenceErrors comp
            , collectInputAndStateNameConflictErrors comp
            , collectOutputSliceTypeMismatchErrors comp distros
            ]
    of
        [] ->
            let
                distrosMap =
                    distrosToMap distros
            in
            distrosMap
                |> dependencyGraphFromEntryPointFunctions entryPoints
                |> Result.map (treeShakeDistributions distrosMap)
                |> Result.andThen createDistributionComponent

        errs ->
            Err errs


dependencyGraphFromEntryPointFunctions : Set FQName -> Dict PackageName Distribution -> Result (List Error) (DAG ( NodeType, FQName ))
dependencyGraphFromEntryPointFunctions entryPoints distrosMap =
    let
        dagWithEntryPointsAdded : Result (List Error) (DAG ( NodeType, FQName ))
        dagWithEntryPointsAdded =
            entryPoints
                |> Set.foldl
                    (\entryPoint acc ->
                        acc
                            |> Result.andThen
                                (\dag ->
                                    dag
                                        |> DAG.insertNode ( "Value", entryPoint ) Set.empty
                                        |> Result.mapError
                                            (CyclicDependency
                                                >> List.singleton
                                            )
                                )
                    )
                    (Ok DAG.empty)

        collectReferenceDependencies :
            ( NodeType, FQName )
            -> Result (List Error) (DAG ( NodeType, FQName ))
            -> Result (List Error) (DAG ( NodeType, FQName ))
        collectReferenceDependencies ( nodeType, fQName ) dagResultSoFar =
            let
                withErr err =
                    case dagResultSoFar of
                        Ok _ ->
                            Err [ err ]

                        Err errs ->
                            Err (err :: errs)

                addNodeEdges :
                    Result (List Error) (DAG ( NodeType, FQName ))
                    -> Set ( NodeType, FQName )
                    -> Result (List Error) (DAG ( NodeType, FQName ))
                addNodeEdges dagResultSoFarAcc set =
                    dagResultSoFarAcc
                        |> Result.andThen
                            (DAG.insertNode ( nodeType, fQName ) set
                                >> Result.mapError (CyclicDependency >> List.singleton)
                            )

                isMorphirReference fqn =
                    FQName.getPackagePath fqn == [ [ "morphir" ], [ "s", "d", "k" ] ]
            in
            if isMorphirReference fQName then
                dagResultSoFar

            else
                case Dict.get (FQName.getPackagePath fQName) distrosMap of
                    Just distro ->
                        if nodeType == "Value" then
                            case Distribution.lookupValueDefinition fQName distro of
                                Just valueDef ->
                                    let
                                        directDependencies =
                                            Value.collectReferences valueDef.body
                                                |> Set.filter (isMorphirReference >> not)
                                                |> Set.map (Tuple.pair "Value")
                                                |> Set.union
                                                    (valueDef.outputType
                                                        :: (valueDef.inputTypes |> List.map (\( _, _, tpe ) -> tpe))
                                                        |> List.map Type.collectReferences
                                                        |> List.foldl Set.union Set.empty
                                                        |> Set.union (Value.collectTypeReferences valueDef.body)
                                                        |> Set.filter (isMorphirReference >> not)
                                                        |> Set.map (Tuple.pair "Type")
                                                    )
                                    in
                                    collectDependenciesFromRefs directDependencies
                                        (addNodeEdges dagResultSoFar directDependencies)

                                Nothing ->
                                    withErr (BrokenFunctionReference fQName)

                        else
                            case Distribution.lookupTypeSpecification fQName distro of
                                Just (Type.TypeAliasSpecification _ tpe) ->
                                    Type.collectReferences tpe
                                        |> Set.filter (isMorphirReference >> not)
                                        |> Set.map (Tuple.pair "Type")
                                        |> (\directDependencies ->
                                                collectDependenciesFromRefs directDependencies
                                                    (addNodeEdges dagResultSoFar directDependencies)
                                           )

                                Just (Type.CustomTypeSpecification _ ctors) ->
                                    Dict.values ctors
                                        |> List.concat
                                        |> List.map (Tuple.second >> Type.collectReferences)
                                        |> List.foldl Set.union Set.empty
                                        |> Set.filter (isMorphirReference >> not)
                                        |> Set.map (Tuple.pair "Type")
                                        |> (\directDependencies ->
                                                collectDependenciesFromRefs directDependencies
                                                    (addNodeEdges dagResultSoFar directDependencies)
                                           )

                                Just _ ->
                                    dagResultSoFar

                                Nothing ->
                                    withErr (BrokenFunctionReference fQName)

                    Nothing ->
                        withErr (MissingPackage (FQName.getPackagePath fQName))

        collectDependenciesFromRefs : Set ( NodeType, FQName ) -> Result (List Error) (DAG ( NodeType, FQName )) -> Result (List Error) (DAG ( NodeType, FQName ))
        collectDependenciesFromRefs refs dagResult =
            refs
                |> Set.foldl collectReferenceDependencies dagResult
    in
    collectDependenciesFromRefs (entryPoints |> Set.map (Tuple.pair "Value")) dagWithEntryPointsAdded


treeShakeDistributions : Dict PackageName Distribution -> DAG ( NodeType, FQName ) -> Dict PackageName Distribution
treeShakeDistributions distros dag =
    let
        dagNodes : Set ( NodeType, FQName )
        dagNodes =
            DAG.toList dag
                |> List.foldl
                    (\( fromNode, toNodes ) nodesSoFar ->
                        Set.insert fromNode toNodes
                            |> Set.union nodesSoFar
                    )
                    Set.empty
    in
    distros
        |> Dict.map
            (\packageName (Distribution.Library _ _ pkgDef) ->
                let
                    treeShakenModules : Dict ModuleName (AccessControlled (Module.Definition () (Type ())))
                    treeShakenModules =
                        pkgDef.modules
                            |> Dict.map
                                (\moduleName accessCntrldModuleDef ->
                                    let
                                        treeShakenTypes : Dict Name (AccessControlled (Documented (Type.Definition ())))
                                        treeShakenTypes =
                                            accessCntrldModuleDef.value.types
                                                |> Dict.filter
                                                    (\name _ ->
                                                        Set.member ( "Type", FQName.fQName packageName moduleName name ) dagNodes
                                                    )

                                        treeShakenValues : Dict Name (AccessControlled (Documented (Value.Definition () (Type ()))))
                                        treeShakenValues =
                                            accessCntrldModuleDef.value.values
                                                |> Dict.filter
                                                    (\name _ ->
                                                        Set.member ( "Value", FQName.fQName packageName moduleName name ) dagNodes
                                                    )
                                    in
                                    { access = accessCntrldModuleDef.access
                                    , value =
                                        { types = treeShakenTypes
                                        , values = treeShakenValues
                                        , doc = accessCntrldModuleDef.value.doc
                                        }
                                    }
                                )
                            -- drop empty modules
                            |> Dict.filter
                                (\_ accessCntrldModuleDef ->
                                    Dict.isEmpty accessCntrldModuleDef.value.types
                                        && Dict.isEmpty accessCntrldModuleDef.value.values
                                )
                in
                Distribution.Library packageName Dict.empty { modules = treeShakenModules }
            )
        -- drop empty distros
        |> Dict.filter
            (\_ (Distribution.Library _ _ pkgDef) ->
                Dict.isEmpty pkgDef.modules
            )


distrosToMap : List Distribution -> Dict PackageName Distribution.Distribution
distrosToMap distros =
    distros
        |> List.map
            (\distro ->
                case distro of
                    Distribution.Library packageName _ _ ->
                        ( packageName, distro )
            )
        |> Dict.fromList


dataTypeToType : DataType -> Type ()
dataTypeToType dataType =
    case dataType of
        RowSet fQName ->
            Type.Reference ()
                ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "list" ] ], [ "list" ] )
                [ Type.Reference () fQName [] ]

        Literal literal ->
            case literal of
                BoolLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "basics" ] ], [ "bool" ] ) []

                StringLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "basics" ] ], [ "string" ] ) []

                WholeNumberLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "basics" ] ], [ "int" ] ) []

                FloatLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "basics" ] ], [ "float" ] ) []

                DecimalLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "decimal" ] ], [ "decimal" ] ) []

                LocalDateLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "local", "date" ] ], [ "local", "date" ] ) []

                LocalTimeLiteral ->
                    Type.Reference () ( [ [ "morphir" ], [ "s", "d", "k" ] ], [ [ "local", "time" ] ], [ "local", "time" ] ) []


outputSourcesToValue : Dict PackageName Distribution -> Dict DataSourceName (Type ()) -> OutputName -> List OutputSource -> Result (List Error) Value.TypedValue
outputSourcesToValue distroMap validDataSourceNames outputName outputSources =
    let
        outputSourcesAsValues : Dict DataSourceName Value.TypedValue
        outputSourcesAsValues =
            validDataSourceNames
                |> Dict.map (\srcName tpe -> Value.Variable tpe srcName)

        outputType : Result Error (Type ())
        outputType =
            outputSources
                |> List.head
                |> Maybe.andThen
                    (\outputSrc ->
                        distroMap
                            |> Dict.get (FQName.getPackagePath outputSrc.functionReference)
                            |> Maybe.andThen (Distribution.lookupValueDefinition outputSrc.functionReference)
                            |> Maybe.map .outputType
                    )
                |> Result.fromMaybe UnexpectedError

        defInputTypesInOrder : Value.Definition () (Type ()) -> List (Type ())
        defInputTypesInOrder valDef =
            valDef.inputTypes
                |> List.map (\( _, _, tpe ) -> tpe)

        tpesToFunctionType : List (Type ()) -> Type () -> Type ()
        tpesToFunctionType types outType =
            case types of
                [] ->
                    outType

                firstType :: tail ->
                    tpesToFunctionType tail
                        (Type.Function () firstType outType)

        asReference : FQName -> List (Type ()) -> Type () -> Value.TypedValue
        asReference fQName inputTypes outType =
            Value.Reference
                (tpesToFunctionType inputTypes outType)
                fQName

        outputSliceToValue : Int -> OutputSource -> Result (List Error) Value.TypedValue
        outputSliceToValue sliceIndex outputSrc =
            distroMap
                |> Dict.get (FQName.getPackagePath outputSrc.functionReference)
                |> Maybe.andThen (Distribution.lookupValueDefinition outputSrc.functionReference)
                |> Result.fromMaybe [ BrokenFunctionReference outputSrc.functionReference ]
                |> Result.andThen
                    (\valDef ->
                        let
                            inputTypes =
                                defInputTypesInOrder valDef
                        in
                        valDef.inputTypes
                            |> List.foldl
                                (\( paramName, _, _ ) resSoFar ->
                                    case
                                        Dict.get paramName outputSrc.arguments
                                            |> Maybe.andThen (\n -> Dict.get n outputSourcesAsValues)
                                    of
                                        Just paramValue ->
                                            resSoFar
                                                |> Result.map
                                                    (\( inTpes, targetVal, outTpe ) ->
                                                        let
                                                            rest =
                                                                case inTpes of
                                                                    [] ->
                                                                        []

                                                                    _ :: tail ->
                                                                        tail

                                                            nextOutType =
                                                                tpesToFunctionType rest outTpe
                                                        in
                                                        ( rest
                                                        , Value.Apply
                                                            nextOutType
                                                            targetVal
                                                            paramValue
                                                        , nextOutType
                                                        )
                                                    )

                                        Nothing ->
                                            case resSoFar of
                                                Err errs ->
                                                    Err
                                                        (ParamNotSupplied outputName
                                                            sliceIndex
                                                            outputSrc.functionReference
                                                            paramName
                                                            :: errs
                                                        )

                                                _ ->
                                                    Err
                                                        [ ParamNotSupplied outputName
                                                            sliceIndex
                                                            outputSrc.functionReference
                                                            paramName
                                                        ]
                                )
                                (Ok ( inputTypes, asReference outputSrc.functionReference inputTypes valDef.outputType, valDef.outputType ))
                    )
                |> Result.map (\( _, val, _ ) -> val)
    in
    outputSources
        |> List.indexedMap outputSliceToValue
        |> List.foldl
            (\res acc ->
                case ( res, acc ) of
                    ( Ok v, Ok accSoFar ) ->
                        Ok (v :: accSoFar)

                    ( Err resErrs, Err accErrs ) ->
                        Err (resErrs ++ accErrs)

                    ( Err errs, _ ) ->
                        Err errs
            )
            (Ok [])
        |> Result.map2
            (\outTpe v ->
                Value.Apply
                    (Type.Reference () (FQName.fqn "Morphir.SDK" "List" "List") [ outTpe ])
                    (Value.Reference
                        (Type.Function ()
                            (Type.Reference ()
                                (FQName.fqn "Morphir.SDK" "List" "List")
                                [ Type.Reference () (FQName.fqn "Morphir.SDK" "List" "List") [ outTpe ] ]
                            )
                            (Type.Reference () (FQName.fqn "Morphir.SDK" "List" "List") [ outTpe ])
                        )
                        (FQName.fqn "Morphir.SDK" "List" "concat")
                    )
                    (Value.List
                        (Type.Reference ()
                            (FQName.fqn "Morphir.SDK" "List" "List")
                            [ Type.Reference () (FQName.fqn "Morphir.SDK" "List" "List") [ outTpe ] ]
                        )
                        v
                    )
            )
            (outputType |> Result.mapError List.singleton)



-- VALIDATIONS


{-| Collects errors for non-unique package names in the distribution list.
-}
collectNonUniqueDistributionErrors : List Distribution -> List Error
collectNonUniqueDistributionErrors distros =
    distros
        |> List.foldl
            (\distro counts ->
                case distro of
                    Distribution.Library packageName _ _ ->
                        counts
                            |> Dict.update packageName
                                (\v ->
                                    case v of
                                        Just value ->
                                            Just (value + 1)

                                        Nothing ->
                                            Just 1
                                )
            )
            Dict.empty
        |> Dict.filter (\_ count -> count > 1)
        |> Dict.toList
        |> List.map
            (\( packageName, count ) ->
                MultiplePackageShareSameName count packageName
            )


{-| Collects errors for when outputs reference terms not defined within `input` or `state`.
-}
collectNonInputReferenceErrors : Component -> List Error
collectNonInputReferenceErrors comp =
    let
        inputsAndStates =
            Dict.keys comp.inputs
                |> List.append (Dict.keys comp.states)
                |> Set.fromList
    in
    comp.outputs
        |> Dict.foldl
            (\outputName outputSources acc ->
                case
                    outputSources
                        |> List.map (.arguments >> Dict.values)
                        |> List.concat
                        |> List.filter (\argName -> not (Set.member argName inputsAndStates))
                of
                    [] ->
                        acc

                    unknownArgs ->
                        UnknownInputStateReference outputName unknownArgs :: acc
            )
            []


{-| Collects errors for when the same name is used twice in either the `input` or `state` fields or used
across both the `input` and `state` fields.
-}
collectInputAndStateNameConflictErrors : Component -> List Error
collectInputAndStateNameConflictErrors comp =
    case
        Dict.keys comp.inputs
            |> Set.fromList
            |> Set.intersect (Dict.keys comp.states |> Set.fromList)
            |> Set.toList
    of
        [] ->
            []

        conflicts ->
            InputStateNameConflict conflicts :: []


{-| Collect errors if slices contributing to an output do not have the same return type.
-}
collectOutputSliceTypeMismatchErrors : Component -> List Distribution -> List Error
collectOutputSliceTypeMismatchErrors comp distros =
    let
        distroMaps =
            distrosToMap distros
    in
    comp.outputs
        |> Dict.foldl
            (\outputName outputSources acc ->
                case outputSources of
                    head :: rest ->
                        case
                            -- get the first returnType
                            Dict.get (FQName.getPackagePath head.functionReference) distroMaps
                                |> Maybe.andThen (Distribution.lookupValueDefinition head.functionReference)
                                |> Maybe.map .outputType
                        of
                            Just outputType ->
                                rest
                                    |> List.foldl
                                        (\source acc2 ->
                                            case
                                                Dict.get (FQName.getPackagePath source.functionReference) distroMaps
                                                    |> Maybe.andThen (Distribution.lookupValueDefinition source.functionReference)
                                                    |> Maybe.map .outputType
                                            of
                                                Just nextRefType ->
                                                    if nextRefType == outputType then
                                                        acc2

                                                    else
                                                        OutputSourceTypeMismatch outputName outputType nextRefType :: acc2

                                                Nothing ->
                                                    BrokenFunctionReference source.functionReference :: acc2
                                        )
                                        acc

                            Nothing ->
                                BrokenFunctionReference head.functionReference :: acc
            )
            []
