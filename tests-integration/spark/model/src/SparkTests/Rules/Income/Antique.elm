module SparkTests.Rules.Income.Antique exposing (..)

import SparkTests.DataDefinition.Field.Price exposing (Price)
import SparkTests.DataDefinition.Persistence.Income.AntiqueShop exposing (Antique)
import SparkTests.Rules.Income.AntiqueRules exposing (is_item_antique, is_item_vintage, seize_item)


type alias PriceRange =
    ( Price, Price )


type alias Report =
    { antiqueValue : Float
    , seizedValue : Float
    , vintageValue : Float
    }


report : List Antique -> Report
report antiques =
    { antiqueValue =
        antiques
            |> List.filter is_item_antique
            |> List.map .priceValue
            |> List.sum
    , seizedValue =
        antiques
            |> List.filter seize_item
            |> List.map .priceValue
            |> List.sum
    , vintageValue =
        antiques
            |> List.filter is_item_vintage
            |> List.map .priceValue
            |> List.sum
    }
