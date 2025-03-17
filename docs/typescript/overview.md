# Overview

## Modules

A module is a collection of types and values. A module name can be separated by dot (.).

importing a module example:

```elm
import Foo.Bar.Baz
```

in typescript, this translates to a file

```typescript
import "foo/bar/baz"
```

Realistically, we need to name our import and the convention to do this for generated code is to use a title-cased underscore-concatendate name of the module.

```typescript
import Foo_Bar_Baz from "foo/bar/baz"
```

> Module file names are lowercased and seperated by hyphens when it contains multipe words

### Exports

A module may exports types and values and these will map directly to a corresponding exported member.

```elm
module Foo.Bar.Baz exposing (fooBar)
```

will generate

```typescript
export const fooBar = ...
```

However, every module will also have a default export repeating all of it's exported member in more environments

```typescript
export const fooBar = ...

export default {
    fooBar
}
```

This will allow for two approaches of imports

```typescript
// via named export
import { fooBar } from "foo/bar/baz"

// or via default export
import Baz from "foo/bar/baz"
Baz.fooBar
```

## Types

### Records

Generates an interface with a function matching the name of the interface

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

function Foo(name: string, age: number): Foo {
    return { name, age }
}
```

### Custom types

Custom types should generate an object having a `kind` field that equals the constructor name

```elm
type FooBar = Foo | Bar String | Baz Int
```

should generate

```typescript
type FooBar = 
    | { kind: "Foo" }
    | { kind: "Bar", arg1: string }
    | { kind: "Baz", arg1: number }
```

### Basic types

Basic types should be mapped to their corresponding types in typescript

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
