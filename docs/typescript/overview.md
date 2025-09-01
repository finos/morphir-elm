# Overview

## Modules

A module is a collection of types and values. In Elm, the convention is for module names follow the file path of the module, including the file name seperated by dots. For example, the module `Foo.Bar.Baz` would be in a file called `Baz.elm` in the directory `Foo/Bar`.

importing a module in Elm would look like this:

```elm
import Foo.Bar.Baz as Baz
```

in typescript, this maps to file paths. The convention in typescript is to use a forward slash `/` to separate directories and a hyphen `-` to separate words in file names. So the module `Foo.Bar.Baz` would be in a file called `baz.ts` in the directory `foo/bar`.
The import statement in typescript would look like this:

```typescript
import * as Baz from "foo/bar/baz"
```

### Exports

A module may export types and values and these will map directly to a corresponding exported member in typescript.

If we expose a value in Elm like this:

```elm
module Foo.Bar.Baz exposing (fooBar)
```

this should be mapped to a named export in typescript like this:

```typescript
export const fooBar = ...
```

## Types

### Core Types

Core types should be mapped to their corresponding types in typescript.

To maintain the consistency of semantics and operations, morphir will provide wrapper types for some core types.

| Elm Type     | TypeScript Type         |
|--------------|-------------------------|
| `Unit`       | `SDK.Unit`              |
| `Int`        | `number`                |
| `Float`      | `number`                |
| `String`     | `string`                |
| `Char`       | `string`                |
| `Bool`       | `boolean`               |
| `Decimal`    | `SDK.Decimal`           |
| `Never`      | `SDK.Never`             |
| `LocalTime`  | `SDK.LocalTime`         |
| `LocalDate`  | `SDK.LocalDate`         |
| `Instant`    | `SDK.Instant`           |
| `List a`     | `SDK.List<a>`           |
| `Dict a`     | `SDK.Dict<a>`           |
| `Set a`      | `SDK.Set<a>`            |
| `Maybe a`    | `SDK.Optional<a>`       |
| `Result a b` | `SDK.Result<a, b>`      |
| `(a, b)`     | `SDK.Tuple<[a, b]>`     |
| `(a, b, c)`  | `SDK.Tuple<[a, b, c]>`  |

### Records

Records should be mapped to an interface in typescript.
The field names should be converted to camel case and the types should be mapped to their corresponding types in typescript.

For example:

```elm
type alias Foo = { name: String, age: Int }
```

should produce

```typescript
interface Foo {
    name: string
    age: number
}
```

### Custom types

There are two ways we can map tagged unions:

#### 1. As objects with a discriminator field

Custom types are mapped as a union of an objects having a `kind` field that serves as tag/constructor in Elm.
The positional arguments of the constructor are mapped to named fields in the object. The name of each field is "arg" + the index of the argument starting from 1.

```elm
type FooBar 
    = Foo 
    | Bar String 
    | Baz Int
```

should produce

```typescript
type FooBar = 
    | { kind: "Foo" }
    | { kind: "Bar", arg1: string }
    | { kind: "Baz", arg1: number }
```

#### 2. Map each constructor to a class extended from a base abstract class

Each constructor will produce a class that extends a base abstract class. The base class will have a `kind` field that serves as the tag/constructor in Elm. The positional arguments of the constructor are mapped to named fields in the object. The name of each field is "arg" + the index of the argument starting from 1.

```elm
type FooBar 
    = Foo 
    | Bar String 
    | Baz Int
```

should produce

```typescript
abstract class FooBar {
    abstract kind: string
}
```

For each constructor in the custom type, we create 2 functions that returns an object with the `kind` field set to the name of the constructor and the positional arguments mapped to named fields.
One function will take positional arguments and the other will take named arguments.

```typescript
function Foo(): FooBar {
    return { kind: "Foo" }
}
function Bar(arg1: string): FooBar {
    return { kind: "Bar", arg1 }
}
function Bar(args: { arg1: string }): FooBar {
    return { kind: "Bar", ...args }
}
function Baz(arg1: number): FooBar {
    return { kind: "Baz", arg1 }
}
function Baz(args: { arg1: number }): FooBar {
    return { kind: "Baz", ...args }
}
```

## Value Definitions

### No-argument value definitions

No-argument value definitions should be mapped to a constant where the rhs of the constant is an IIFE.

This approach aims to accomodate complex expressions.

```elm
foo = 42
```

should generate

```typescript
const foo = (() => 42)();
```

### Values definitions with arguments

Value definitions with arguments should be mapped to a function

```elm
foo x y = x + y
```

should generate

```typescript
function foo(x: number, y: number): number {
    return x + y
}
```

### Values with pattern matching
