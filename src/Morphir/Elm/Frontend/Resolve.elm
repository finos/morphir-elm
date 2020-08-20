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


module Morphir.Elm.Frontend.Resolve exposing (Context, Error(..), ImportedNames, LocalNames, ModuleResolver, collectImportedNames, createModuleResolver, encodeError)

{-| This module contains tools to resolve local names in the Elm source code to [fully-qualified names](../../../IR/FQName) in the IR.
-}

import Dict exposing (Dict)
import Elm.Syntax.Exposing exposing (Exposing(..), TopLevelExpose(..))
import Elm.Syntax.Import exposing (Import)
import Elm.Syntax.Node as Node exposing (Node(..))
import Elm.Syntax.Range exposing (emptyRange)
import Json.Encode as Encode
import Morphir.IR.AccessControlled exposing (AccessControlled)
import Morphir.IR.FQName exposing (FQName, fQName)
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Name.Codec exposing (encodeName)
import Morphir.IR.Package as Package
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Path.Codec exposing (encodePath)
import Morphir.IR.Type as Type
import Morphir.JsonExtra as JsonExtra
import Set exposing (Set)


type alias ModuleName =
    List String


type alias LocalName =
    String


type Error
    = CouldNotDecompose ModuleName
    | CouldNotFindLocalName Trace NameType LocalName
    | CouldNotFindName Path Path Name
    | CouldNotFindModule Path Path
    | CouldNotFindPackage Path
    | ModuleNotImported ModuleName
    | AliasNotFound String
    | PackageNotPrefixOfModule Path Path
    | CouldNotFindContainingModule Trace NameType LocalName
    | AmbigousImports LocalName (List Path)


encodeError : Error -> Encode.Value
encodeError error =
    case error of
        CouldNotDecompose moduleName ->
            JsonExtra.encodeConstructor "CouldNotDecompose"
                [ Encode.string (String.join "." moduleName) ]

        CouldNotFindLocalName trace target localName ->
            JsonExtra.encodeConstructor "CouldNotFindLocalName"
                [ encodeTrace trace
                , encodeNameType target
                , Encode.string localName
                ]

        CouldNotFindName packagePath modulePath localName ->
            JsonExtra.encodeConstructor "CouldNotFindName"
                [ packagePath |> Path.toString Name.toTitleCase "." |> Encode.string
                , modulePath |> Path.toString Name.toTitleCase "." |> Encode.string
                , localName |> Name.toTitleCase |> Encode.string
                ]

        CouldNotFindModule packagePath modulePath ->
            JsonExtra.encodeConstructor "CouldNotFindModule"
                [ packagePath |> Path.toString Name.toTitleCase "." |> Encode.string
                , modulePath |> Path.toString Name.toTitleCase "." |> Encode.string
                ]

        CouldNotFindPackage packagePath ->
            JsonExtra.encodeConstructor "CouldNotFindPackage"
                [ packagePath |> Path.toString Name.toTitleCase "." |> Encode.string ]

        ModuleNotImported moduleName ->
            JsonExtra.encodeConstructor "ModuleNotImported"
                [ Encode.string (String.join "." moduleName) ]

        AliasNotFound alias ->
            JsonExtra.encodeConstructor "AliasNotFound"
                [ Encode.string alias ]

        PackageNotPrefixOfModule packagePath modulePath ->
            JsonExtra.encodeConstructor "PackageNotPrefixOfModule"
                [ packagePath |> Path.toString Name.toTitleCase "." |> Encode.string
                , modulePath |> Path.toString Name.toTitleCase "." |> Encode.string
                ]

        CouldNotFindContainingModule trace target localName ->
            JsonExtra.encodeConstructor "CouldNotFindContainingModule"
                [ encodeTrace trace
                , encodeNameType target
                , Encode.string localName
                ]

        AmbigousImports localName modulePaths ->
            JsonExtra.encodeConstructor "AmbigousImports"
                [ Encode.string localName
                , Encode.list encodePath modulePaths
                ]


type NameType
    = Type
    | Ctor
    | Value


encodeNameType : NameType -> Encode.Value
encodeNameType kind =
    case kind of
        Type ->
            Encode.string "type"

        Ctor ->
            Encode.string "ctor"

        Value ->
            Encode.string "value"


type Trace
    = ResolveTarget NameType ModuleName LocalName
    | ScannedLocalNames LocalNames Trace


