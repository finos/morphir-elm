module Morphir.IR.Distribution.CodecTests exposing (..)

import Dict
import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.IR.AccessControlled exposing (private, public)
import Morphir.IR.Distribution as Distribution exposing (Component, Distribution)
import Morphir.IR.Distribution.Codec as DistributionCodec
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (fQName)
import Morphir.IR.FormatVersion.Codec as DistributionCodec
import Morphir.IR.Package as Package
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value
import Test exposing (Test, describe, test)


tests : Test
tests =
    let
        sampleIR =
            Distribution.Library samplePackageName Dict.empty samplePackageDef

        sampleComponent : Component
        sampleComponent =
            { name = samplePackageName
            , libraries = Dict.fromList [ ( samplePackageName, samplePackageDef ) ]
            , inputs =
                Dict.fromList
                    [ ( [ "input", "one" ]
                      , Type.Reference ()
                            (fQName morphirSDKPath [ [ "list" ] ] [ "list" ])
                            [ Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []
                            ]
                      )
                    ]
            , states = Dict.empty
            , outputs =
                Dict.fromList
                    [ ( [ "output" ]
                      , Value.Apply (Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "output", "rec" ]) [])
                            (Value.Reference
                                (Type.Function ()
                                    (Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) [])
                                    (Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "output", "rec" ]) [])
                                )
                                (fQName samplePackageName [ [ "module", "a" ] ] [ "output", "function" ])
                            )
                            (Value.Variable (Type.Reference () (fQName samplePackageName [ [ "module", "a" ] ] [ "simple", "rec" ]) []) [ "input", "one" ])
                      )
                    ]
            }
    in
    describe "Codec tests"
        [ test "When IR is encoded and decoded it should return itself"
            (\_ ->
                sampleIR
                    |> DistributionCodec.encodeVersionedDistribution
                    |> Encode.encode 4
                    |> Decode.decodeString DistributionCodec.decodeVersionedDistribution
                    |> Expect.equal (Ok sampleIR)
            )
        , test "Sample JSON should decode into sample IR"
            (\_ ->
                sampleIRJSON
                    |> Decode.decodeString DistributionCodec.decodeVersionedDistribution
                    |> Expect.equal (Ok sampleIR)
            )
        , test "When Component is encoded and decoded it should return itself"
            (\_ ->
                sampleComponent
                    |> DistributionCodec.encodeComponent
                    |> Encode.encode 4
                    |> Decode.decodeString DistributionCodec.decodeComponent
                    |> Expect.equal (Ok sampleComponent)
            )
        , test "Sample Component JSON should decode into sample Component"
            (\_ ->
                sampleComponentJSON
                    |> Decode.decodeString DistributionCodec.decodeComponent
                    |> Expect.equal (Ok sampleComponent)
            )
        ]


morphirSDKPath =
    [ [ "morphir" ], [ "s", "d", "k" ] ]


samplePackageName =
    [ [ "sample" ] ]


samplePackageDef : Package.Definition () (Type ())
samplePackageDef =
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
                    , doc = Nothing
                    }
              )
            ]
    }


