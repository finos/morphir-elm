module Morphir.Example.Lean.Pricing exposing
    ( LineItem
    , Order
    , OrderError(..)
    , Tier(..)
    , discountPercent
    , lineGross
    , lineTotal
    , maxDiscountPercent
    , orderTotal
    , tierDiscount
    , validateItem
    , validateOrder
    , volumeDiscount
    )

{-| A small pricing model used to demonstrate how business logic captured in Morphir can be verified in Lean.
-}


{-| Customer loyalty tiers.
-}
type Tier
    = Standard
    | Silver
    | Gold


{-| A single line on an order. Prices are in cents.
-}
type alias LineItem =
    { quantity : Int
    , unitPrice : Int
    }


{-| An order placed by a customer.
-}
type alias Order =
    { tier : Tier
    , items : List LineItem
    }


{-| Reasons an order can be rejected.
-}
type OrderError
    = EmptyOrder
    | InvalidQuantity Int
    | InvalidPrice Int


{-| Policy: the combined discount is capped.
-}
maxDiscountPercent : Int
maxDiscountPercent =
    25


{-| Discount in percent based on the customer tier.
-}
tierDiscount : Tier -> Int
tierDiscount tier =
    case tier of
        Standard ->
            0

        Silver ->
            5

        Gold ->
            10


{-| Discount in percent based on the quantity ordered.
-}
volumeDiscount : Int -> Int
volumeDiscount quantity =
    if quantity >= 100 then
        20

    else if quantity >= 10 then
        5

    else
        0


{-| Combined discount in percent, capped at the maximum allowed by policy.
-}
discountPercent : Tier -> Int -> Int
discountPercent tier quantity =
    min maxDiscountPercent (tierDiscount tier + volumeDiscount quantity)


{-| Price before discounts.
-}
lineGross : LineItem -> Int
lineGross item =
    item.quantity * item.unitPrice


{-| Price after discounts.
-}
lineTotal : Tier -> LineItem -> Int
lineTotal tier item =
    let
        gross : Int
        gross =
            lineGross item

        discount : Int
        discount =
            (gross * discountPercent tier item.quantity) // 100
    in
    gross - discount


{-| Total price of an order.
-}
orderTotal : Order -> Int
orderTotal order =
    order.items
        |> List.map (lineTotal order.tier)
        |> List.sum


{-| Check that a line item makes sense.
-}
validateItem : LineItem -> Result OrderError LineItem
validateItem item =
    if item.quantity <= 0 then
        Err (InvalidQuantity item.quantity)

    else if item.unitPrice < 0 then
        Err (InvalidPrice item.unitPrice)

    else
        Ok item


{-| Check that an order makes sense.
-}
validateOrder : Order -> Result OrderError Order
validateOrder order =
    case order.items of
        [] ->
            Err EmptyOrder

        _ ->
            order.items
                |> List.foldr (\item acc -> Result.map2 (::) (validateItem item) acc) (Ok [])
                |> Result.map (\items -> { order | items = items })
