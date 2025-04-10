module Morphir.IR.Source.SourceCodecTests exposing (..)

import Dict
import Expect
import Json.Decode as Decode
import Json.Encode as Encode
import Morphir.IR.Source exposing (Component, DataType(..))
import Morphir.IR.Source.Codec exposing (decodeComponent, encodeComponent)
import Test exposing (Test, describe, test)


tests : Test
tests =
    let
        samplePath =
            [ [ "sample" ], [ "name" ] ]

        sampleComponent : Component
        sampleComponent =
            { name = samplePath
            , inputs =
                Dict.fromList
                    [ ( [ "input", "one" ]
                      , RowSet ( samplePath, [ [ "module" ] ], [ "sample", "record" ] )
                      )
                    ]
            , states =
                Dict.fromList
                    [ ( [ "state", "one" ]
                      , RowSet ( samplePath, [ [ "module" ] ], [ "sample", "state", "record" ] )
                      )
                    ]
            , outputs =
                Dict.fromList
                    [ ( [ "output", "one" ]
                      , [ { functionReference = ( samplePath, [ [ "module" ] ], [ "output", "function" ] )
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

        sampleComponentJSON =
            """{
                "name": "Sample.Name",
                "inputs": {
                    "inputOne": "Sample.Name:Module:SampleRecord"
                },
                "states": {
                    "stateOne": "Sample.Name:Module:SampleStateRecord"
                },
                "outputs": {
                    "outputOne": [
                        {
                            "functionReference": "Sample.Name:Module:outputFunction",
                            "arguments": {
                                "argOne": "inputOne",
                                "argTwo": "stateOne"
                            }
                        }
                    ]
                }
            }
            """
    in
    describe "Source Codec tests"
        [ test "When Component is encoded and decoded it should return itself"
            (\_ ->
                sampleComponent
                    |> encodeComponent
                    |> Encode.encode 4
                    |> Decode.decodeString decodeComponent
                    |> Expect.equal (Ok sampleComponent)
            )
        , test "Sample Component JSON should decode into sample Component"
            (\_ ->
                sampleComponentJSON
                    |> Decode.decodeString decodeComponent
                    |> Expect.equal (Ok sampleComponent)
            )
        ]