sampleIRJSON : String
sampleIRJSON =
    """{
         "formatVersion": 3,
         "distribution": [
           "Library",
           [
             [
               "sample"
             ]
           ],
           [],
           {
             "modules": [
               [
                 [
                   [
                     "module",
                     "a"
                   ]
                 ],
                 {
                   "access": "Public",
                   "value": {
                     "types": [
                       [
                         [
                           "bar"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": "",
                             "value": [
                               "TypeAliasDefinition",
                               [],
                               [
                                 "Reference",
                                 {},
                                 [
                                   [
                                     [
                                       "sample"
                                     ]
                                   ],
                                   [
                                     [
                                       "a"
                                     ]
                                   ],
                                   [
                                     "foo"
                                   ]
                                 ],
                                 []
                               ]
                             ]
                           }
                         }
                       ],
                       [
                         [
                           "foo"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": "",
                             "value": [
                               "CustomTypeDefinition",
                               [],
                               {
                                 "access": "Public",
                                 "value": [
                                   [
                                     [
                                       "foo"
                                     ],
                                     [
                                       [
                                         [
                                           "arg",
                                           "1"
                                         ],
                                         [
                                           "Reference",
                                           {},
                                           [
                                             [
                                               [
                                                 "sample"
                                               ]
                                             ],
                                             [
                                               [
                                                 "b"
                                               ]
                                             ],
                                             [
                                               "bee"
                                             ]
                                           ],
                                           []
                                         ]
                                       ]
                                     ]
                                   ]
                                 ]
                               }
                             ]
                           }
                         }
                       ],
                       [
                         [
                           "output",
                           "rec"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": "It's an even simpler rec",
                             "value": [
                               "TypeAliasDefinition",
                               [],
                               [
                                 "Record",
                                 {},
                                 [
                                   {
                                     "name": [
                                       "result"
                                     ],
                                     "tpe": [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "morphir"
                                           ],
                                           [
                                             "s",
                                             "d",
                                             "k"
                                           ]
                                         ],
                                         [
                                           [
                                             "basics"
                                           ]
                                         ],
                                         [
                                           "int"
                                         ]
                                       ],
                                       []
                                     ]
                                   }
                                 ]
                               ]
                             ]
                           }
                         }
                       ],
                       [
                         [
                           "rec"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": " It's a rec ",
                             "value": [
                               "TypeAliasDefinition",
                               [],
                               [
                                 "Record",
                                 {},
                                 [
                                   {
                                     "name": [
                                       "field",
                                       "1"
                                     ],
                                     "tpe": [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "sample"
                                           ]
                                         ],
                                         [
                                           [
                                             "a"
                                           ]
                                         ],
                                         [
                                           "foo"
                                         ]
                                       ],
                                       []
                                     ]
                                   },
                                   {
                                     "name": [
                                       "field",
                                       "2"
                                     ],
                                     "tpe": [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "sample"
                                           ]
                                         ],
                                         [
                                           [
                                             "a"
                                           ]
                                         ],
                                         [
                                           "bar"
                                         ]
                                       ],
                                       []
                                     ]
                                   }
                                 ]
                               ]
                             ]
                           }
                         }
                       ],
                       [
                         [
                           "simple",
                           "rec"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": "It's a simple rec ",
                             "value": [
                               "TypeAliasDefinition",
                               [],
                               [
                                 "Record",
                                 {},
                                 [
                                   {
                                     "name": [
                                       "field",
                                       "1"
                                     ],
                                     "tpe": [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "morphir"
                                           ],
                                           [
                                             "s",
                                             "d",
                                             "k"
                                           ]
                                         ],
                                         [
                                           [
                                             "basics"
                                           ]
                                         ],
                                         [
                                           "string"
                                         ]
                                       ],
                                       []
                                     ]
                                   },
                                   {
                                     "name": [
                                       "field",
                                       "2"
                                     ],
                                     "tpe": [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "morphir"
                                           ],
                                           [
                                             "s",
                                             "d",
                                             "k"
                                           ]
                                         ],
                                         [
                                           [
                                             "basics"
                                           ]
                                         ],
                                         [
                                           "int"
                                         ]
                                       ],
                                       []
                                     ]
                                   }
                                 ]
                               ]
                             ]
                           }
                         }
                       ]
                     ],
                     "values": [
                       [
                         [
                           "output",
                           "function"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": "",
                             "value": {
                               "inputTypes": [
                                 [
                                   [
                                     "data"
                                   ],
                                   [
                                     "Reference",
                                     {},
                                     [
                                       [
                                         [
                                           "sample"
                                         ]
                                       ],
                                       [
                                         [
                                           "module",
                                           "a"
                                         ]
                                       ],
                                       [
                                         "simple",
                                         "rec"
                                       ]
                                     ],
                                     []
                                   ],
                                   [
                                     "Reference",
                                     {},
                                     [
                                       [
                                         [
                                           "sample"
                                         ]
                                       ],
                                       [
                                         [
                                           "module",
                                           "a"
                                         ]
                                       ],
                                       [
                                         "simple",
                                         "rec"
                                       ]
                                     ],
                                     []
                                   ]
                                 ]
                               ],
                               "outputType": [
                                 "Reference",
                                 {},
                                 [
                                   [
                                     [
                                       "sample"
                                     ]
                                   ],
                                   [
                                     [
                                       "module",
                                       "a"
                                     ]
                                   ],
                                   [
                                     "output",
                                     "rec"
                                   ]
                                 ],
                                 []
                               ],
                               "body": [
                                 "Unit",
                                 [
                                   "Unit",
                                   {}
                                 ]
                               ]
                             }
                           }
                         }
                       ]
                     ],
                     "doc": null
                   }
                 }
               ],
               [
                 [
                   [
                     "module",
                     "b"
                   ]
                 ],
                 {
                   "access": "Private",
                   "value": {
                     "types": [
                       [
                         [
                           "bee"
                         ],
                         {
                           "access": "Public",
                           "value": {
                             "doc": " It's a bee ",
                             "value": [
                               "CustomTypeDefinition",
                               [],
                               {
                                 "access": "Public",
                                 "value": [
                                   [
                                     [
                                       "bee"
                                     ],
                                     []
                                   ]
                                 ]
                               }
                             ]
                           }
                         }
                       ]
                     ],
                     "values": [],
                     "doc": null
                   }
                 }
               ]
             ]
           }
         ]
       }
    """


