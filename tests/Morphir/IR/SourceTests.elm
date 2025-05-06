module Morphir.IR.SourceTests exposing (tests)

import Dict exposing (Dict)
import Expect
import Morphir.IR.AccessControlled exposing (public)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (fQName)
import Morphir.IR.Name as Name
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


distribution1 : Distribution
distribution1 =
    Distribution.Library
        samplePackageName
        Dict.empty
        { modules =
            Dict.fromList
                [ ( [ [ "constants" ] ]
                  , public
                        { types =
                            Dict.fromList
                                [ ( [ "types" ]
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
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "foo" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "a" ] ] [ "bar" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                ]
                        , values =
                            Dict.fromList
                                [ ( [ "output", "function" ]
                                  , public
                                        (Documented ""
                                            { inputTypes =
                                                [ ( [ "data" ]
                                                  , Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []
                                                  , Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []
                                                  )
                                                ]
                                            , outputType = Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "output", "rec" ]) []
                                            , body = Value.Unit (Type.Unit ())
                                            }
                                        )
                                  )
                                ]
                        , doc = Nothing
                        }
                  )
                , ( [ [ "module", "a" ] ]
                  , public
                        { types =
                            Dict.fromList
                                [ ( [ "bar" ]
                                  , public
                                        (Documented ""
                                            (Type.TypeAliasDefinition []
                                                (Type.Reference () (fQName samplePackageName [ [ "a" ] ] [ "foo" ]) [])
                                            )
                                        )
                                  )
                                , ( [ "foo" ]
                                  , public
                                        (Documented ""
                                            (Type.CustomTypeDefinition []
                                                (public
                                                    (Dict.fromList
                                                        [ ( [ "foo" ]
                                                          , [ ( [ "arg", "1" ], Type.Reference () (fQName samplePackageName [ [ "b" ] ] [ "bee" ]) [] )
                                                            ]
                                                          )
                                                        ]
                                                    )
                                                )
                                            )
                                        )
                                  )
                                , ( [ "rec" ]
                                  , public
                                        (Documented " It's a rec "
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "a" ] ] [ "foo" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName samplePackageName [ [ "a" ] ] [ "bar" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                , ( [ "simple", "rec" ]
                                  , public
                                        (Documented "It's a simple rec "
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ Type.Field [ "field", "1" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "string" ]) [])
                                                    , Type.Field [ "field", "2" ]
                                                        (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "int" ]) [])
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                , ( [ "output", "rec" ]
                                  , public
                                        (Documented "It's an even simpler rec"
                                            (Type.TypeAliasDefinition []
                                                (Type.Record ()
                                                    [ { name = [ "result" ]
                                                      , tpe = Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "int" ]) []
                                                      }
                                                    ]
                                                )
                                            )
                                        )
                                  )
                                ]
                        , values =
                            Dict.fromList
                                [ ( [ "output", "function" ]
                                  , public
                                        (Documented ""
                                            { inputTypes =
                                                [ ( [ "data" ]
                                                  , Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []
                                                  , Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []
                                                  )
                                                ]
                                            , outputType = Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "output", "rec" ]) []
                                            , body = Value.Unit (Type.Unit ())
                                            }
                                        )
                                  )
                                ]
                        , doc = Nothing
                        }
                  )
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
                    inputDistribution =
                        Distribution.Library
                            [ [ "sample" ] ]
                            Dict.empty
                            { modules = Dict.empty }

                    expectedComponent : Component
                    expectedComponent =
                        { name = [ [ "sample" ] ]
                        , libraries = Dict.empty
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }
                in
                Expect.equal
                    (toDistributionComponent inputDistribution Dict.empty)
                    expectedComponent
        , test "Handles empty distribution" <|
            \_ ->
                let
                    inputDistribution =
                        Distribution.Library
                            [ [ "empty" ] ]
                            Dict.empty
                            { modules = Dict.empty }

                    expectedComponent : Component
                    expectedComponent =
                        { name = [ [ "empty" ] ]
                        , libraries = Dict.empty
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }
                in
                Expect.equal
                    (toDistributionComponent inputDistribution Dict.empty)
                    expectedComponent
        , test "Handles distribution with dependencies" <|
            \_ ->
                let
                    dependencies =
                        Dict.fromList
                            [ ( [ [ "dep1" ] ], { modules = Dict.empty } )
                            , ( [ [ "dep2" ] ], { modules = Dict.empty } )
                            ]

                    inputDistribution =
                        Distribution.Library
                            [ [ "sample" ] ]
                            dependencies
                            { modules = Dict.empty }

                    expectedComponent : Component
                    expectedComponent =
                        { name = [ [ "sample" ] ]
                        , libraries = dependencies
                        , inputs = Dict.empty
                        , states = Dict.empty
                        , outputs = Dict.empty
                        }
                in
                Expect.equal
                    (toDistributionComponent inputDistribution Dict.empty)
                    expectedComponent
        ]
