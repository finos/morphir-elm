module Morphir.Elm.Frontend.ResolveTests exposing (..)

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

import Dict
import Elm.Syntax.Exposing exposing (ExposedType, Exposing(..), TopLevelExpose(..))
import Elm.Syntax.Import exposing (Import)
import Elm.Syntax.ModuleName exposing (ModuleName)
import Elm.Syntax.Node exposing (Node(..))
import Elm.Syntax.Range exposing (emptyRange)
import Expect
import Morphir.Elm.Frontend.Resolve exposing (Error, ImportedNames, LocalNames, collectImportedNames)
import Morphir.IR.Path exposing (Path)
import Test exposing (Test, describe, test)


collectImportedNamesTests : Test
collectImportedNamesTests =
    let
        -- This is a mock to simulate looking up other modules in the package or in it's dependencies
        getModulesExposedNames : Path -> Result Error LocalNames
        getModulesExposedNames moduleName =
            case moduleName of
                [ [ "other" ], [ "module" ] ] ->
                    Ok
                        (LocalNames
                            [ [ "one" ], [ "bat" ] ]
                            (Dict.fromList
                                [ ( [ "one" ], [ [ "two" ], [ "three" ] ] )
                                ]
                            )
                            [ [ "ugh" ], [ "yeah" ] ]
                        )

                _ ->
                    Ok (LocalNames [] Dict.empty [])

        assert : String -> List Import -> ImportedNames -> Test
        assert testName imports expectedNames =
            test testName <|
                \_ ->
                    collectImportedNames getModulesExposedNames imports
                        |> Expect.equal (Ok expectedNames)
    in
    describe "collectImportedNames"
        [ assert "No imports returns no names"
            []
            (ImportedNames Dict.empty Dict.empty Dict.empty)
        , assert "Single import is decomposed correctly"
            [ Import (Node emptyRange [ "Foo", "Bar" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeOrAliasExpose "Baz")
                            , Node emptyRange (TypeExpose (ExposedType "Bat" Nothing))
                            , Node emptyRange (FunctionExpose "ugh")
                            ]
                        )
                    )
                )
            ]
            (ImportedNames
                (Dict.fromList
                    [ ( [ "baz" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    , ( [ "bat" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    ]
                )
                Dict.empty
                (Dict.fromList
                    [ ( [ "ugh" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    ]
                )
            )
        , assert "Multiple imports are decomposed and merged correctly"
            [ Import (Node emptyRange [ "Foo", "Bar" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeOrAliasExpose "Baz")
                            , Node emptyRange (TypeExpose (ExposedType "Bat" Nothing))
                            , Node emptyRange (FunctionExpose "ugh")
                            ]
                        )
                    )
                )
            , Import (Node emptyRange [ "Other", "Module" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeOrAliasExpose "One")
                            , Node emptyRange (TypeExpose (ExposedType "Bat" Nothing))
                            , Node emptyRange (FunctionExpose "ugh")
                            , Node emptyRange (FunctionExpose "yeah")
                            ]
                        )
                    )
                )
            ]
            (ImportedNames
                (Dict.fromList
                    [ ( [ "baz" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    , ( [ "bat" ], [ [ [ "foo" ], [ "bar" ] ], [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "one" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
                Dict.empty
                (Dict.fromList
                    [ ( [ "ugh" ], [ [ [ "foo" ], [ "bar" ] ], [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "yeah" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
            )
        , assert "Top level open imports are decomposed and merged correctly"
            [ Import (Node emptyRange [ "Foo", "Bar" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeOrAliasExpose "Baz")
                            , Node emptyRange (TypeExpose (ExposedType "Bat" Nothing))
                            , Node emptyRange (FunctionExpose "ugh")
                            ]
                        )
                    )
                )
            , Import (Node emptyRange [ "Other", "Module" ])
                Nothing
                (Just (Node emptyRange (All emptyRange)))
            ]
            (ImportedNames
                (Dict.fromList
                    [ ( [ "baz" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    , ( [ "bat" ], [ [ [ "foo" ], [ "bar" ] ], [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "one" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
                (Dict.fromList
                    [ ( [ "two" ], [ [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "three" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
                (Dict.fromList
                    [ ( [ "ugh" ], [ [ [ "foo" ], [ "bar" ] ], [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "yeah" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
            )
        , assert "Type level open imports are decomposed and merged correctly"
            [ Import (Node emptyRange [ "Foo", "Bar" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeOrAliasExpose "Baz")
                            , Node emptyRange (TypeExpose (ExposedType "Bat" Nothing))
                            , Node emptyRange (FunctionExpose "ugh")
                            ]
                        )
                    )
                )
            , Import (Node emptyRange [ "Other", "Module" ])
                Nothing
                (Just
                    (Node emptyRange
                        (Explicit
                            [ Node emptyRange (TypeExpose (ExposedType "One" (Just emptyRange)))
                            ]
                        )
                    )
                )
            ]
            (ImportedNames
                (Dict.fromList
                    [ ( [ "baz" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    , ( [ "bat" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    , ( [ "one" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
                (Dict.fromList
                    [ ( [ "two" ], [ [ [ "other" ], [ "module" ] ] ] )
                    , ( [ "three" ], [ [ [ "other" ], [ "module" ] ] ] )
                    ]
                )
                (Dict.fromList
                    [ ( [ "ugh" ], [ [ [ "foo" ], [ "bar" ] ] ] )
                    ]
                )
            )
        ]
