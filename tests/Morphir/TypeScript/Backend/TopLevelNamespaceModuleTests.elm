module Morphir.TypeScript.Backend.TopLevelNamespaceModuleTests exposing (topLevelNamespaceModuleTests)

import Dict
import Expect
import Morphir.TypeScript.AST as TS
import Morphir.TypeScript.Backend.MapTopLevelNamespace exposing (mapTopLevelNamespaceModule)
import Morphir.TypeScript.ExampleDistribution as ExampleDistribution
import Test exposing (Test, describe, test)


topLevelNamespaceModuleTests : Test
topLevelNamespaceModuleTests =
    describe "topLevelNamespaceModule"
        [ test "toplevel TypeScript module with all namespaces exposed by a package"
            (\_ ->
                mapTopLevelNamespaceModule ExampleDistribution.examplePackageName ExampleDistribution.examplePackageDef
                    |> Expect.equal
                        { dirPath = []
                        , fileName = "Sample.ts"
                        , imports =
                            [ ( [ [ "sample" ] ], [ [ "module", "a" ] ] )
                            , ( [ [ "sample" ] ], [ [ "module", "b" ] ] )
                            ]
                        , typeDefs =
                            [ TS.Namespace
                                { content =
                                    [ TS.ImportAlias
                                        { name = [ "module", "a" ]
                                        , namespacePath = ( [ [ "sample" ] ], [ [ "module", "a" ] ] )
                                        , privacy = TS.Public
                                        }
                                    , TS.ImportAlias
                                        { name = [ "module", "b" ]
                                        , namespacePath = ( [ [ "sample" ] ], [ [ "module", "b" ] ] )
                                        , privacy = TS.Private
                                        }
                                    ]
                                , name = [ "sample" ]
                                , privacy = TS.Public
                                }
                            ]
                        }
            )
        ]
