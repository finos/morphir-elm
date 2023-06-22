module Morphir.Reference.Model.SDK.LocalTime exposing (..)

import Morphir.SDK.LocalTime as Time exposing (..)


diffInSeconds : LocalTime -> LocalTime -> Int
diffInSeconds fromTime toTime =
    Time.diffInSeconds fromTime toTime


{-| Find the number of minutes between the given times.
-}
diffInMinutes : LocalTime -> LocalTime -> Int
diffInMinutes fromTime toTime =
    Time.diffInMinutes fromTime toTime


{-| Find the number of hours between the given times.
-}
diffInHours : LocalTime -> LocalTime -> Int
diffInHours fromTime toTime =
    Time.diffInHours fromTime toTime


{-| Add the given seconds to a given time.
-}
addSeconds : Int -> LocalTime -> LocalTime
addSeconds secondCount time =
    Time.addSeconds secondCount time


{-| Add the given minutes to a given time.
-}
addMinutes : Int -> LocalTime -> LocalTime
addMinutes minuteCount time =
    Time.addMinutes minuteCount time


{-| Add the given hours to a given time.
-}
addHours : Int -> LocalTime -> LocalTime
addHours hourCount time =
    Time.addHours hourCount time


{-| Construct a LocalTime based on ISO formatted string. Opportunity for error denoted by Maybe return type.
-}
fromISO : String -> Maybe LocalTime
fromISO iso =
    Time.fromISO iso


{-| Construct a LocalTime based on ISO formatted string. Opportunity for error denoted by Maybe return type.
-}
toISOString : LocalTime -> String
toISOString localTime =
    Time.toISOString localTime


{-| Construct a localTime from Millisecond count .
-}
fromMilliseconds : Int -> LocalTime
fromMilliseconds milliSecondsCount =
    Time.fromMilliseconds milliSecondsCount
