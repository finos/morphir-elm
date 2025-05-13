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
    ( Component, ComponentName, DataSourceName, OutputName, OutputSource, DataType(..), Error(..)
    , component, outputSource
    , toDistributionComponent
    , LiteralType(..), ParameterName
    )

{-| This module defines a JSON Source format for producing a new kind of Morphir IR defined in
[Distribution](Distribution#Component). This format allows for the definition of entry points and their inputs that
allows for the production of an encapsulated and tree-shaken component that has no external dependencies.


# Types

@docs Component, ComponentName, DataSourceName, OutputName, ArgumentName, OutputSource, DataType, Literal, Error


# Creation

@docs component, outputSource


# Conversion

@docs toDistributionComponent

-}

import Dict exposing (Dict)
import Morphir.Dependency.DAG as DAG exposing (DAG)
import Morphir.IR.AccessControlled exposing (AccessControlled)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName as FQName exposing (FQName)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package exposing (PackageName)
import Morphir.IR.Path exposing (Path)
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


{-| Represents a Literal type that can be specified as part of Input or State declaration.
The supported types are:

  - BoolLiteral: A boolean literal
  - StringLiteral: A string literal
  - WholeNumberLiteral: A whole number or integer literal
  - FloatLiteral: A float literal
  - DecimalLiteral: A decimal literal
  - LocalDateLiteral: A local date literal
  - LocalTimeLiteral: A local time literal

-}
type LiteralType
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
    | Literal LiteralType


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


{-| Represents the errors that can occur when converting a [Component](#Component) to a [Distribution.Component](Distribution#Component).
The errors are:

  - CyclicDependency: A cycle was detected in the dependency graph of the component.
  - BrokenFunctionReference: A function reference was not found in the distribution.
  - MissingPackage: A package was referenced but was not found in the distribution.
  - MultiplePackageShareSameName: A number of packages share the same name.
  - UnknownInputStateReference: An input or state reference was not found in the component.
  - UnusedInputOrState: An input or state was declared but not used in any of the outputs.
  - ParamNotSupplied: A parameter was not supplied for a function reference. The arguments represent:
      - the name of the output reporting this error,
      - the position of the slice in the output,
      - the function referenced from that slice,
      - the name of the functions' parameter that was not supplied,
  - InputStateNameConflict: A name conflict across input and state declaration was detected.
  - OutputSourceTypeMismatch: One or more slices of an output do not return the expected type.

-}
type Error
    = CyclicDependency (DAG.CycleDetected ( NodeType, FQName ))
    | BrokenFunctionReference FQName
    | MissingPackage PackageName
    | MultiplePackageShareSameName Int PackageName
    | UnknownInputStateReference OutputName (List DataSourceName)
    | UnusedInputOrState DataSourceName
    | ParamNotSupplied OutputName Int FQName ParameterName
    | InputStateNameConflict (List DataSourceName)
    | OutputSourceTypeMismatch OutputName (Type ()) (Type ())


type alias NodeType =
    -- using String because DAG doesn't support union types
    String


{-| Converts a [Component](#Component) to a [Distribution.Component](Distribution#Component).

The function takes:

  - list of distributions that account for all dependencies for the Distribution#Comnponent
  - And a Source component definition and returns either a list of errors or the converted distribution component.

-}
toDistributionComponent : List Distribution -> Component -> Result (List Error) Distribution.Component
toDistributionComponent distros comp =
    let
        -- Collects all fully qualified names used in the outputs of the component.
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

        -- Maps the inputs of the component to their corresponding data types.
        inputs =
            comp.inputs |> Dict.map (\_ -> dataTypeToType)

        -- Maps the states of the component to their corresponding data types.
        states =
            comp.states |> Dict.map (\_ -> dataTypeToType)

        -- Processes the outputs of the component and converts them into a dictionary of values.
        outputs : Result (List Error) (Dict Name (Value () (Type ())))
        outputs =
            comp.outputs
                |> Dict.foldl
                    (\outputName outputSources outputResultSoFar ->
                        outputSourcesToValue
                            (distros |> distrosByName)
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

        -- Creates a distribution component by combining the processed outputs, inputs, and states.
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
            , collectUnusedInputStateErrors comp
            ]
    of
        [] ->
            treeShakeDistributions entryPoints distros
                |> Result.andThen createDistributionComponent

        errs ->
            Err errs


{-| Tree shakes the distributions by removing all modules and types that are not reachable from the entry points.
-}
treeShakeDistributions : Set FQName -> List Distribution -> Result (List Error) (Dict PackageName Distribution)
treeShakeDistributions entryPoints distros =
    let
        -- Converts the list of distributions into a dictionary for easier access.
        distrosMap =
            distrosByName distros
    in
    dependencyGraphFromEntryPointFunctions entryPoints distrosMap
        |> Result.map
            (\dag ->
                let
                    -- Collects all nodes in the dependency graph into a Set
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
                distrosMap
                    |> Dict.map
                        (\packageName (Distribution.Library _ _ pkgDef) ->
                            let
                                -- Filters and retains only the modules that are reachable in the dependency graph.
                                treeShakenModules : Dict ModuleName (AccessControlled (Module.Definition () (Type ())))
                                treeShakenModules =
                                    pkgDef.modules
                                        |> Dict.map
                                            (\moduleName accessCntrldModuleDef ->
                                                let
                                                    -- Filters and retains only the types that are reachable in the dependency graph.
                                                    treeShakenTypes : Dict Name (AccessControlled (Documented (Type.Definition ())))
                                                    treeShakenTypes =
                                                        accessCntrldModuleDef.value.types
                                                            |> Dict.filter
                                                                (\name _ ->
                                                                    Set.member ( "Type", FQName.fQName packageName moduleName name ) dagNodes
                                                                )

                                                    -- Filters and retains only the values that are reachable in the dependency graph.
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
                                                not
                                                    (Dict.isEmpty accessCntrldModuleDef.value.types
                                                        && Dict.isEmpty accessCntrldModuleDef.value.values
                                                    )
                                            )
                            in
                            Distribution.Library packageName Dict.empty { modules = treeShakenModules }
                        )
                    -- drop empty distros
                    |> Dict.filter
                        (\_ (Distribution.Library _ _ pkgDef) ->
                            not (Dict.isEmpty pkgDef.modules)
                        )
            )


dependencyGraphFromEntryPointFunctions : Set FQName -> Dict PackageName Distribution -> Result (List Error) (DAG ( NodeType, FQName ))
dependencyGraphFromEntryPointFunctions entryPoints distrosMap =
    let
        -- Collects the dependencies of a given reference and adds them to the dependency graph.
        collectReferenceDependencies :
            ( NodeType, FQName )
            -> Result (List Error) (DAG ( NodeType, FQName ))
            -> Result (List Error) (DAG ( NodeType, FQName ))
        collectReferenceDependencies ( nodeType, fQName ) dagResultSoFar =
            let
                -- Utility for adding an error to the current result.
                -- if the current result is an error, it appends the new error to the list of errors.
                -- if the current result is a success, it returns a new error.
                withErr : Error -> Result (List Error) value
                withErr err =
                    case dagResultSoFar of
                        Ok _ ->
                            Err [ err ]

                        Err errs ->
                            Err (err :: errs)

                -- Adds edges to the dependency graph for the current node processing.
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

                isMorphirSDKFQN : FQName -> Bool
                isMorphirSDKFQN fqn =
                    FQName.getPackagePath fqn == [ [ "morphir" ], [ "s", "d", "k" ] ]
            in
            if isMorphirSDKFQN fQName then
                dagResultSoFar

            else
                case Dict.get (FQName.getPackagePath fQName) distrosMap of
                    Just distro ->
                        if nodeType == "Value" then
                            case Distribution.lookupValueDefinition fQName distro of
                                Just valueDef ->
                                    let
                                        {- Collects the direct dependencies of a given value definition.

                                           The function identifies all references (both value and type references)
                                           used within the body and input/output types of the value definition.
                                           It filters out references to the Morphir SDK and returns a `Set` of
                                           dependencies, where each dependency is represented as a tuple of
                                           `("Value", FQName)` or `("Type", FQName)`.
                                        -}
                                        directDependencies : Set ( String, FQName )
                                        directDependencies =
                                            Value.collectReferences valueDef.body
                                                |> Set.filter (isMorphirSDKFQN >> not)
                                                |> Set.map (Tuple.pair "Value")
                                                |> Set.union
                                                    (valueDef.outputType
                                                        :: (valueDef.inputTypes |> List.map (\( _, _, tpe ) -> tpe))
                                                        |> List.map Type.collectReferences
                                                        |> List.foldl Set.union Set.empty
                                                        |> Set.union (Value.collectTypeReferences valueDef.body)
                                                        |> Set.filter (isMorphirSDKFQN >> not)
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
                                    -- Collect type dependencies from type aliases
                                    Type.collectReferences tpe
                                        |> Set.filter (isMorphirSDKFQN >> not)
                                        |> Set.map (Tuple.pair "Type")
                                        |> (\directDependencies ->
                                                collectDependenciesFromRefs directDependencies
                                                    (addNodeEdges dagResultSoFar directDependencies)
                                           )

                                Just (Type.CustomTypeSpecification _ ctors) ->
                                    -- Collect type dependencies from custom types
                                    Dict.values ctors
                                        |> List.concat
                                        |> List.map (Tuple.second >> Type.collectReferences)
                                        |> List.foldl Set.union Set.empty
                                        |> Set.filter (isMorphirSDKFQN >> not)
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

        -- Recursively collects dependencies from a set of references.
        collectDependenciesFromRefs : Set ( NodeType, FQName ) -> Result (List Error) (DAG ( NodeType, FQName )) -> Result (List Error) (DAG ( NodeType, FQName ))
        collectDependenciesFromRefs refs dagResult =
            refs
                |> Set.foldl collectReferenceDependencies dagResult
    in
    -- add all entry points to a starting DAG
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
        |> collectDependenciesFromRefs (entryPoints |> Set.map (Tuple.pair "Value"))


distrosByName : List Distribution -> Dict PackageName Distribution.Distribution
distrosByName distros =
    distros
        |> List.map
            (\distro ->
                case distro of
                    Distribution.Library packageName _ _ ->
                        ( packageName, distro )
            )
        |> Dict.fromList


{-| Converts an allowable Source [DataType](#DataType) to a standard Morphir [Type](Type).
-}
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
        -- Makes each data source a variable
        dataSourceValues : Dict DataSourceName Value.TypedValue
        dataSourceValues =
            validDataSourceNames
                |> Dict.map (\srcName tpe -> Value.Variable tpe srcName)

        -- Folds a list of types into a function type
        tpesToFunctionType : List (Type ()) -> Type () -> Type ()
        tpesToFunctionType types outType =
            let
                helper tpes out =
                    case tpes of
                        [] ->
                            out

                        lastType :: rest ->
                            helper rest
                                (Type.Function () lastType out)
            in
            helper (List.reverse types) outType

        -- Converts a slice of an output to a morphir value.
        outputSliceToValue : Int -> OutputSource -> Result (List Error) Value.TypedValue
        outputSliceToValue sliceIndex outputSrc =
            -- lookup the functions definition
            distroMap
                |> Dict.get (FQName.getPackagePath outputSrc.functionReference)
                |> Maybe.andThen (Distribution.lookupValueDefinition outputSrc.functionReference)
                |> Result.fromMaybe [ BrokenFunctionReference outputSrc.functionReference ]
                |> Result.andThen
                    (\valDef ->
                        let
                            inputTypes : List (Type ())
                            inputTypes =
                                valDef.inputTypes
                                    |> List.map (\( _, _, tpe ) -> tpe)
                        in
                        valDef.inputTypes
                            |> List.foldl
                                (\( paramName, _, _ ) resSoFar ->
                                    case
                                        -- check if the parameter name was supplied in the arguments
                                        Dict.get paramName outputSrc.arguments
                                            |> Maybe.andThen (\n -> Dict.get n dataSourceValues)
                                    of
                                        Just paramValue ->
                                            resSoFar
                                                |> Result.map
                                                    (\( inTpes, targetVal ) ->
                                                        let
                                                            -- this value exists for the sake of clarity.
                                                            -- it drops the current parameter type from the list of input types
                                                            -- so that the apply type doesn't include it
                                                            tpesWithoutCurrentParamTpe : List (Type ())
                                                            tpesWithoutCurrentParamTpe =
                                                                List.drop 1 inTpes

                                                            applyTpe : Type ()
                                                            applyTpe =
                                                                tpesToFunctionType tpesWithoutCurrentParamTpe
                                                                    valDef.outputType
                                                        in
                                                        ( tpesWithoutCurrentParamTpe
                                                        , Value.Apply applyTpe
                                                            targetVal
                                                            paramValue
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
                                (Ok
                                    ( inputTypes
                                      -- start with a reference value that we then apply the arguments to
                                    , Value.Reference (tpesToFunctionType inputTypes valDef.outputType)
                                        outputSrc.functionReference
                                    )
                                )
                    )
                |> Result.map (\( _, val ) -> val)
    in
    outputSources
        |> List.indexedMap outputSliceToValue
        |> List.foldl
            (\res acc ->
                -- Combine the results of all output sources into a single result.
                case ( res, acc ) of
                    ( Ok v, Ok accSoFar ) ->
                        Ok (v :: accSoFar)

                    ( Ok _, Err err ) ->
                        Err err

                    ( Err errs, Ok _ ) ->
                        Err errs

                    ( Err resErrs, Err accErrs ) ->
                        Err (resErrs ++ accErrs)
            )
            (Ok [])
        |> Result.map
            (\v ->
                -- At this point, we should have a list of values that represent slices of an output.
                case v of
                    [] ->
                        -- but it shouldn't if the list is empty, we return a unit value
                        Value.Unit (Type.Unit ())

                    head :: _ ->
                        let
                            -- we extract the type of the output from the first value
                            outTpe =
                                Value.valueAttribute head
                        in
                        -- Return an expression that concatenates all the slices into a single output value.
                        Value.Apply
                            outTpe
                            (Value.Reference
                                (Type.Function ()
                                    (Type.Reference ()
                                        (FQName.fqn "Morphir.SDK" "List" "List")
                                        [ outTpe ]
                                    )
                                    outTpe
                                )
                                (FQName.fqn "Morphir.SDK" "List" "concat")
                            )
                            (Value.List
                                (Type.Reference ()
                                    (FQName.fqn "Morphir.SDK" "List" "List")
                                    [ outTpe ]
                                )
                                v
                            )
            )



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
        inputsAndStates : Set DataSourceName
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
            distrosByName distros
    in
    comp.outputs
        |> Dict.foldl
            (\outputName outputSources acc ->
                case outputSources of
                    [] ->
                        acc

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


{-| Collects errors for unused inputs or states in a `Component`.

This function identifies inputs or states that are declared in the `inputs` or `states` fields of a `Component`
but are not referenced in any of the `outputs`. These unused inputs or states are returned as a list of `Error`.

-}
collectUnusedInputStateErrors : Component -> List Error
collectUnusedInputStateErrors comp =
    let
        inputsAndStates : Set DataSourceName
        inputsAndStates =
            Dict.keys comp.inputs
                |> List.append (Dict.keys comp.states)
                |> Set.fromList

        usedInputsAndStates : Set DataSourceName
        usedInputsAndStates =
            comp.outputs
                |> Dict.values
                |> List.concat
                |> List.concatMap (.arguments >> Dict.values)
                |> Set.fromList
    in
    Set.diff inputsAndStates usedInputsAndStates
        |> Set.toList
        |> List.map UnusedInputOrState
