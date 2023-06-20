module Morphir.DecorationConfig.Backend exposing (..)

{-| It takes the decorations distribution and generates the decorations configuration for your project.
-}

import Dict exposing (Dict)
import Morphir.DecorationConfig.AST exposing (DecorationConfig)
import Morphir.DecorationConfig.PrettyPrinter as PrettyPrinter
import Morphir.File.FileMap exposing (FileMap)
import Morphir.IR.Decoration exposing (AllDecorationConfigAndData, DecorationID)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.Name as Name
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Type exposing (Type)


{-| Code generator options. Contains the irPath and storageLocation
-}
type alias Options =
    { irPath : String
    , storageLocation : String
    }


mapDistribution : Options -> Distribution -> FileMap
mapDistribution options distro =
    case distro of
        Library packageName _ definition ->
            mapPackageDefinition options packageName definition
                |> toFile
                |> List.singleton
                |> Dict.fromList


mapPackageDefinition : Options -> PackageName -> Package.Definition () (Type ()) -> Dict DecorationID DecorationConfig
mapPackageDefinition options pkgName pkgDef =
    pkgDef.modules
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


toFile : Dict DecorationID DecorationConfig -> ( ( List String, String ), String )
toFile configs =
    let
        content =
            PrettyPrinter.printDecorationConfigs configs
    in
    ( ( [], "decorationConfigs.json" ), content )
