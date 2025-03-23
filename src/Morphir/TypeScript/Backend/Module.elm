module Morphir.TypeScript.Backend.Module exposing (..)

import Dict
import Morphir.IR.AccessControlled exposing (Access(..), AccessControlled)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name
import Morphir.IR.Package as Package
import Morphir.IR.Path exposing (Path)
import Morphir.IR.Type exposing (Type)
import Morphir.TypeScript.AST as TS
import Morphir.TypeScript.Backend.Imports exposing (getTypeScriptPackagePathAndModuleName, getUniqueImportRefs, makeRelativeImport, renderInternalImport)
import Morphir.TypeScript.Backend.Types exposing (mapTypeDefinition)


mapModuleDefinition : Distribution -> Package.PackageName -> Path -> AccessControlled (Module.Definition ta (Type ())) -> List TS.Module
mapModuleDefinition _ currentPackagePath currentModulePath accessControlledModuleDef =
    let
        ( typeScriptPackagePath, moduleName ) =
            getTypeScriptPackagePathAndModuleName currentPackagePath currentModulePath

        typeDefs : List TS.TypeDef
        typeDefs =
            accessControlledModuleDef.value.types
                |> Dict.toList
                |> List.concatMap
                    (\( typeName, typeDef ) -> mapTypeDefinition typeName typeDef currentModulePath)

        namespace : TS.TypeDef
        namespace =
            TS.Namespace
                { name = TS.namespaceNameFromPackageAndModule currentPackagePath currentModulePath
                , privacy = TS.Public
                , content = typeDefs
                }

        codecsImport =
            { importClause = "* as codecs"
            , moduleSpecifier = makeRelativeImport typeScriptPackagePath "morphir/internal/codecs"
            }

        imports =
            codecsImport
                :: (namespace
                        |> getUniqueImportRefs currentPackagePath currentModulePath
                        |> List.map (renderInternalImport typeScriptPackagePath)
                   )

        {--Collect references from inside the module,
        filter out references to current module
        then sort references and get a list of unique references-}
        moduleUnit : TS.Module
        moduleUnit =
            { modulePath = typeScriptPackagePath ++ [ Name.toHumanWords moduleName |> String.join "-" |> String.toLower ]
            , imports = imports
            , typeDefs = typeDefs
            , statements = []
            , exports = []
            }
    in
    [ moduleUnit ]


processModulePath : Module.ModuleName -> List String
processModulePath modulePath =
    let
        makeWords : List String -> String -> List String -> List String
        makeWords wordsSoFar nextWord name =
            case name of
                [] ->
                    List.reverse wordsSoFar

                [ word ] ->
                    (if String.length word == 1 then
                        (nextWord ++ word) :: wordsSoFar

                     else if String.length nextWord == 0 then
                        word :: wordsSoFar

                     else
                        word :: nextWord :: wordsSoFar
                    )
                        |> List.reverse

                word :: rest ->
                    if String.length word == 1 then
                        makeWords wordsSoFar (nextWord ++ word) rest

                    else if String.length nextWord == 0 then
                        makeWords (word :: wordsSoFar) "" rest

                    else
                        makeWords (word :: nextWord :: wordsSoFar) "" rest
    in
    modulePath |> List.map (makeWords [] "" >> String.join "-")
