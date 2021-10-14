module Morphir.TypeScript.ExampleDistribution exposing (..)

import Dict
import Expect
import Morphir.IR.AccessControlled exposing (private, public)
import Morphir.IR.Distribution as Distribution exposing (Distribution)
import Morphir.IR.Distribution.Codec as DistributionCodec
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (fQName)
import Morphir.IR.Package as Package
import Morphir.IR.Type as Type exposing (Type)



{--Adapted from tests/Morphir/IR/Distribution/CodecTests.elm --}


examplePackageName : Package.PackageName
examplePackageName =
    [ [ "sample" ] ]


examplePackageDef : Package.Definition () (Type ())
examplePackageDef =
    { modules =
        Dict.fromList
            [ ( [ [ "module", "a" ] ]
              , public
                    { types =
                        Dict.fromList
                            [ ( [ "bar" ]
                              , public
                                    (Documented ""
                                        (Type.TypeAliasDefinition []
                                            (Type.Reference () (fQName examplePackageName [ [ "a" ] ] [ "foo" ]) [])
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
                                                      , [ ( [ "arg", "1" ], Type.Reference () (fQName examplePackageName [ [ "b" ] ] [ "bee" ]) [] )
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
                                                    (Type.Reference () (fQName examplePackageName [ [ "a" ] ] [ "foo" ]) [])
                                                , Type.Field [ "field", "2" ]
                                                    (Type.Reference () (fQName examplePackageName [ [ "a" ] ] [ "bar" ]) [])
                                                ]
                                            )
                                        )
                                    )
                              )
                            ]
                    , values =
                        Dict.empty
                    }
              )
            , ( [ [ "module", "b" ] ]
              , private
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
                    }
              )
            ]
    }


exampleDistribution : Distribution
exampleDistribution =
    Distribution.Library examplePackageName Dict.empty examplePackageDef
