{-
   Copyright 2020 Morgan Stanley

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-}


module Morphir.IR.Source exposing
    ( Component, ComponentName, DataSourceName, OutputName, OutputSource, DataType(..)
    , component, outputSource
    , ParameterName
    )

{-| This module defines a JSON Source format for producing a new kind of Morphir IR defined in
[Distribution](Distribution#Component). This format allows for the definition of entry points and their inputs that
allows for the production of an encapsulated and tree-shaken component that has no external dependencies.


# Types

@docs Component, ComponentName, DataSourceName, OutputName, ArgumentName, OutputSource, DataType


# Creation

@docs component, outputSource

-}

import Dict exposing (Dict)
import Morphir.IR.FQName exposing (FQName)
import Morphir.IR.Literal exposing (Literal)
import Morphir.IR.Name exposing (Name)
import Morphir.IR.Path exposing (Path)


{-| Type that defines the entry points of [Component](Distribution#Component).
The fields of a component are:

  - name: The name of the component
  - inputs: The inputs of the component as a dictionary of the unique input name and [data type](#DataType).
  - states: The states of the component as a dictionary of the unique state name and [data type](#DataType).
  - outputs: The outputs of the component as a dictionary of unique names and a list of [sources](#OutputSource) that contribute to the output.

-}
type alias Component =
    { name : ComponentName
    , inputs : Dict DataSourceName DataType
    , states : Dict DataSourceName DataType
    , outputs : Dict OutputName (List OutputSource)
    }


{-| Represents a Component name.
-}
type alias ComponentName =
    Path


{-| Represents a DataSource name.
-}
type alias DataSourceName =
    Name


{-| Represents the types of data that can be used as a data source in either the inputs or states field of a [Component](#Component).
-}
type DataType
    = RowSet FQName
    | Literal Literal


{-| Represents an Output name.
-}
type alias OutputName =
    Name


{-| Represents the dependencies that contribute to an Output. The fields of an OutputSource are:

  - functionReference: A fully qualified reference to a function that produces a slice of an output.
  - arguments: The arguments that are passed to the function reference. The keys are the parameter names and the values
    are the data source names. The data source names must be declared in inputs or states field of the [Component](#Component).

-}
type alias OutputSource =
    { functionReference : FQName
    , arguments : Dict ParameterName DataSourceName
    }


{-| Represents an Argument name.
-}
type alias ParameterName =
    Name


{-| Creates a new component with the given name, inputs, states and outputs.
-}
component : ComponentName -> Dict DataSourceName DataType -> Dict DataSourceName DataType -> Dict OutputName (List OutputSource) -> Component
component name inputs states outputs =
    { name = name
    , inputs = inputs
    , states = states
    , outputs = outputs
    }


{-| Creates a new output source with the given function reference and arguments.
-}
outputSource : FQName -> Dict ParameterName DataSourceName -> OutputSource
outputSource functionName arguments =
    { functionReference = functionName
    , arguments = arguments
    }
