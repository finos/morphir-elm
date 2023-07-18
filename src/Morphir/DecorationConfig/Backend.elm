module Morphir.DecorationConfig.Backend exposing (..)

{-| It takes the decorations distribution and generates the decorations configuration for your project.
-}

import Dict exposing (Dict)
import Morphir.DecorationConfig.Codec exposing (Error, Options, printDecorationConfigs)
import Morphir.File.FileMap exposing (FileMap)
import Morphir.IR.Decoration exposing (AllDecorationConfigAndData, DecorationConfig, DecorationID)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.Module exposing (ModuleName)
import Morphir.IR.Name as Name
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path
import Morphir.IR.Type exposing (Type)
import Set exposing (Set)


mapDistribution : Options -> Distribution -> Result Error FileMap
mapDistribution options distro =
    case distro of
        Library packageName _ definition ->
            mapPackageDefinition options packageName definition
                |> Result.map
                    (\decorationDict ->
                        decorationDict
                            |> toFile
                            |> List.singleton
                            |> Dict.fromList
                    )


mapPackageDefinition : Options -> PackageName -> Package.Definition () (Type ()) -> Result Error (Dict DecorationID DecorationConfig)
mapPackageDefinition options pkgName pkgDef =
    let
        inputModuleName : ModuleName
        inputModuleName =
            [ options.decorationGroup |> Name.fromString ]
                |> Path.fromList

        getDecorations : Package.Definition () (Type ()) -> Result Error (Dict DecorationID DecorationConfig)
        getDecorations newPackage =
            newPackage.modules
                |> Dict.toList
                |> List.concatMap
                    (\( modName, accControlledDef ) ->
                        accControlledDef.value.types
                            |> Dict.toList
                            |> List.map
                                (\( typName, _ ) ->
                                    ( typName |> Name.toSnakeCase
                                    , DecorationConfig
                                        (typName |> Name.toTitleCase)
                                        options.irPath
                                        ( pkgName, modName, typName )
                                        (options.storageLocation ++ "/" ++ ((typName |> Name.toSnakeCase) ++ ".json"))
                                    )
                                )
                    )
                |> Dict.fromList
                |> Ok
    in
    if options.decorationGroup == "" then
        getDecorations pkgDef

    else
        case pkgDef.modules |> Dict.get inputModuleName of
            Just _ ->
                Package.selectModules (inputModuleName |> Set.singleton) pkgName pkgDef
                    |> getDecorations

            Nothing ->
                Err ("Error: The input decoration group " ++ options.decorationGroup ++ " does not exist in the package")


toFile : Dict DecorationID DecorationConfig -> ( ( List String, String ), String )
toFile configs =
    let
        content =
            printDecorationConfigs configs
    in
    ( ( [], "decorationConfigs.json" ), content )
