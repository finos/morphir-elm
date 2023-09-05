module Morphir.Visual.Components.TableView exposing (..)

import Dict exposing (Dict)
import Element exposing (Element, el, fill, fillPortion, height, padding, paddingXY, pointer, scrollbars, spacing, spacingXY, text, width)
import Element.Background
import Element.Border
import Element.Events exposing (onClick)
import Element.Font as Font
import Element.Input
import Morphir.Elm.ParsedModule exposing (documentation)
import Morphir.IR.Decoration exposing (AllDecorationConfigAndData, DecorationConfigAndData, DecorationID)
import Morphir.IR.Documented exposing (Documented)
import Morphir.IR.Name as Name exposing (Name)
import Morphir.IR.NodeId exposing (NodeID(..))
import Morphir.IR.Package as Package exposing (PackageName)
import Morphir.IR.Path as Path exposing (Path)
import Morphir.IR.Type as Type
import Morphir.IR.Value as Value exposing (RawValue)
import Morphir.SDK.Dict as SDKDict
import Morphir.Visual.Common exposing (nameToTitleText, tooltip)
import Morphir.Visual.Components.InputComponent as InputComponent
import Morphir.Visual.Theme as Theme exposing (Theme)
import Ordering exposing (Ordering)


type alias State =
    { orderByColumnIndex : Int
    , ordering : Ordering Row
    , orderDirection : OrderDirection
    , searchTerms : SearchTerms
    }


type alias Config msg =
    { state : State
    , onStateChange : State -> msg
    }


type alias Column msg =
    { columnName : String
    , ordering : Ordering Row
    , view : Row -> Element msg
    , filtering : String -> Row -> Bool
    }


type alias Row =
    { typeName : Name
    , morphirModule : Path
    , baseType : Type.Definition ()
    , documentation : String
    , decorations : Dict DecorationID (Maybe RawValue)
    }


type alias SearchTerms =
    Dict Int String


type Msg
    = SetOrdering Int (Ordering Row)
    | Search Int String


type OrderDirection
    = Asc
    | Desc


init : State
init =
    { orderByColumnIndex = 0
    , ordering = Ordering.byField .typeName
    , orderDirection = Desc
    , searchTerms = Dict.empty
    }


update : Msg -> State -> State
update msg state =
    case msg of
        SetOrdering index ordering ->
            let
                reverseDirection dir =
                    if dir == Asc then
                        Desc

                    else
                        Asc
            in
            if index == state.orderByColumnIndex then
                { state
                    | ordering = Ordering.reverse state.ordering
                    , orderDirection = reverseDirection state.orderDirection
                }

            else
                { state
                    | ordering = ordering
                    , orderByColumnIndex = index
                    , orderDirection = Desc
                }

        Search index term ->
            { state | searchTerms = Dict.insert index term state.searchTerms }


