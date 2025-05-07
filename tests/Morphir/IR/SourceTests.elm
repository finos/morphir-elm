module Morphir.IR.SourceTests exposing (tests)

import Dict exposing (Dict)
import Expect
import Morphir.IR.AccessControlled exposing (public)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (fQName)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Source exposing (Component, DataType(..), toDistributionComponent)
import Morphir.IR.Type as Type exposing (Definition(..))
import Morphir.IR.Value as Value
import Test exposing (Test, describe, test)


morphirSDKPath : Path
morphirSDKPath =
    Path.fromString "Morphir.SDK"


samplePackageName : Path
samplePackageName =
    Path.fromString "SamplePackage"


sampleComponent : Component
sampleComponent =
    { name = Path.fromString "Sample.Name"
    , inputs =
        Dict.fromList
            [ ( [ "input", "one" ]
              , RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "input", "record" ] )
              )
            ]
    , states =
        Dict.fromList
            [ ( [ "state", "one" ]
              , RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "state", "record" ] )
              )
            , ( [ "state", "two" ]
              , RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "state", "two", "record" ] )
              )
            ]
    , outputs =
        Dict.fromList
            [ ( [ "output", "one" ]
              , [ { functionReference = ( samplePackageName, [ [ "module" ] ], [ "output", "function" ] )
                  , arguments =
                        Dict.fromList
                            [ ( [ "arg", "one" ], [ "input", "one" ] )
                            , ( [ "arg", "two" ], [ "state", "one" ] )
                            ]
                  }
                ]
              )
            ]
    }


sampleDistro : Distribution
sampleDistro =
    Distribution.Library
        samplePackageName
        Dict.empty
        { modules =
            Dict.fromList
                [ ( [ [ "types" ] ]
                  , public
                        { types =
                            Dict.fromList
                                [ ( [ "amount" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "float" ]) [])
                                            )
                                        )
                                  )
                                , ( [ "unused" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "int" ]) [])
                                            )
                                        )
                                  )
                                , ( [ "username" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Reference () (fQName morphirSDKPath [ [ "string" ] ] [ "string" ]) [])
                                            )
                                        )
                                  )
                                , ( [ "used", "output" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "username" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "username" ]) [])
                                                    , Type.Field [ "password" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "string" ] ] [ "string" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                ]
                        , values =
                            Dict.empty
                        , doc = Nothing
                        }
                  )
                , ( [ [ "module" ] ]
                  , public
                        { types =
                            Dict.fromList
                                [ ( [ "sample", "input", "record" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "used" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "float" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                , ( [ "sample", "state", "record" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "string" ] ] [ "string" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "int" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                , ( [ "sample", "state", "two", "record" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "amount" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "string" ] ] [ "string" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )

                                -- this below record should not exist in the tree shaken distribution
                                , ( [ "rec" ]
                                  , public
                                        (Documented " It's a rec "
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "string" ] ] [ "string" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "basics" ] ] [ "bool" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                , ( [ "output", "rec" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "used", "output" ]) [])
                                            )
                                        )
                                  )
                                ]
                        , values =
                            Dict.fromList
                                [ ( [ "unused", "function" ]
                                  , public
                                        (Documented ""
                                            { inputTypes =
                                                [ ( [ "data" ]
                                                  , Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "amount" ]) []
                                                  , Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "unused" ]) []
                                                  )
                                                ]
                                            , outputType = Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "used", "output" ]) []
                                            , body = Value.Unit (Type.Unit ())
                                            }
                                        )
                                  )
                                , ( [ "output", "function" ]
                                  , public
                                        (Documented ""
                                            { inputTypes =
                                                [ ( [ "data" ]
                                                  , Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "simple", "rec" ]) []
                                                  , Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "simple", "rec" ]) []
                                                  )
                                                ]
                                            , outputType = Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "used", "output" ]) []
                                            , body = Value.Unit (Type.Unit ())
                                            }
                                        )
                                  )
                                ]
                        , doc = Nothing
                        }
                  )

                -- this below module should not exist in the tree shaken distribution
                , ( [ [ "module", "b" ] ]
                  , public
                        { types =
                            Dict.fromList
                                [ ( [ "bee" ]
                                  , public
                                        (Documented " It's a bee "
                                            (Type.CustomTypeDefinition []
                                                (public (Dict.fromList [ ( [ "bee" ], [] ) ]))
                                            )
                                        )
                                  )
                                ]
                        , values =
                            Dict.empty
                        , doc = Nothing
                        }
                  )
                ]
        }


tests : Test
tests =
    describe "toDistributionComponent tests"
        [ test "Converts a valid distribution to a component" <|
            \_ ->
                let
                    expectedComponent : Distribution.Component
                    expectedComponent =
                        { name = [ [ "sample" ] ]
                        , libraries = Dict.empty
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }
                in
                Expect.equal
                    (toDistributionComponent [ sampleDistro ] sampleComponent)
                    (Ok expectedComponent)
        , test "Handles empty distribution" <|
            \_ ->
                let
                    inputDistribution =
                        Distribution.Library
                            [ [ "empty" ] ]
                            Dict.empty
                            { modules = Dict.empty }

                    emptySourceComponent : Component
                    emptySourceComponent =
                        { name = [ [ "empty" ] ]
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }

                    expectedComponent : Distribution.Component
                    expectedComponent =
                        { name = [ [ "empty" ] ]
                        , libraries = Dict.empty
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }
                in
                Expect.equal
                    (toDistributionComponent [ inputDistribution ] emptySourceComponent)
                    (Ok expectedComponent)

        --, test "Handles distribution with dependencies" <|
        --    \_ ->
        --        let
        --            dependencies =
        --                Dict.fromList
        --                    [ ( [ [ "dep1" ] ], { modules = Dict.empty } )
        --                    , ( [ [ "dep2" ] ], { modules = Dict.empty } )
        --                    ]
        --
        --            inputDistribution =
        --                Distribution.Library
        --                    [ [ "sample" ] ]
        --                    dependencies
        --                    { modules = Dict.empty }
        --
        --            expectedComponent : Component
        --            expectedComponent =
        --                { name = [ [ "sample" ] ]
        --                , libraries = dependencies
        --                , inputs = Dict.empty
        --                , states = Dict.empty
        --                , outputs = Dict.empty
        --                }
        --        in
        --        Expect.equal
        --            (toDistributionComponent inputDistribution Dict.empty)
        --            expectedComponent
        ]
