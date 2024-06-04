module Morphir.Web.TryMorphir exposing (..)

import Browser
import Dict exposing (Dict)
import Element exposing (Element, alignRight, column, el, fill, height, layout, none, padding, paddingEach, paddingXY, paragraph, px, rgb, row, scrollbars, shrink, spacing, text, width)
import Element.Background as Background
import Element.Border as Border
import Element.Font as Font
import Element.Input as Input
import FontAwesome.Styles as Icon
import Html exposing (Html)
import Morphir.Compiler as Compiler
import Morphir.Elm.Frontend as Frontend exposing (SourceFile)
import Morphir.IR.Distribution exposing (Distribution(..))
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Module as Module exposing (ModuleName)
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.SDK as SDK
import Morphir.IR.Type as Type exposing (Type)
import Morphir.IR.Value as Value exposing (Value)
import Morphir.Type.Count as Count
import Morphir.Type.Infer as Infer
import Morphir.Type.Solve as Solve exposing (SolutionMap)
import Morphir.Visual.Common exposing (nameToText, pathToUrl)
import Morphir.Visual.Components.Card as Card
import Morphir.Visual.Components.FieldList as FieldList
import Morphir.Visual.Components.TypeInferenceView as TypeInferenceView
import Morphir.Visual.Config exposing (Config, DrillDownFunctions(..))
import Morphir.Visual.Theme as Theme exposing (Theme)
import Morphir.Visual.ValueEditor as ValueEditor
import Morphir.Visual.ViewType as ViewType
import Morphir.Visual.ViewValue as ViewValue
import Morphir.Visual.XRayView as XRayView
import Morphir.Web.SourceEditor as SourceEditor



-- MAIN


type alias Flags =
    {}


main =
    Browser.document
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }



-- MODEL


type alias Model =
    { theme : Theme
    , source : String
    , maybePackageDef : Maybe (Package.Definition () (Type ()))
    , errors : List Compiler.Error
    , irView : IRView
    , valueStates : Dict FQName ValueState
    }


type IRView
    = InsightView InsightArgumentState Morphir.Visual.Config.VisualState
    | IRView


type alias ValueState =
    { typeInferenceStep : Int
    }


theme : Theme
theme =
    Theme.fromConfig Nothing


init : Flags -> ( Model, Cmd Msg )
init _ =
    update (ChangeSource sampleSource)
        { theme = Theme.fromConfig Nothing
        , source = ""
        , maybePackageDef = Nothing
        , errors = []
        , irView = InsightView Dict.empty emptyVisualState
        , valueStates = Dict.empty
        }


emptyVisualState : Morphir.Visual.Config.VisualState
emptyVisualState =
    { theme = Theme.fromConfig Nothing
    , variables = Dict.empty
    , nonEvaluatedVariables = Dict.empty
    , highlightState = Nothing
    , popupVariables =
        { variableIndex = 0
        , variableValue = Nothing
        , nodePath = []
        }
    , drillDownFunctions = DrillDownFunctions Dict.empty
    , zIndex = 9999
    }



-- UPDATE


type Msg
    = ChangeSource String
    | ChangeIRView IRView
    | UpdateInferStep FQName Int
    | ArgValueUpdated Name ValueEditor.EditorState
    | DoNothing


