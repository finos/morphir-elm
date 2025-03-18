module Morphir.IR.NameConstructorArguments exposing (..)

import Dict exposing (Dict)
import Morphir.IR.AccessControlled as AccessControlled exposing (AccessControlled)
import Morphir.IR.Documented as Documented exposing (Documented)
import Morphir.IR.Module as Module
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package as Package
import Morphir.IR.Type as Type


rewritePackage : Package.Definition ta va -> Package.Definition ta va
rewritePackage packageDef =
    { packageDef
        | modules =
            packageDef.modules
                |> Dict.map
                    (\_ accessControlledModuleDef ->
                        accessControlledModuleDef
                            |> AccessControlled.map rewriteModule
                    )
    }


rewriteModule : Module.Definition ta va -> Module.Definition ta va
rewriteModule moduleDef =
    let
        -- Helper function to get the argument names from a function definition
        getFunctionArgNames : Name -> List (Type.Type ta) -> Maybe (List Name)
        getFunctionArgNames funcName ctorArgTypes =
            moduleDef.values
                |> Dict.get funcName
                |> Maybe.andThen
                    (\valueDef ->
                        let
                            funcArgs : List ( Name, va, Type.Type ta )
                            funcArgs =
                                valueDef.value.value.inputTypes

                            funcArgTypes : List (Type.Type ta)
                            funcArgTypes =
                                funcArgs
                                    |> List.map (\( _, _, tpe ) -> tpe)
                        in
                        -- If the function argument types match the constructor argument types
                        if List.length funcArgTypes == List.length ctorArgTypes then
                            -- return the argument names
                            Just (List.map (\( argName, _, _ ) -> argName) funcArgs)

                        else
                            -- Otherwise, we did not find a matching function
                            Nothing
                    )

        -- Helper function to rewrite constructor arguments
        rewriteConstructorArgs : Name -> List ( Name, Type.Type ta ) -> List ( Name, Type.Type ta )
        rewriteConstructorArgs ctorName args =
            case getFunctionArgNames ctorName (args |> List.map Tuple.second) of
                Just argNames ->
                    List.map2 (\newName ( _, tpe ) -> ( newName, tpe )) argNames args

                Nothing ->
                    args

        -- Helper function to rewrite custom type definitions
        rewriteCustomType : Type.Definition ta -> Type.Definition ta
        rewriteCustomType typeDef =
            case typeDef of
                Type.CustomTypeDefinition typeParams ctors ->
                    let
                        newCtors =
                            ctors
                                |> AccessControlled.map
                                    (Dict.map
                                        (\ctorName ctorArgs ->
                                            rewriteConstructorArgs ctorName ctorArgs
                                        )
                                    )
                    in
                    Type.CustomTypeDefinition typeParams newCtors

                _ ->
                    typeDef

        -- Rewrite all custom types in the module
        newTypes : Dict Name (AccessControlled (Documented (Type.Definition ta)))
        newTypes =
            moduleDef.types
                |> Dict.map
                    (\_ typeDef ->
                        AccessControlled.map
                            (\d -> Documented.map rewriteCustomType d)
                            typeDef
                    )
    in
    { moduleDef | types = newTypes }
