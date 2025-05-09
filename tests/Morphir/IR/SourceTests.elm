module Morphir.IR.SourceTests exposing (tests)

import AssocSet as Set
import Dict exposing (Dict)
import Expect
import Morphir.IR.AccessControlled exposing (public)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (fQName, fqn)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Source exposing (Component, DataType(..), Error(..), toDistributionComponent)
import Morphir.IR.Type as Type exposing (Definition(..))
import Morphir.IR.Value as Value
import Test exposing (Test, describe, test)


morphirSDKPath : Path
morphirSDKPath =
    Path.fromString "Morphir.SDK"


samplePackageName : Path
samplePackageName =
    Path.fromString "SamplePackage"


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
                                                        (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "username" ]) [])
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
                                                [ ( [ "input", "data" ]
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "input", "record" ]) [])
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "input", "record" ]) [])
                                                  )
                                                , ( [ "state", "data" ]
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "record" ]) [])
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "record" ]) [])
                                                  )
                                                , ( [ "state", "data", "two" ]
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "two", "record" ]) [])
                                                  , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "two", "record" ]) [])
                                                  )
                                                ]
                                            , outputType = listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "output", "rec" ]) [])
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
                            [ ( [ "input", "data" ], [ "input", "one" ] )
                            , ( [ "state", "data" ], [ "state", "one" ] )
                            , ( [ "state", "data", "two" ], [ "state", "two" ] )
                            ]
                  }
                ]
              )
            ]
    }


listTpe : Type.Type () -> Type.Type ()
listTpe tpe =
    Type.Reference () (fQName morphirSDKPath [ [ "list" ] ] [ "list" ]) [ tpe ]


