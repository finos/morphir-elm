module Morphir.Value.InterpreterLibrariesTests exposing (libraryTests, patternParameterTests)

import Dict
import Expect
import Morphir.IR.AccessControlled exposing (public)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.FQName exposing (FQName, fqn)
import Morphir.IR.Literal exposing (Literal(..))
import Morphir.IR.Module as Module
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.Package as Package
import Morphir.IR.SDK as SDK
import Morphir.IR.SDK.Basics exposing (intType)
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (Pattern, Value)
import Morphir.Value.Interpreter as Interpreter
import Test exposing (Test, describe, test)


{-| A package with one module holding the given values.
-}
package : String -> List ( String, Value.Definition () (Type ()) ) -> Package.Definition () (Type ())
package moduleName values =
    { modules =
        Dict.singleton [ [ moduleName ] ]
            (public
                { types = Dict.empty
                , values =
                    values
                        |> List.map (\( name, def ) -> ( Name.fromString name, public (Documented "" def) ))
                        |> Dict.fromList
                , doc = Nothing
                }
            )
    }


int : Type ()
int =
    intType ()


times : Int -> Value () (Type ()) -> Value () (Type ())
times n value =
    Value.Apply int
        (Value.Apply int (Value.Reference int (fqn "Morphir.SDK" "Basics" "multiply")) value)
        (Value.Literal int (WholeNumberLiteral n))


{-| `Lib.Calc.double x = x * 2`, in package Lib.
-}
lib : Package.Definition () (Type ())
lib =
    package "calc"
        [ ( "double"
          , { inputTypes = [ ( [ "x" ], int, int ) ]
            , outputType = int
            , body = times 2 (Value.Variable int [ "x" ])
            }
          )
        ]


{-| `App.Main.quad x = Lib.Calc.double (Lib.Calc.double x)`, in package App, which depends on Lib.
-}
app : Distribution
app =
    let
        double : Value () (Type ()) -> Value () (Type ())
        double arg =
            Value.Apply int (Value.Reference int (fqn "Lib" "Calc" "double")) arg
    in
    Library [ [ "app" ] ]
        (Dict.singleton [ [ "lib" ] ] (lib |> Package.definitionToSpecification |> Package.mapSpecificationAttributes (\_ -> ())))
        (package "main"
            [ ( "quad"
              , { inputTypes = [ ( [ "x" ], int, int ) ]
                , outputType = int
                , body = double (double (Value.Variable int [ "x" ]))
                }
              )
            ]
        )


quad : FQName
quad =
    fqn "App" "Main" "quad"


libraryTests : Test
libraryTests =
    describe "Calling a function from a dependency package"
        [ test "is found when the dependency's definition is passed as a library" <|
            \_ ->
                Interpreter.evaluateFunctionValueWithLibraries SDK.nativeFunctions
                    (Dict.singleton [ [ "lib" ] ] lib)
                    app
                    quad
                    [ Just (Value.Literal () (WholeNumberLiteral 3)) ]
                    |> Expect.equal (Ok (Value.Literal () (WholeNumberLiteral 12)))
        , test "is found from inside a native function's arguments" <|
            \_ ->
                -- Basics.add evaluates its arguments itself; the libraries must reach them.
                Interpreter.evaluateWithLibraries SDK.nativeFunctions
                    (Dict.singleton [ [ "lib" ] ] lib)
                    app
                    (Value.Apply ()
                        (Value.Apply () (Value.Reference () (fqn "Morphir.SDK" "Basics" "add")) (Value.Literal () (WholeNumberLiteral 1)))
                        (Value.Apply () (Value.Reference () (fqn "Lib" "Calc" "double")) (Value.Literal () (WholeNumberLiteral 3)))
                    )
                    |> Expect.equal (Ok (Value.Literal () (WholeNumberLiteral 7)))
        , test "is reported as not found without it" <|
            \_ ->
                Interpreter.evaluateFunctionValue SDK.nativeFunctions
                    app
                    quad
                    [ Just (Value.Literal () (WholeNumberLiteral 3)) ]
                    |> Expect.err
        ]


{-| `type Box = Box Int` and `addBoxes (Box a) (Box b) = Box (a + b)`: a function whose parameters are patterns has no
named inputs; its body is a lambda per parameter.
-}
patternParameterTests : Test
patternParameterTests =
    let
        box : FQName
        box =
            fqn "App" "Main" "box"

        boxPattern : Name -> Pattern (Type ())
        boxPattern var =
            Value.ConstructorPattern int box [ Value.AsPattern int (Value.WildcardPattern int) var ]

        addBoxes : Value.Definition () (Type ())
        addBoxes =
            { inputTypes = []
            , outputType = int
            , body =
                Value.Lambda int (boxPattern [ "a" ]) <|
                    Value.Lambda int (boxPattern [ "b" ]) <|
                        Value.Apply int
                            (Value.Constructor int box)
                            (Value.Apply int
                                (Value.Apply int (Value.Reference int (fqn "Morphir.SDK" "Basics" "add")) (Value.Variable int [ "a" ]))
                                (Value.Variable int [ "b" ])
                            )
            }

        boxOf : Int -> Value.RawValue
        boxOf n =
            Value.Apply () (Value.Constructor () box) (Value.Literal () (WholeNumberLiteral n))
    in
    describe "A function whose parameters are constructor patterns"
        [ test "takes its arguments through the lambdas in its body" <|
            \_ ->
                Interpreter.evaluateFunctionValue SDK.nativeFunctions
                    (Library [ [ "app" ] ] Dict.empty (package "main" [ ( "addBoxes", addBoxes ) ]))
                    (fqn "App" "Main" "addBoxes")
                    [ Just (boxOf 1), Just (boxOf 10) ]
                    |> Expect.equal (Ok (boxOf 11))
        ]