encodeTrace : Trace -> Encode.Value
encodeTrace trace =
    case trace of
        ResolveTarget nameType moduleName localName ->
            Encode.list identity
                [ Encode.string "resolve_target"
                , encodeNameType nameType
                , Encode.list Encode.string moduleName
                , Encode.string localName
                ]

        ScannedLocalNames localNames nestedTrace ->
            Encode.list identity
                [ Encode.string "scanned_local_names"
                , encodeLocalNames localNames
                , encodeTrace nestedTrace
                ]


type alias LocalNames =
    { typeNames : List Name
    , ctorNames : Dict Name (List Name)
    , valueNames : List Name
    }


type alias ImportedNames =
    { typeNames : Dict Name (List Path)
    , ctorNames : Dict Name (List Path)
    , valueNames : Dict Name (List Path)
    }


encodeLocalNames : LocalNames -> Encode.Value
encodeLocalNames localNames =
    Encode.object
        [ ( "typeNames", Encode.list encodeName localNames.typeNames )
        , ( "ctorNames"
          , localNames.ctorNames
                |> Dict.toList
                |> Encode.list
                    (\( typeName, ctorNames ) ->
                        Encode.list identity
                            [ encodeName typeName
                            , Encode.list encodeName ctorNames
                            ]
                    )
          )
        , ( "valueNames", Encode.list encodeName localNames.valueNames )
        ]


type alias ModuleResolver =
    { resolveType : ModuleName -> LocalName -> Result Error FQName
    , resolveCtor : ModuleName -> LocalName -> Result Error FQName
    , resolveValue : ModuleName -> LocalName -> Result Error FQName
    }


defaultImports : List Import
defaultImports =
    let
        importExplicit : ModuleName -> Maybe String -> List TopLevelExpose -> Import
        importExplicit moduleName maybeAlias exposingList =
            Import
                (Node emptyRange moduleName)
                (maybeAlias
                    |> Maybe.map (List.singleton >> Node emptyRange)
                )
                (exposingList
                    |> List.map (Node emptyRange)
                    |> Explicit
                    |> Node emptyRange
                    |> Just
                )
    in
    [ importExplicit [ "Morphir", "SDK", "Bool" ] Nothing [ TypeOrAliasExpose "Bool" ]
    , importExplicit [ "Morphir", "SDK", "Char" ] (Just "Char") [ TypeOrAliasExpose "Char" ]
    , importExplicit [ "Morphir", "SDK", "Int" ] Nothing [ TypeOrAliasExpose "Int" ]
    , importExplicit [ "Morphir", "SDK", "Float" ] Nothing [ TypeOrAliasExpose "Float" ]
    , importExplicit [ "Morphir", "SDK", "String" ] (Just "String") [ TypeOrAliasExpose "String" ]
    , importExplicit [ "Morphir", "SDK", "Maybe" ] (Just "Maybe") [ TypeOrAliasExpose "Maybe" ]
    , importExplicit [ "Morphir", "SDK", "Result" ] (Just "Result") [ TypeOrAliasExpose "Result" ]
    , importExplicit [ "Morphir", "SDK", "List" ] (Just "List") [ TypeOrAliasExpose "List" ]
    , importExplicit [ "Morphir", "SDK", "Regex" ] (Just "Regex") [ TypeOrAliasExpose "Regex" ]
    , importExplicit [ "Morphir", "SDK", "Tuple" ] (Just "Tuple") []
    , importExplicit [ "Morphir", "SDK", "StatefulApp" ] Nothing [ TypeOrAliasExpose "StatefulApp" ]
    ]


moduleMapping : Dict ModuleName ModuleName
moduleMapping =
    Dict.fromList
        [ ( [ "Dict" ], [ "Morphir", "SDK", "Dict" ] )
        , ( [ "Regex" ], [ "Morphir", "SDK", "Regex" ] )
        ]


type alias Context a =
    { dependencies : Dict Path (Package.Specification ())
    , currentPackagePath : Path
    , currentPackageModules : Dict Path (Module.Specification ())
    , explicitImports : List Import
    , currentModulePath : Path
    , moduleDef : Module.Definition a
    }