tests : Test
tests =
    describe "toDistributionComponent tests"
        [ test "Handles empty component" <|
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
                    (Ok expectedComponent)
                    (toDistributionComponent [ inputDistribution ] emptySourceComponent)
        , test "Converts a valid distribution and component to a distribution component with tree shaking" <|
            \_ ->
                let
                    expectedLibraries =
                        Dict.fromList
                            [ ( samplePackageName
                              , { modules =
                                    Dict.fromList
                                        [ ( [ [ "types" ] ]
                                          , public
                                                { types =
                                                    Dict.fromList
                                                        [ ( [ "username" ]
                                                          , public
                                                                (Documented ""
                                                                    (Type.TypeAliasDefinition []
                                                                        (Type.Reference () (fQName morphirSDKPath [ [ "string" ] ] [ "string" ]) [])
                                                                    )
                                                                )
                                                          )
                                                        , ( [ "amount" ]
                                                          , public
                                                                (Documented ""
                                                                    (Type.TypeAliasDefinition []
                                                                        (Type.Reference () (fQName morphirSDKPath [ [ "basics" ] ] [ "float" ]) [])
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
                                                                                (Type.Reference () (fQName samplePackageName [ [ "types" ] ] [ "username" ]) [])
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
                                                        [ ( [ "output", "function" ]
                                                          , public
                                                                (Documented ""
                                                                    { inputTypes =
                                                                        [ ( [ "input", "data" ]
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "input", "record" ]) [])
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "input", "record" ]) [])
                                                                          )
                                                                        , ( [ "state", "data" ]
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "record" ]) [])
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "record" ]) [])
                                                                          )
                                                                        , ( [ "state", "data", "two" ]
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "two", "record" ]) [])
                                                                          , listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "sample", "state", "two", "record" ]) [])
                                                                          )
                                                                        ]
                                                                    , outputType = listTpe (Type.Reference () (fQName samplePackageName [ [ "module" ] ] [ "output", "rec" ]) [])
                                                                    , body = Value.Unit (Type.Unit ())
                                                                    }
                                                                )
                                                          )
                                                        ]
                                                , doc = Nothing
                                                }
                                          )
                                        ]
                                }
                              )
                            ]

                    expectedComponent : Distribution.Component
                    expectedComponent =
                        { name = [ [ "sample" ], [ "name" ] ]
                        , libraries = expectedLibraries
                        , inputs =
                            Dict.fromList
                                [ ( [ "input", "one" ]
                                  , listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleInputRecord") [])
                                  )
                                ]
                        , states =
                            Dict.fromList
                                [ ( [ "state", "one" ]
                                  , listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateRecord") [])
                                  )
                                , ( [ "state", "two" ]
                                  , listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateTwoRecord") [])
                                  )
                                ]
                        , outputs =
                            Dict.fromList
                                [ ( [ "output", "one" ]
                                  , Value.Apply
                                        (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                        (Value.Reference
                                            (Type.Function ()
                                                (listTpe (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") [])))
                                                (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                            )
                                            (fqn "Morphir.SDK" "List" "concat")
                                        )
                                        (Value.List (listTpe (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") [])))
                                            [ Value.Apply (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                                (Value.Apply
                                                    (Type.Function ()
                                                        (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateTwoRecord") []))
                                                        (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                                    )
                                                    (Value.Apply
                                                        (Type.Function ()
                                                            (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateRecord") []))
                                                            (Type.Function ()
                                                                (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateTwoRecord") []))
                                                                (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                                            )
                                                        )
                                                        (Value.Reference
                                                            (Type.Function ()
                                                                (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleInputRecord") []))
                                                                (Type.Function ()
                                                                    (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateRecord") []))
                                                                    (Type.Function ()
                                                                        (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateTwoRecord") []))
                                                                        (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "OutputRec") []))
                                                                    )
                                                                )
                                                            )
                                                            (fqn "SamplePackage" "Module" "OutputFunction")
                                                        )
                                                        (Value.Variable (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleInputRecord") []))
                                                            [ "input", "one" ]
                                                        )
                                                    )
                                                    (Value.Variable (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateRecord") []))
                                                        [ "state", "one" ]
                                                    )
                                                )
                                                (Value.Variable (listTpe (Type.Reference () (fqn "SamplePackage" "Module" "SampleStateTwoRecord") []))
                                                    [ "state", "two" ]
                                                )
                                            ]
                                        )
                                  )
                                ]
                        }
                in
                Expect.equal
                    (Ok expectedComponent)
                    (toDistributionComponent [ sampleDistro ] sampleComponent)
        , test "Errors out when inputs or state contains unused declarations" <|
            \_ ->
                let
                    componentWithUnusedInputAndStateDeclaration =
                        { sampleComponent
                            | inputs =
                                Dict.insert [ "unused", "input" ]
                                    (RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "input", "record" ] ))
                                    sampleComponent.inputs
                            , states =
                                Dict.insert [ "unused", "state" ]
                                    (RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "state", "record" ] ))
                                    sampleComponent.states
                        }
                in
                Expect.equal
                    (toDistributionComponent [ sampleDistro ] componentWithUnusedInputAndStateDeclaration)
                    (Err [ UnusedInputOrState [ "unused", "input" ], UnusedInputOrState [ "unused", "state" ] ])
        , test "Should produce other errors" <|
            \_ ->
                let
                    errorComponent =
                        { sampleComponent
                            | states =
                                Dict.fromList
                                    -- conflicting with input
                                    [ ( [ "input", "one" ]
                                      , RowSet ( samplePackageName, [ [ "module" ] ], [ "sample", "state", "record" ] )
                                      )
                                    ]
                            , outputs =
                                Dict.fromList
                                    [ ( [ "output", "one" ]
                                      , [ { functionReference = ( samplePackageName, [ [ "module" ] ], [ "output", "function" ] )
                                          , arguments =
                                                Dict.fromList
                                                    [ ( [ "wrong", "param", "name" ], [ "input", "one" ] )
                                                    , ( [ "state", "data" ], [ "state", "one" ] )
                                                    ]
                                          }
                                        ]
                                      )
                                    ]
                        }

                    conflictingNameSampleDistro =
                        Distribution.Library samplePackageName Dict.empty { modules = Dict.empty }
                in
                Expect.equal
                    (Err
                        (Set.fromList
                            [ MultiplePackageShareSameName 2 [ [ "sample", "package" ] ]
                            , UnknownInputStateReference [ "output", "one" ] [ [ "state", "one" ] ]
                            , InputStateNameConflict [ [ "input", "one" ] ]
                            ]
                        )
                    )
                    (toDistributionComponent [ conflictingNameSampleDistro, sampleDistro ] errorComponent |> Result.mapError Set.fromList)
        ]
