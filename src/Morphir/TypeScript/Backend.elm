module Morphir.TypeScript.Backend exposing
    ( Options
    , mapDistribution
    )

{-| This module contains the TypeScript backend that translates the Morphir IR into TypeScript.
-}

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
import Morphir.TypeScript.Backend.Module as Backend exposing (mapModuleDefinition)
import Morphir.TypeScript.Backend.TopLevelNamespace exposing (makeTopLevelNamespaceModule)
import Morphir.TypeScript.Backend.Types as Types exposing (mapPrivacy, mapTypeDefinition, mapTypeExp)
import Morphir.TypeScript.PrettyPrinter as PrettyPrinter


{-| Placeholder for code generator options. Currently empty.
-}
type alias Options =
    {}


{-| Entry point for the TypeScript backend. It takes the Morphir IR as the input and returns an in-memory
representation of files generated.
-}
mapDistribution : Options -> Distribution -> FileMap
mapDistribution opt distro =
    case distro of
        Distribution.Library packagePath dependencies packageDef ->
            mapPackageDefinition opt distro packagePath packageDef


{-| Represents one element of a FileMap,
ie the file path and the contents of file that needs to be created in the backend output.
The structure is ( (directoryPath, Filename), fileContent)
-}
type alias FileMapElement =
    ( ( List String, String ), String )


mapPackageDefinition : Options -> Distribution -> Package.PackageName -> Package.Definition ta (Type ()) -> FileMap
mapPackageDefinition opt distribution packagePath packageDef =
    let
        topLevelNamespaceModule : TS.Module
        topLevelNamespaceModule =
            makeTopLevelNamespaceModule packagePath packageDef

        individualModules : List TS.Module
        individualModules =
            packageDef.modules
                |> Dict.toList
                |> List.concatMap
                    (\( modulePath, moduleImpl ) ->
                        Backend.mapModuleDefinition distribution packagePath modulePath moduleImpl
                    )

        compilationUnitToFileMapElement : TS.Module -> FileMapElement
        compilationUnitToFileMapElement compilationUnit =
            let
                getPathAndNamefromTSModulePath : List String -> List String -> ( List String, String )
                getPathAndNamefromTSModulePath tsModulePath collectedSoFar =
                    case tsModulePath of
                        [] ->
                            ( List.reverse collectedSoFar, "" )

                        [ last ] ->
                            ( List.reverse collectedSoFar, last )

                        head :: tail ->
                            getPathAndNamefromTSModulePath tail (head :: collectedSoFar)

                ( path, fileName ) =
                    getPathAndNamefromTSModulePath compilationUnit.modulePath []

                fileContent =
                    compilationUnit
                        |> PrettyPrinter.mapCompilationUnit
            in
            ( ( path, fileName ++ ".ts" ), fileContent )
    in
    --(topLevelNamespaceModule :: individualModules)
    individualModules
        |> List.map compilationUnitToFileMapElement
        |> Dict.fromList