sampleComponentJSON : String
sampleComponentJSON =
    """{
         "name": [
           [
             "sample"
           ]
         ],
         "libraries": [
           [
             [
               [
                 "sample"
               ]
             ],
             {
               "modules": [
                 [
                   [
                     [
                       "module",
                       "a"
                     ]
                   ],
                   {
                     "access": "Public",
                     "value": {
                       "types": [
                         [
                           [
                             "bar"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": "",
                               "value": [
                                 "TypeAliasDefinition",
                                 [],
                                 [
                                   "Reference",
                                   {},
                                   [
                                     [
                                       [
                                         "sample"
                                       ]
                                     ],
                                     [
                                       [
                                         "a"
                                       ]
                                     ],
                                     [
                                       "foo"
                                     ]
                                   ],
                                   []
                                 ]
                               ]
                             }
                           }
                         ],
                         [
                           [
                             "foo"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": "",
                               "value": [
                                 "CustomTypeDefinition",
                                 [],
                                 {
                                   "access": "Public",
                                   "value": [
                                     [
                                       [
                                         "foo"
                                       ],
                                       [
                                         [
                                           [
                                             "arg",
                                             "1"
                                           ],
                                           [
                                             "Reference",
                                             {},
                                             [
                                               [
                                                 [
                                                   "sample"
                                                 ]
                                               ],
                                               [
                                                 [
                                                   "b"
                                                 ]
                                               ],
                                               [
                                                 "bee"
                                               ]
                                             ],
                                             []
                                           ]
                                         ]
                                       ]
                                     ]
                                   ]
                                 }
                               ]
                             }
                           }
                         ],
                         [
                           [
                             "output",
                             "rec"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": "It's an even simpler rec",
                               "value": [
                                 "TypeAliasDefinition",
                                 [],
                                 [
                                   "Record",
                                   {},
                                   [
                                     {
                                       "name": [
                                         "result"
                                       ],
                                       "tpe": [
                                         "Reference",
                                         {},
                                         [
                                           [
                                             [
                                               "morphir"
                                             ],
                                             [
                                               "s",
                                               "d",
                                               "k"
                                             ]
                                           ],
                                           [
                                             [
                                               "basics"
                                             ]
                                           ],
                                           [
                                             "int"
                                           ]
                                         ],
                                         []
                                       ]
                                     }
                                   ]
                                 ]
                               ]
                             }
                           }
                         ],
                         [
                           [
                             "rec"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": " It's a rec ",
                               "value": [
                                 "TypeAliasDefinition",
                                 [],
                                 [
                                   "Record",
                                   {},
                                   [
                                     {
                                       "name": [
                                         "field",
                                         "1"
                                       ],
                                       "tpe": [
                                         "Reference",
                                         {},
                                         [
                                           [
                                             [
                                               "sample"
                                             ]
                                           ],
                                           [
                                             [
                                               "a"
                                             ]
                                           ],
                                           [
                                             "foo"
                                           ]
                                         ],
                                         []
                                       ]
                                     },
                                     {
                                       "name": [
                                         "field",
                                         "2"
                                       ],
                                       "tpe": [
                                         "Reference",
                                         {},
                                         [
                                           [
                                             [
                                               "sample"
                                             ]
                                           ],
                                           [
                                             [
                                               "a"
                                             ]
                                           ],
                                           [
                                             "bar"
                                           ]
                                         ],
                                         []
                                       ]
                                     }
                                   ]
                                 ]
                               ]
                             }
                           }
                         ],
                         [
                           [
                             "simple",
                             "rec"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": "It's a simple rec ",
                               "value": [
                                 "TypeAliasDefinition",
                                 [],
                                 [
                                   "Record",
                                   {},
                                   [
                                     {
                                       "name": [
                                         "field",
                                         "1"
                                       ],
                                       "tpe": [
                                         "Reference",
                                         {},
                                         [
                                           [
                                             [
                                               "morphir"
                                             ],
                                             [
                                               "s",
                                               "d",
                                               "k"
                                             ]
                                           ],
                                           [
                                             [
                                               "basics"
                                             ]
                                           ],
                                           [
                                             "string"
                                           ]
                                         ],
                                         []
                                       ]
                                     },
                                     {
                                       "name": [
                                         "field",
                                         "2"
                                       ],
                                       "tpe": [
                                         "Reference",
                                         {},
                                         [
                                           [
                                             [
                                               "morphir"
                                             ],
                                             [
                                               "s",
                                               "d",
                                               "k"
                                             ]
                                           ],
                                           [
                                             [
                                               "basics"
                                             ]
                                           ],
                                           [
                                             "int"
                                           ]
                                         ],
                                         []
                                       ]
                                     }
                                   ]
                                 ]
                               ]
                             }
                           }
                         ]
                       ],
                       "values": [
                         [
                           [
                             "output",
                             "function"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": "",
                               "value": {
                                 "inputTypes": [
                                   [
                                     [
                                       "data"
                                     ],
                                     [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "sample"
                                           ]
                                         ],
                                         [
                                           [
                                             "module",
                                             "a"
                                           ]
                                         ],
                                         [
                                           "simple",
                                           "rec"
                                         ]
                                       ],
                                       []
                                     ],
                                     [
                                       "Reference",
                                       {},
                                       [
                                         [
                                           [
                                             "sample"
                                           ]
                                         ],
                                         [
                                           [
                                             "module",
                                             "a"
                                           ]
                                         ],
                                         [
                                           "simple",
                                           "rec"
                                         ]
                                       ],
                                       []
                                     ]
                                   ]
                                 ],
                                 "outputType": [
                                   "Reference",
                                   {},
                                   [
                                     [
                                       [
                                         "sample"
                                       ]
                                     ],
                                     [
                                       [
                                         "module",
                                         "a"
                                       ]
                                     ],
                                     [
                                       "output",
                                       "rec"
                                     ]
                                   ],
                                   []
                                 ],
                                 "body": [
                                   "Unit",
                                   [
                                     "Unit",
                                     {}
                                   ]
                                 ]
                               }
                             }
                           }
                         ]
                       ],
                       "doc": null
                     }
                   }
                 ],
                 [
                   [
                     [
                       "module",
                       "b"
                     ]
                   ],
                   {
                     "access": "Private",
                     "value": {
                       "types": [
                         [
                           [
                             "bee"
                           ],
                           {
                             "access": "Public",
                             "value": {
                               "doc": " It's a bee ",
                               "value": [
                                 "CustomTypeDefinition",
                                 [],
                                 {
                                   "access": "Public",
                                   "value": [
                                     [
                                       [
                                         "bee"
                                       ],
                                       []
                                     ]
                                   ]
                                 }
                               ]
                             }
                           }
                         ]
                       ],
                       "values": [],
                       "doc": null
                     }
                   }
                 ]
               ]
             }
           ]
         ],
         "inputs": {
           "inputOne": [
             "Reference",
             {},
             [
               [
                 [
                   "morphir"
                 ],
                 [
                   "s",
                   "d",
                   "k"
                 ]
               ],
               [
                 [
                   "list"
                 ]
               ],
               [
                 "list"
               ]
             ],
             [
               [
                 "Reference",
                 {},
                 [
                   [
                     [
                       "sample"
                     ]
                   ],
                   [
                     [
                       "module",
                       "a"
                     ]
                   ],
                   [
                     "simple",
                     "rec"
                   ]
                 ],
                 []
               ]
             ]
           ]
         },
         "states": {},
         "outputs": {
           "output": [
             "Apply",
             [
               "Reference",
               {},
               [
                 [
                   [
                     "sample"
                   ]
                 ],
                 [
                   [
                     "module",
                     "a"
                   ]
                 ],
                 [
                   "output",
                   "rec"
                 ]
               ],
               []
             ],
             [
               "Reference",
               [
                 "Function",
                 {},
                 [
                   "Reference",
                   {},
                   [
                     [
                       [
                         "sample"
                       ]
                     ],
                     [
                       [
                         "module",
                         "a"
                       ]
                     ],
                     [
                       "simple",
                       "rec"
                     ]
                   ],
                   []
                 ],
                 [
                   "Reference",
                   {},
                   [
                     [
                       [
                         "sample"
                       ]
                     ],
                     [
                       [
                         "module",
                         "a"
                       ]
                     ],
                     [
                       "output",
                       "rec"
                     ]
                   ],
                   []
                 ]
               ],
               [
                 [
                   [
                     "sample"
                   ]
                 ],
                 [
                   [
                     "module",
                     "a"
                   ]
                 ],
                 [
                   "output",
                   "function"
                 ]
               ]
             ],
             [
               "Variable",
               [
                 "Reference",
                 {},
                 [
                   [
                     [
                       "sample"
                     ]
                   ],
                   [
                     [
                       "module",
                       "a"
                     ]
                   ],
                   [
                     "simple",
                     "rec"
                   ]
                 ],
                 []
               ],
               [
                 "input",
                 "one"
               ]
             ]
           ]
         }
       }
    """