type alias InsightArgumentState =
    Dict Name ValueEditor.EditorState


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ChangeSource sourceCode ->
            let
                opts =
                    { typesOnly = False }

                sourceFiles =
                    [ { path = "Test.elm"
                      , content = sampleSourcePrefix ++ sourceCode
                      }
                    ]

                frontendResult : Result (List Compiler.Error) (Package.Definition Frontend.SourceLocation Frontend.SourceLocation)
                frontendResult =
                    Frontend.mapSource opts packageInfo Dict.empty sourceFiles

                typedResult : Result (List Compiler.Error) (Package.Definition () (Type ()))
                typedResult =
                    frontendResult
                        |> Result.andThen
                            (\packageDef ->
                                packageDef
                                    |> Package.mapDefinitionAttributes (\_ -> ()) (\_ -> Type.Unit ())
                                    |> Ok
                            )
            in
            ( { model
                | source = sourceCode
                , maybePackageDef =
                    case typedResult of
                        Ok newPackageDef ->
                            Just newPackageDef

                        Err _ ->
                            model.maybePackageDef
                , errors =
                    case typedResult of
                        Err errors ->
                            errors

                        Ok _ ->
                            []
              }
            , Cmd.none
            )

        ChangeIRView viewType ->
            ( { model
                | irView = viewType
              }
            , Cmd.none
            )

        ArgValueUpdated argName editorState ->
            case model.irView of
                InsightView argStates insightViewState ->
                    let
                        variables : InsightArgumentState -> Dict Name (Value () ())
                        variables argState =
                            argState
                                |> Dict.map (\_ arg -> arg.lastValidValue |> Maybe.withDefault (Value.Unit ()))

                        newArgState : InsightArgumentState
                        newArgState =
                            argStates |> Dict.insert argName editorState

                        newInsightViewState : Morphir.Visual.Config.VisualState
                        newInsightViewState =
                            { insightViewState
                                | variables = variables newArgState
                            }
                    in
                    ( { model
                        | irView = InsightView newArgState newInsightViewState
                      }
                    , Cmd.none
                    )

                _ ->
                    ( model, Cmd.none )

        DoNothing ->
            ( model, Cmd.none )

        UpdateInferStep fQName updated ->
            let
                newValueStates : Dict FQName { typeInferenceStep : Int }
                newValueStates =
                    model.valueStates
                        |> Dict.update fQName
                            (\maybeValueState ->
                                case maybeValueState of
                                    Just valueState ->
                                        Just { valueState | typeInferenceStep = updated }

                                    Nothing ->
                                        Just { typeInferenceStep = updated }
                            )
            in
            ( { model | valueStates = newValueStates }, Cmd.none )



-- VIEW


view : Model -> Browser.Document Msg
view model =
    { title = "Morphir - Home"
    , body =
        [ Icon.css
        , layout
            [ width fill
            , height fill
            , Font.family
                [ Font.external
                    { name = "Source Code Pro"
                    , url = "https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
                    }
                , Font.monospace
                ]
            , Font.size model.theme.fontSize
            ]
            (el
                [ width fill
                , height fill
                ]
                (viewPackageResult model ChangeSource)
            )
        ]
    }


viewPackageResult : Model -> (String -> Msg) -> Element Msg
viewPackageResult model onSourceChange =
    row
        [ width fill
        , height fill
        , scrollbars
        ]
        [ column
            [ width fill
            , height fill
            , scrollbars
            ]
            [ el [ height shrink, padding 10 ] (text "Source Model")
            , el
                [ width fill
                , height fill
                , scrollbars
                ]
                (SourceEditor.view model.source onSourceChange)
            , el
                [ height shrink
                , width fill
                , padding 10
                , Background.color
                    (if List.isEmpty model.errors then
                        rgb 0.5 0.7 0.5

                     else
                        rgb 0.7 0.5 0.5
                    )
                ]
                (if List.isEmpty model.errors then
                    text "Parsed > Resolved > Type checked"

                 else
                    model.errors
                        |> List.concatMap
                            (\error ->
                                case error of
                                    Compiler.ErrorsInSourceFile _ sourceErrors ->
                                        sourceErrors
                                            |> List.map (.errorMessage >> text >> List.singleton >> paragraph [])

                                    Compiler.ErrorAcrossSourceFiles e ->
                                        [ Debug.toString e |> text ]
                            )
                        |> column []
                )
            ]
        , column
            [ width fill
            , height fill
            , scrollbars
            ]
            [ row [ width fill ]
                [ el [ height shrink, padding 10 ] (text "Morphir IR")
                , viewIRViewTabs model.irView
                ]
            , el
                [ width fill
                , height fill
                , scrollbars
                , padding 10
                ]
                (case model.maybePackageDef of
                    Just packageDef ->
                        viewPackageDefinition model (\_ -> Html.div [] []) packageDef

                    Nothing ->
                        Element.none
                )
            ]
        ]