viewTypeTable : Theme -> Config msg -> PackageName -> Package.Definition () va -> Maybe Path -> AllDecorationConfigAndData -> Element msg
viewTypeTable theme config packageName package moduleName allDecorationsConfigAndData =
    let
        typeDefToString : Type.Definition () -> String
        typeDefToString tpe =
            case tpe of
                Type.CustomTypeDefinition _ accessControlledCtors ->
                    "Enum"

                Type.TypeAliasDefinition _ baseType ->
                    let
                        typeToString : Type.Type a -> String
                        typeToString t =
                            case t of
                                Type.Variable _ name ->
                                    Name.toCamelCase name

                                Type.Reference _ ( _, mn, ln ) args ->
                                    let
                                        referenceName : String
                                        referenceName =
                                            String.join "."
                                                [ Path.toString Name.toTitleCase "." mn
                                                , Name.toTitleCase ln
                                                ]
                                    in
                                    referenceName
                                        :: List.map typeToString args
                                        |> String.join " "

                                Type.Tuple _ elems ->
                                    String.concat
                                        [ "(", List.map typeToString elems |> String.join ", ", ")" ]

                                Type.Record _ fields ->
                                    "Record"

                                Type.ExtensibleRecord _ varName fields ->
                                    "Extensible Record"

                                Type.Function _ ((Type.Function _ _ _) as argType) returnType ->
                                    String.concat [ "(", typeToString argType, ") -> ", typeToString returnType ]

                                Type.Function _ argType returnType ->
                                    String.concat [ typeToString argType, " -> ", typeToString returnType ]

                                Type.Unit _ ->
                                    "()"
                    in
                    typeToString baseType

        decorations : List ( DecorationID, DecorationConfigAndData )
        decorations =
            allDecorationsConfigAndData |> Dict.toList

        types : List Row
        types =
            let
                typeListToRows moduleN accessControlledModuleDef =
                    let
                        toRow : Name -> Path -> Type.Definition () -> String -> Row
                        toRow name modulePath baseType documentation =
                            let
                                nodeId =
                                    TypeID ( packageName, modulePath, name ) []
                            in
                            { typeName = name
                            , morphirModule = modulePath
                            , baseType = baseType
                            , documentation = documentation
                            , decorations = decorations |> List.map (\( decorationId, configAndData ) -> ( decorationId, SDKDict.get nodeId configAndData.data )) |> Dict.fromList
                            }
                    in
                    accessControlledModuleDef.value.types
                        |> Dict.toList
                        |> List.map
                            (\( name, accessControlledDocumentedType ) -> toRow name moduleN accessControlledDocumentedType.value.value accessControlledDocumentedType.value.doc)

                everyTypeWithPath =
                    package.modules |> Dict.toList
            in
            case moduleName of
                Nothing ->
                    everyTypeWithPath
                        |> List.concatMap
                            (\( mn, accessControlledModuleDef ) ->
                                typeListToRows mn accessControlledModuleDef
                            )

                Just selectedMn ->
                    everyTypeWithPath
                        |> List.filter (\( currentMn, _ ) -> Path.isPrefixOf currentMn selectedMn)
                        |> List.concatMap
                            (\( mn, accessControlledModuleDef ) ->
                                typeListToRows mn accessControlledModuleDef
                            )

        rowElem : Element msg -> Element msg
        rowElem =
            el [ Theme.borderBottom 1, Element.Border.color theme.colors.lightGray, paddingXY 2 1 ]

        searchIn : String -> String -> Bool
        searchIn string term =
            String.contains (String.toUpper term) (String.toUpper string)

        searchFunction : Row -> Bool
        searchFunction row =
            columns
                |> List.indexedMap (\index col -> col.filtering (Dict.get index config.state.searchTerms |> Maybe.withDefault ""))
                |> List.all (\predicate -> predicate row)

        decorationColumns : List (Column msg)
        decorationColumns =
            decorations
                |> List.map
                    (\( id, configAndData ) ->
                        { columnName = configAndData.displayName
                        , ordering =
                            \a b ->
                                case ( Dict.get id a.decorations, Dict.get id b.decorations ) of
                                    ( Just (Just aVal), Just (Just bVal) ) ->
                                        Basics.compare (Value.toString aVal) (Value.toString bVal)

                                    ( Just Nothing, Just (Just _) ) ->
                                        GT

                                    _ ->
                                        LT
                        , view =
                            \row ->
                                case Dict.get id row.decorations of
                                    Just (Just val) ->
                                        rowElem <| Theme.ellipseText <| Value.toString val

                                    _ ->
                                        rowElem <| text "-"
                        , filtering =
                            \term row ->
                                case Dict.get id row.decorations of
                                    Just (Just val) ->
                                        searchIn (Value.toString val) term

                                    _ ->
                                        String.isEmpty term
                        }
                    )

        columns : List (Column msg)
        columns =
            [ { columnName = "Name"
              , ordering = Ordering.byField .typeName
              , view =
                    \row ->
                        rowElem <|
                            el
                                [ tooltip Element.below
                                    (el
                                        [ Element.Background.color theme.colors.lightest
                                        , theme |> Theme.borderRounded
                                        , Element.Border.shadow
                                            { offset = ( 0, 3 ), blur = 6, size = 0, color = Element.rgba 0 0 0 0.32 }
                                        ]
                                        (text row.documentation)
                                    )
                                ]
                                (text (nameToTitleText row.typeName))
              , filtering = \term row -> searchIn (row.typeName |> nameToTitleText) term
              }
            , { columnName = "Module"
              , ordering = Ordering.byField .morphirModule
              , view = \row -> rowElem <| text (Path.toString nameToTitleText " > " row.morphirModule)
              , filtering = \term row -> searchIn (Path.toString nameToTitleText " > " row.morphirModule) term
              }
            , { columnName = "Base Type"
              , ordering = \a b -> Basics.compare (typeDefToString a.baseType) (typeDefToString b.baseType)
              , view = \row -> rowElem <| text <| typeDefToString row.baseType
              , filtering = \term row -> searchIn (typeDefToString row.baseType) term
              }
            ]
                ++ decorationColumns

        header : String -> Int -> Ordering Row -> Element msg
        header title index ordering =
            Element.row [ spacing <| Theme.smallSpacing theme, Element.paddingEach { right = Theme.mediumPadding theme, left = 0, bottom = 0, top = 0 } ]
                [ Element.row
                    [ paddingXY 2 (Theme.largePadding theme)
                    , Font.color theme.colors.mediumGray
                    , onClick <| config.onStateChange (update (SetOrdering index ordering) config.state)
                    , Element.Background.color theme.colors.lightest
                    , pointer
                    , width (fillPortion 1)
                    ]
                    [ text title
                    , if index == config.state.orderByColumnIndex then
                        el [ Font.color theme.colors.brandPrimary, Font.size (Theme.scaled 4 theme), Font.bold ]
                            (case config.state.orderDirection of
                                Desc ->
                                    text " ⇩"

                                _ ->
                                    text " ⇧"
                            )

                      else
                        Element.none
                    ]
                , InputComponent.searchInput theme
                    [ width (Element.px 180) ]
                    { onChange = \term -> config.onStateChange (update (Search index term) config.state)
                    , text = Dict.get index config.state.searchTerms |> Maybe.withDefault ""
                    , placeholder = Just <| Element.Input.placeholder [] (text "search . . .")
                    , label = Element.Input.labelHidden ""
                    }
                ]
    in
    Element.table
        [ width fill
        , height fill
        , Element.clipY
        , scrollbars
        , padding (Theme.mediumPadding theme)
        , spacingXY 0 (Theme.mediumSpacing theme)
        ]
        { columns =
            columns |> List.indexedMap (\index column -> { header = header column.columnName index column.ordering, width = Element.fillPortion 1, view = column.view })
        , data = types |> List.sortWith config.state.ordering |> List.filter searchFunction
        }
