module Morphir.TypeScript.Backend.Module exposing (..)

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


mapModuleDefinition : Distribution -> Package.PackageName -> Path -> AccessControlled (Module.Definition ta (Type ())) -> List TS.Module
mapModuleDefinition distribution currentPackagePath currentModulePath accessControlledModuleDef =
    let
        ( typeScriptPackagePath, moduleName ) =
            getTypeScriptPackagePathAndModuleName currentPackagePath currentModulePath

        typeDefs : List TS.TypeDef
        typeDefs =
            accessControlledModuleDef.value.types
                |> Dict.toList
                |> List.concatMap
                    (\( typeName, typeDef ) -> mapTypeDefinition typeName typeDef currentModulePath)

        constAndFunctionDefs : List TS.Statement
        constAndFunctionDefs =
            accessControlledModuleDef.value.values
                |> Dict.toList
                |> List.map
                    (\( valueName, accDocValueDef ) ->
                        mapConstAndFunctionDefinition valueName
                            accDocValueDef.value.value
                            currentModulePath
                    )

        namespace : TS.TypeDef
        namespace =
            TS.Namespace
                { name = TS.namespaceNameFromPackageAndModule currentPackagePath currentModulePath
                , privacy = TS.Public
                , content = typeDefs
                }

        codecsImport =
            { importClause = "* as codecs"
            , moduleSpecifier = makeRelativeImport typeScriptPackagePath "morphir/internal/Codecs"
            }

        imports =
            codecsImport
                :: (namespace
                        |> getUniqueImportRefs currentPackagePath currentModulePath
                        |> List.map (renderInternalImport typeScriptPackagePath)
                   )

        modulePath =
            processModulePath currentModulePath

        valueExports =
            accessControlledModuleDef.value.values
                |> Dict.foldl
                    (\key accessControlled acc ->
                        case accessControlled.access of
                            Public ->
                                Name.toCamelCase key :: acc

                            Private ->
                                acc
                    )
                    []

        {--Collect references from inside the module,
        filter out references to current module
        then sort references and get a list of unique references-}
        moduleUnit : TS.Module
        moduleUnit =
            { modulePath = modulePath
            , imports = imports
            , typeDefs = typeDefs
            , statements = constAndFunctionDefs
            , exports = valueExports
            }
    in
    [ moduleUnit ]