viewPackageDefinition : Model -> (va -> Html Msg) -> Package.Definition () (Type ()) -> Element Msg
viewPackageDefinition model viewAttribute packageDef =
    let
        packageName : PackageName
        packageName =
            [ [ "my" ] ]

        ir : Distribution
        ir =
            Library packageName Frontend.defaultDependencies packageDef
    in
    packageDef.modules
        |> Dict.toList
        |> List.map
            (\( moduleName, moduleDef ) ->
                viewModuleDefinition model ir packageName moduleName viewAttribute moduleDef.value
            )
        |> column []


viewModuleDefinition : Model -> Distribution -> PackageName -> ModuleName -> (va -> Html Msg) -> Module.Definition () (Type ()) -> Element Msg
viewModuleDefinition model ir packageName moduleName _ moduleDef =
    let
        typeViews : List (Element msg)
        typeViews =
            moduleDef.types
                |> Dict.toList
                |> List.map
                    (\( typeName, accessControlledDocumentedTypeDef ) ->
                        ViewType.viewType theme typeName accessControlledDocumentedTypeDef.value.value accessControlledDocumentedTypeDef.value.doc
                    )

        valueViews : List (Element Msg)
        valueViews =
            moduleDef.values
                |> Dict.toList
                |> List.map
                    (\( valueName, valueDef ) ->
                        let
                            valueState =
                                model.valueStates
                                    |> Dict.get ( packageName, moduleName, valueName )
                                    |> Maybe.withDefault
                                        { typeInferenceStep = 0
                                        }
                        in
                        Card.viewAsCard theme
                            (text (nameToText valueName))
                            "value"
                            valueDef.value.doc
                            (column
                                []
                                [ el
                                    [ Border.rounded 5
                                    , Background.color (rgb 0.95 0.95 0.95)
                                    , width fill
                                    ]
                                    (row []
                                        [ el [ paddingXY 10 5 ] (text "return type")
                                        , row
                                            [ paddingXY 10 5
                                            , spacing 5
                                            , Background.color (rgb 1 0.9 0.8)
                                            ]
                                            [ text ":"
                                            , XRayView.viewType pathToUrl valueDef.value.value.outputType
                                            ]
                                        ]
                                    )
                                , if List.isEmpty valueDef.value.value.inputTypes then
                                    none

                                  else
                                    el
                                        [ padding 5
                                        , Border.rounded 5
                                        , Background.color (rgb 0.95 0.95 0.95)
                                        , width fill
                                        ]
                                        (valueDef.value.value.inputTypes
                                            |> List.map
                                                (\( argName, _, argType ) ->
                                                    row []
                                                        [ el [ paddingXY 10 5 ] (text (nameToText argName))
                                                        , row
                                                            [ paddingXY 10 5
                                                            , spacing 5
                                                            , Background.color (rgb 1 0.9 0.8)
                                                            ]
                                                            [ text ":"
                                                            , XRayView.viewType pathToUrl argType
                                                            ]
                                                        ]
                                                )
                                            |> column [ spacing 5 ]
                                        )
                                , el
                                    [ padding 5
                                    , Border.rounded 5
                                    , Background.color (rgb 1 1 1)
                                    , width fill
                                    ]
                                    (viewValue valueState ir ( packageName, moduleName, valueName ) model.irView valueDef.value.value)
                                ]
                            )
                    )
    in
    (typeViews ++ valueViews)
        |> List.intersperse (el [ width fill, height (px (Theme.smallSpacing theme)), Background.color theme.colors.gray ] none)
        |> column [ spacing 20 ]


viewValue : ValueState -> Distribution -> FQName -> IRView -> Value.Definition () (Type ()) -> Element Msg
viewValue valueState ir fullyQualifiedName irView valueDef =
    case irView of
        InsightView argStates insightVisualState ->
            let
                config : Config Msg
                config =
                    { ir = ir
                    , nativeFunctions = SDK.nativeFunctions
                    , state = insightVisualState
                    , handlers =
                        { onReferenceClicked = \_ _ _ -> DoNothing
                        , onReferenceClose = \_ _ _ -> DoNothing
                        , onHoverOver = \_ _ _ -> DoNothing
                        , onHoverLeave = \_ _ -> DoNothing
                        }
                    , nodePath = []
                    }

                editors =
                    valueDef.inputTypes
                        |> List.map
                            (\( argName, _, argType ) ->
                                ( argName
                                , ValueEditor.view theme
                                    ir
                                    argType
                                    (ArgValueUpdated argName)
                                    (argStates |> Dict.get argName |> Maybe.withDefault (ValueEditor.initEditorState ir argType Nothing))
                                )
                            )
                        |> FieldList.view theme
            in
            column []
                [ editors
                , ViewValue.viewDefinition config fullyQualifiedName valueDef
                ]

        IRView ->
            viewValueAsIR valueState ir fullyQualifiedName valueDef