createModuleResolver : Context a -> ModuleResolver
createModuleResolver ctx =
    let
        lookupModule : Path -> Path -> Result Error (Module.Specification ())
        lookupModule packagePath modulePath =
            let
                modulesResult =
                    if packagePath == ctx.currentPackagePath then
                        Ok ctx.currentPackageModules

                    else
                        ctx.dependencies
                            |> Dict.get packagePath
                            |> Result.fromMaybe (CouldNotFindPackage packagePath)
                            |> Result.map .modules
            in
            modulesResult
                |> Result.andThen
                    (\modules ->
                        modules
                            |> Dict.get modulePath
                            |> Result.fromMaybe (CouldNotFindModule ctx.currentPackagePath modulePath)
                    )

        ctorNames : ModuleName -> LocalName -> Result Error (List String)
        ctorNames moduleName localName =
            let
                typeName : Name
                typeName =
                    Name.fromString localName
            in
            decomposeModuleName moduleName
                |> Result.andThen
                    (\( packagePath, modulePath ) ->
                        lookupModule packagePath modulePath
                            |> Result.andThen
                                (\moduleDecl ->
                                    moduleDecl.types
                                        |> Dict.get typeName
                                        |> Result.fromMaybe (CouldNotFindName packagePath modulePath typeName)
                                )
                            |> Result.map
                                (\documentedTypeDecl ->
                                    case documentedTypeDecl.value of
                                        Type.CustomTypeSpecification _ ctors ->
                                            ctors
                                                |> List.map
                                                    (\(Type.Constructor ctorName _) ->
                                                        ctorName |> Name.toTitleCase
                                                    )

                                        _ ->
                                            []
                                )
                    )

        exposesType : ModuleName -> LocalName -> Result Error Bool
        exposesType moduleName localName =
            let
                typeName : Name
                typeName =
                    Name.fromString localName
            in
            decomposeModuleName moduleName
                |> Result.andThen
                    (\( packagePath, modulePath ) ->
                        lookupModule packagePath modulePath
                            |> Result.map
                                (\moduleDecl ->
                                    moduleDecl.types
                                        |> Dict.get typeName
                                        |> Maybe.map (\_ -> True)
                                        |> Maybe.withDefault False
                                )
                    )

        exposesCtor : ModuleName -> LocalName -> Result Error Bool
        exposesCtor moduleName localName =
            let
                ctorName : Name
                ctorName =
                    Name.fromString localName
            in
            decomposeModuleName moduleName
                |> Result.andThen
                    (\( packagePath, modulePath ) ->
                        lookupModule packagePath modulePath
                            |> Result.map
                                (\moduleDecl ->
                                    let
                                        allCtorNames : List Name
                                        allCtorNames =
                                            moduleDecl.types
                                                |> Dict.toList
                                                |> List.concatMap
                                                    (\( _, documentedTypeDecl ) ->
                                                        case documentedTypeDecl.value of
                                                            Type.CustomTypeSpecification _ ctors ->
                                                                ctors
                                                                    |> List.map
                                                                        (\(Type.Constructor cName _) ->
                                                                            cName
                                                                        )

                                                            _ ->
                                                                []
                                                    )
                                    in
                                    allCtorNames
                                        |> List.member ctorName
                                )
                    )

        exposesValue : ModuleName -> LocalName -> Result Error Bool
        exposesValue moduleName localName =
            let
                valueName : Name
                valueName =
                    Name.fromString localName
            in
            decomposeModuleName moduleName
                |> Result.andThen
                    (\( packagePath, modulePath ) ->
                        lookupModule packagePath modulePath
                            |> Result.map
                                (\moduleDecl ->
                                    moduleDecl.values
                                        |> Dict.get valueName
                                        |> Maybe.map (\_ -> True)
                                        |> Maybe.withDefault False
                                )
                    )

        decomposeModuleName : ModuleName -> Result Error ( Path, Path )
        decomposeModuleName moduleName =
            let
                morphirModuleName : ModuleName
                morphirModuleName =
                    moduleMapping
                        |> Dict.get moduleName
                        |> Maybe.withDefault moduleName

                suppliedModulePath : Path
                suppliedModulePath =
                    morphirModuleName
                        |> List.map Name.fromString

                matchModuleToPackagePath modulePath packagePath =
                    if packagePath |> Path.isPrefixOf modulePath then
                        Just ( packagePath, modulePath |> List.drop (List.length packagePath) )

                    else
                        Nothing
            in
            matchModuleToPackagePath suppliedModulePath ctx.currentPackagePath
                |> Maybe.map Just
                |> Maybe.withDefault
                    (ctx.dependencies
                        |> Dict.keys
                        |> List.filterMap (matchModuleToPackagePath suppliedModulePath)
                        |> List.head
                    )
                |> Result.fromMaybe (CouldNotDecompose morphirModuleName)

        -- As we resolve names we will first have to look at local names so we collect them here.
        localNames : LocalNames
        localNames =
            { typeNames =
                ctx.moduleDef.types
                    |> Dict.keys
            , ctorNames =
                ctx.moduleDef.types
                    |> Dict.toList
                    |> List.filterMap
                        (\( typeName, accessControlledDocumentedTypeDef ) ->
                            case accessControlledDocumentedTypeDef.value.value of
                                Type.CustomTypeDefinition _ accessControlledCtors ->
                                    Just
                                        ( typeName
                                        , accessControlledCtors.value
                                            |> List.map
                                                (\(Type.Constructor name _) ->
                                                    name
                                                )
                                        )

                                _ ->
                                    Nothing
                        )
                    |> Dict.fromList
            , valueNames =
                ctx.moduleDef.values
                    |> Dict.keys
            }

        -- Elm has default imports that are included automatically so we prepend that to the explicit imports.
        imports : List Import
        imports =
            defaultImports ++ ctx.explicitImports

        importedNamesResult : Result Error ImportedNames
        importedNamesResult =
            imports
                |> collectImportedNames
                    (\modulePath ->
                        Err (CouldNotFindModule [] modulePath)
                    )

        explicitNames : (ModuleName -> TopLevelExpose -> List LocalName) -> Dict LocalName ModuleName
        explicitNames matchExpose =
            imports
                |> List.concatMap
                    (\{ moduleName, exposingList } ->
                        case exposingList of
                            Nothing ->
                                []

                            Just (Node _ expose) ->
                                case expose of
                                    All _ ->
                                        []

                                    Explicit explicitExposeNodes ->
                                        explicitExposeNodes
                                            |> List.map Node.value
                                            |> List.concatMap (matchExpose (Node.value moduleName))
                                            |> List.map
                                                (\localName ->
                                                    ( localName
                                                    , Node.value moduleName
                                                    )
                                                )
                    )
                |> Dict.fromList

        explicitTypeNames : Dict LocalName ModuleName
        explicitTypeNames =
            explicitNames
                (\_ topLevelExpose ->
                    case topLevelExpose of
                        TypeOrAliasExpose name ->
                            [ name ]

                        TypeExpose { name } ->
                            [ name ]

                        _ ->
                            []
                )

        explicitCtorNames : Dict LocalName ModuleName
        explicitCtorNames =
            explicitNames
                (\moduleName topLevelExpose ->
                    case topLevelExpose of
                        TypeExpose { name, open } ->
                            open
                                |> Maybe.andThen
                                    (\_ ->
                                        ctorNames moduleName name
                                            |> Result.toMaybe
                                    )
                                |> Maybe.withDefault []

                        _ ->
                            []
                )

        explicitValueNames : Dict LocalName ModuleName
        explicitValueNames =
            explicitNames
                (\moduleName topLevelExpose ->
                    case topLevelExpose of
                        FunctionExpose name ->
                            [ name ]

                        _ ->
                            []
                )

        allExposeModules : List ModuleName
        allExposeModules =
            imports
                |> List.filterMap
                    (\{ moduleName, exposingList } ->
                        case exposingList of
                            Just (Node _ (All _)) ->
                                Just (Node.value moduleName)

                            _ ->
                                Nothing
                    )

        importedModuleNames : Set ModuleName
        importedModuleNames =
            imports
                |> List.map (\{ moduleName } -> Node.value moduleName)
                |> Set.fromList

        moduleAliases : Dict String ModuleName
        moduleAliases =
            imports
                |> List.filterMap
                    (\{ moduleName, moduleAlias } ->
                        moduleAlias
                            |> Maybe.map
                                (\aliasNode ->
                                    ( aliasNode |> Node.value |> String.join "."
                                    , Node.value moduleName
                                    )
                                )
                    )
                |> Dict.fromList

        findContainingModule : NameType -> LocalName -> Maybe ModuleName
        findContainingModule target localName =
            let
                explNames =
                    case target of
                        Type ->
                            explicitTypeNames

                        Ctor ->
                            explicitCtorNames

                        Value ->
                            explicitValueNames

                exposes =
                    case target of
                        Type ->
                            exposesType

                        Ctor ->
                            exposesCtor

                        Value ->
                            exposesValue
            in
            case explNames |> Dict.get localName of
                Just moduleName ->
                    Just moduleName

                Nothing ->
                    allExposeModules
                        |> List.filterMap
                            (\moduleName ->
                                case exposes moduleName localName of
                                    Ok True ->
                                        Just moduleName

                                    _ ->
                                        Nothing
                            )
                        |> List.head

        resolveModuleName : Trace -> NameType -> ModuleName -> LocalName -> Result Error ModuleName
        resolveModuleName trace target moduleName localName =
            case moduleName of
                [] ->
                    findContainingModule target localName
                        |> Result.fromMaybe (CouldNotFindContainingModule trace target localName)

                [ moduleAlias ] ->
                    moduleAliases
                        |> Dict.get moduleAlias
                        |> Result.fromMaybe (AliasNotFound moduleAlias)

                fullModuleName ->
                    if importedModuleNames |> Set.member fullModuleName then
                        Ok fullModuleName

                    else
                        Err (ModuleNotImported fullModuleName)

        resolveWithoutModuleName : Trace -> NameType -> LocalName -> Result Error FQName
        resolveWithoutModuleName trace nameType sourceLocalName =
            let
                localName : Name
                localName =
                    sourceLocalName |> Name.fromString

                localToFullyQualified : Dict Name (List Path) -> Result Error FQName
                localToFullyQualified imported =
                    imported
                        |> Dict.get localName
                        |> Result.fromMaybe (CouldNotFindLocalName trace nameType sourceLocalName)
                        |> Result.andThen
                            (\modulePaths ->
                                case modulePaths of
                                    [] ->
                                        Err (CouldNotFindLocalName trace nameType sourceLocalName)

                                    [ modulePath ] ->
                                        Ok (fQName [] modulePath localName)

                                    _ ->
                                        Err (AmbigousImports sourceLocalName modulePaths)
                            )
            in
            importedNamesResult
                |> Result.andThen
                    (\importedNames ->
                        case nameType of
                            Type ->
                                localToFullyQualified importedNames.typeNames

                            Ctor ->
                                localToFullyQualified importedNames.ctorNames

                            Value ->
                                localToFullyQualified importedNames.valueNames
                    )

        resolve : NameType -> ModuleName -> LocalName -> Result Error FQName
        resolve nameType elmModuleName elmLocalNameToResolve =
            let
                trace : Trace
                trace =
                    ResolveTarget nameType elmModuleName elmLocalNameToResolve

                localNameToResolve =
                    elmLocalNameToResolve |> Name.fromString
            in
            if List.isEmpty elmModuleName then
                -- If the name is not prefixed with a module we need to look it up within the module first
                let
                    isLocalName =
                        case nameType of
                            Type ->
                                localNames.typeNames |> List.member localNameToResolve

                            Ctor ->
                                localNames.ctorNames |> Dict.values |> List.concat |> List.member localNameToResolve

                            Value ->
                                localNames.valueNames |> List.member localNameToResolve
                in
                if isLocalName then
                    if Path.isPrefixOf ctx.currentModulePath ctx.currentPackagePath then
                        Ok (fQName ctx.currentPackagePath (ctx.currentModulePath |> List.drop (List.length ctx.currentPackagePath)) localNameToResolve)

                    else
                        Err (PackageNotPrefixOfModule ctx.currentPackagePath ctx.currentModulePath)

                else
                    resolveWithoutModuleName (ScannedLocalNames localNames trace) nameType elmLocalNameToResolve

            else
                -- If the name is prefixed with a module we can skip the local resolution
                --resolveVeryExternally trace nameType elmModuleName elmLocalNameToResolve
                Err (CouldNotFindLocalName trace nameType elmLocalNameToResolve)

        resolveType : ModuleName -> LocalName -> Result Error FQName
        resolveType moduleName =
            resolve Type
                (moduleMapping |> Dict.get moduleName |> Maybe.withDefault moduleName)

        resolveCtor : ModuleName -> LocalName -> Result Error FQName
        resolveCtor moduleName =
            resolve Ctor
                (moduleMapping |> Dict.get moduleName |> Maybe.withDefault moduleName)

        resolveValue : ModuleName -> LocalName -> Result Error FQName
        resolveValue moduleName =
            resolve Value
                (moduleMapping |> Dict.get moduleName |> Maybe.withDefault moduleName)
    in
    ModuleResolver resolveType resolveCtor resolveValue


