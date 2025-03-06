module Morphir.IR.NameConstructorArgumentsTest exposing (..)

import Dict
import Expect
import Morphir.IR.AccessControlled as AccessControlled
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Module as Module exposing (Definition)
import Morphir.IR.NameConstructorArguments exposing (rewriteModule)
import Morphir.IR.Type as Type exposing (Type(..))
import Morphir.IR.Value as Value exposing (Value(..))
import Test exposing (..)


testRewriteCustomTypes : Test
testRewriteCustomTypes =
    let
        -- Define a sample function definition
        sampleFunctionDef : Value.Definition () ()
        sampleFunctionDef =
            { inputTypes =
                [ ( [ "foo" ], (), Type.Variable () [ "a" ] )
                , ( [ "bar" ], (), Type.Variable () [ "b" ] )
                ]
            , outputType = Type.Variable () [ "c" ]
            , body = Value.Unit ()
            }

        -- Define a sample custom type definition
        sampleCustomTypeDef : Type.Definition ()
        sampleCustomTypeDef =
            Type.CustomTypeDefinition
                []
                (AccessControlled.public
                    (Dict.fromList
                        [ ( [ "SampleConstructor" ]
                          , [ ( [ "arg1" ], Type.Variable () [ "a" ] )
                            , ( [ "arg2" ], Type.Variable () [ "b" ] )
                            ]
                          )
                        ]
                    )
                )

        -- Define a sample module definition
        sampleModuleDef : Module.Definition () ()
        sampleModuleDef =
            { types =
                Dict.fromList
                    [ ( [ "SampleType" ]
                      , AccessControlled.public (Documented "" sampleCustomTypeDef)
                      )
                    ]
            , values =
                Dict.fromList
                    [ ( [ "SampleConstructor" ]
                      , AccessControlled.public (Documented "" sampleFunctionDef)
                      )
                    ]
            , doc = Nothing
            }

        -- Expected custom type definition after rewriting
        expectedCustomTypeDef : Type.Definition ()
        expectedCustomTypeDef =
            Type.CustomTypeDefinition
                []
                (AccessControlled.public
                    (Dict.fromList
                        [ ( [ "SampleConstructor" ]
                          , [ ( [ "foo" ], Type.Variable () [ "a" ] )
                            , ( [ "bar" ], Type.Variable () [ "b" ] )
                            ]
                          )
                        ]
                    )
                )

        -- Expected module definition after rewriting
        expectedModuleDef : Definition () ()
        expectedModuleDef =
            { types =
                Dict.fromList
                    [ ( [ "SampleType" ]
                      , AccessControlled.public (Documented "" expectedCustomTypeDef)
                      )
                    ]
            , values =
                Dict.fromList
                    [ ( [ "SampleConstructor" ]
                      , AccessControlled.public (Documented "" sampleFunctionDef)
                      )
                    ]
            , doc = Nothing
            }
    in
    test "rewriteCustomTypes rewrites constructor argument names correctly" <|
        \() ->
            let
                result =
                    rewriteModule sampleModuleDef
            in
            Expect.equal result expectedModuleDef


tests : Test
tests =
    describe "Morphir.IR.NameConstructorArguments"
        [ testRewriteCustomTypes ]