viewValueAsIR : ValueState -> Distribution -> FQName -> Value.Definition () (Type ()) -> Element Msg
viewValueAsIR valueState ir fullyQualifiedName valueDef =
    let
        untypedValueDef : Value.Definition () ()
        untypedValueDef =
            valueDef
                |> Value.mapDefinitionAttributes identity (always ())

        ( _, ( defVar, annotatedValueDef, ( valueDefConstraints, typeVariablesByIndex ) ) ) =
            Infer.constrainDefinition ir Dict.empty untypedValueDef
                |> Count.apply 0

        _ =
            Debug.log "type variables" typeVariablesByIndex

        solveSteps : List (Element msg)
        solveSteps =
            TypeInferenceView.viewSolveSteps 0 ir Solve.emptySolution (valueDefConstraints |> Debug.log "valueDefConstraints")
                |> List.reverse

        solveStepsSlider : Element Msg
        solveStepsSlider =
            Input.slider
                [ Element.height fill
                , Element.width (Element.px 30)

                -- Here is where we're creating/styling the "track"
                , Element.behindContent
                    (Element.el
                        [ Element.height Element.fill
                        , Element.width (Element.px 2)
                        , Element.centerX
                        , Background.color (rgb 0.5 0.5 0.5)
                        , Border.rounded 2
                        ]
                        Element.none
                    )
                ]
                { onChange = round >> UpdateInferStep fullyQualifiedName
                , label =
                    Input.labelAbove []
                        (text "Infer")
                , min = 0
                , max = toFloat (List.length solveSteps - 1)
                , step = Just 1
                , value = toFloat valueState.typeInferenceStep
                , thumb =
                    Input.defaultThumb
                }

        solveStepsView =
            solveSteps
                |> List.drop valueState.typeInferenceStep
                |> List.head
                |> Maybe.map
                    (\content ->
                        el [ paddingEach { left = 20, right = 10, bottom = 0, top = 0 } ] content
                    )
                |> Maybe.withDefault none
    in
    column []
        [ row [ spacing 20 ]
            [ column [ spacing 10 ]
                [ text (String.concat [ "definition var: ", String.fromInt defVar ])
                , XRayView.viewValueDefinition
                    (\( _, metaVar ) ->
                        text (String.fromInt metaVar)
                    )
                    (annotatedValueDef |> Debug.log "annotatedValueDef")
                ]
            ]
        , el [ height fill ]
            (row []
                [ solveStepsSlider
                , solveStepsView
                ]
            )
        ]


viewIRViewTabs : IRView -> Element Msg
viewIRViewTabs irView =
    let
        button viewType labelText =
            Input.button
                [ paddingXY 10 5
                , Background.color
                    (if viewType == irView then
                        rgb 0.8 0.85 0.9

                     else
                        rgb 0.9 0.9 0.9
                    )
                , Border.rounded 3
                ]
                { onPress = Just (ChangeIRView viewType)
                , label = el [] (text labelText)
                }
    in
    row
        [ alignRight
        , paddingXY 10 0
        , spacing 10
        ]
        [ button (InsightView Dict.empty emptyVisualState) "Insight"
        , button IRView "IR"
        ]


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none


packageInfo =
    { name = [ [ "my" ] ]
    , exposedModules = Nothing
    }


sampleSourcePrefix : String
sampleSourcePrefix =
    """module My.Test exposing (..)

    """


sampleSource : String
sampleSource =
    """
request : Bool -> Int -> Int -> Response
request allowPartial availableSurfboards requestedSurfboards =
    if availableSurfboards < requestedSurfboards then
        if allowPartial then
            Reserved (min availableSurfboards requestedSurfboards)

        else
            Rejected

    else
        Reserved requestedSurfboards


type Response
    = Rejected
    | Reserved Int
        """