moduleSpecToLocalNames : Module.Specification () -> LocalNames
moduleSpecToLocalNames moduleSpec =
    { typeNames =
        moduleSpec.types
            |> Dict.keys
    , ctorNames =
        moduleSpec.types
            |> Dict.toList
            |> List.filterMap
                (\( typeName, typeSpec ) ->
                    case typeSpec.value of
                        Type.OpaqueTypeSpecification _ ->
                            Just ( typeName, [] )

                        Type.CustomTypeSpecification _ ctors ->
                            Just
                                ( typeName
                                , ctors
                                    |> List.map
                                        (\(Type.Constructor ctorName _) ->
                                            ctorName
                                        )
                                )

                        _ ->
                            Nothing
                )
            |> Dict.fromList
    , valueNames =
        moduleSpec.values
            |> Dict.keys
    }


{-| We loop through the imports and create a mapping from local name to module names. Notice that the same
name can be imported from multiple modules which will only cause a collision if the names are actually used.
We will detect and report that during resolution.
-}
collectImportedNames : (Path -> Result Error LocalNames) -> List Import -> Result Error ImportedNames
collectImportedNames getModulesExposedNames imports =
    imports
        |> List.foldl
            (\nextImport importedNamesSoFar ->
                let
                    importModulePath : Path
                    importModulePath =
                        nextImport.moduleName
                            |> Node.value
                            |> List.map Name.fromString

                    appendValue : comparable -> v -> Dict comparable (List v) -> Dict comparable (List v)
                    appendValue key value =
                        Dict.update key
                            (\currentValue ->
                                case currentValue of
                                    Just values ->
                                        Just (List.append values [ value ])

                                    Nothing ->
                                        Just [ value ]
                            )

                    addTypeName : Name -> ImportedNames -> ImportedNames
                    addTypeName localName importedNames =
                        { importedNames
                            | typeNames =
                                importedNames.typeNames
                                    |> appendValue localName importModulePath
                        }

                    addCtorName : Name -> ImportedNames -> ImportedNames
                    addCtorName localName importedNames =
                        { importedNames
                            | ctorNames =
                                importedNames.ctorNames
                                    |> appendValue localName importModulePath
                        }

                    addValueName : Name -> ImportedNames -> ImportedNames
                    addValueName localName importedNames =
                        { importedNames
                            | valueNames =
                                importedNames.valueNames
                                    |> appendValue localName importModulePath
                        }

                    addNames : (Name -> ImportedNames -> ImportedNames) -> List Name -> ImportedNames -> ImportedNames
                    addNames addName localNames importedNames =
                        List.foldl addName importedNames localNames
                in
                case nextImport.exposingList of
                    Just (Node _ expose) ->
                        case expose of
                            Explicit exposeList ->
                                exposeList
                                    |> List.foldl
                                        (\(Node _ nextTopLevelExpose) explicitImportedNamesSoFar ->
                                            case nextTopLevelExpose of
                                                InfixExpose _ ->
                                                    -- Infix declarations are ignored
                                                    explicitImportedNamesSoFar

                                                FunctionExpose sourceName ->
                                                    explicitImportedNamesSoFar
                                                        |> Result.map (addValueName (sourceName |> Name.fromString))

                                                TypeOrAliasExpose sourceName ->
                                                    explicitImportedNamesSoFar
                                                        |> Result.map (addTypeName (sourceName |> Name.fromString))

                                                TypeExpose exposedType ->
                                                    case exposedType.open of
                                                        Just _ ->
                                                            explicitImportedNamesSoFar
                                                                |> Result.map (addTypeName (exposedType.name |> Name.fromString))
                                                                |> Result.andThen
                                                                    (\namesSoFar ->
                                                                        getModulesExposedNames importModulePath
                                                                            |> Result.map
                                                                                (\exposedLocalNames ->
                                                                                    addNames addCtorName (exposedLocalNames.ctorNames |> Dict.values |> List.concat) namesSoFar
                                                                                )
                                                                    )

                                                        Nothing ->
                                                            explicitImportedNamesSoFar
                                                                |> Result.map (addTypeName (exposedType.name |> Name.fromString))
                                        )
                                        importedNamesSoFar

                            All _ ->
                                getModulesExposedNames importModulePath
                                    |> Result.andThen
                                        (\exposedLocalNames ->
                                            importedNamesSoFar
                                                |> Result.map (addNames addTypeName exposedLocalNames.typeNames)
                                                |> Result.map (addNames addCtorName (exposedLocalNames.ctorNames |> Dict.values |> List.concat))
                                                |> Result.map (addNames addValueName exposedLocalNames.valueNames)
                                        )

                    Nothing ->
                        importedNamesSoFar
            )
            (Ok (ImportedNames Dict.empty Dict.empty Dict.empty))
