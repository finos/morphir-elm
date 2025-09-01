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

## Type Definitions

### TypeAliasDefinition

TypeAliasDefinitions have a direct one-to-one mapping to typescripts type aliases

#### Special Record TypeAliasDefinition Constructors

Elm records come with a constructor that allows for a value of that record to be created with positional arguments.
To match this behaviour, every record definition generates, additionally, a function matching the name of the record type.

Example:

```elm
type alias Foo = {a: String, b: Int}
```

creates the following in typescript

```typescript
type Foo = { a: string, b: number }

// an additional function matching the name of the type
function Foo(a: string, b: number): Foo = {a, b}
```

### CustomTypeDefinition

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

## Type Expressions

### Variable

A type variable maps directly to a type argument in Typescript

```elm
type alias Foo a = ...
```

can be conveniently translated to

```typescript
type alias Foo<A> = ...
```

### Reference

A reference type maps directly to type references in typescript

```elm
type Foo = ...

type alias FooBar = Foo
```

can be translated to

```typescript
type Foo = ...
type FooBar = Foo
```

### Tuples

Typescript supports the tuple type expression as a literal array expression where the elements at each position is specified and morphir can directly map to this.

```elm
type alias Foo = (..., ...)
```

can be translated to

```typescript
type Foo = [..., ...]
```

### Record

The community standard for defining record structures in Typescript is to use an interface.
However, because we'll be mapping the record as a type-expression, it would be more easier to simply produce an object literal always.
This allows for more complex types to be handled easily without having too much information about the type definition (if any exists) details.

Consider this:

```elm
type FooBar 
    = Foo { f: Int }
    | Bar { b: String }
```

would become

```typescript
type FooBar =
    | { kind: 'foo', arg1: { f:  number } }
    | { kind: 'bar', arg1: { b:  string } }
```

Using an object literal makes it possible to simply map each constructor parameter consistently.
For this reason, even for cases where it makes sense to generate an interface, we'll generate an object.

For example:

```elm
type alias Foo = { name: String, age: Int }
```

would produce

```typescript
type Foo = { name: string, age: number }
```

### Extensible records

Extensible records are records that specify known fields with the ability of have other undeclared fields in them.
The most appropraite translation of an extensible record is an intersection of record types, and this is how we map them.

```elm
type alias ExtensibleFoo a = { a | foo: String }
```

would produce

```typescript
type ExtensibleFoo<A> = A & { foo: string }
```

### Function

A function type would be mapped to a lambda function type where each function argument would be named with an underscore '_'.

```elm
type alias Func = String -> Bool
```

would produce

```typescript
type Func = (_: string) => boolean
```

### Unit

Unit type needs the ability to assign unit values, because of this, we can't simply map it to a void type.
Some types that match this in typescripts are the empty object ({}) and array ([]) type.
These types don't share the same semantics with the Unit type because [] !== [].

So we will map unit types to Unit type provided by the morphir typescript SDK which provides a value for unit
and have the same semantics.

```elm
type U = Unit
```

will translate to

```typescript
type U = Unit // where Unit is imported from morphir/sdk
```

### Instrinsic Types

Morphir Supports a number of types through it's SDK. The table below summarizes how each of those is mapped to typescript.

| Morphir Type | TypeScript Type  | Comments                                              |
|--------------|------------------|-------------------------------------------------------|
| String       | string           | one-to-one mapping                                    |
| Bool         | boolean          | one-to-one mapping                                    |
| Never        | never            | one-to-one mapping                                    |
| Char         | string           | loose mapping                                         |
| Int          | number           | loose mapping                                         |
| Float        | number           | loose mapping                                         |
| Decimal      | SDK Decimal      |                                                       |
| LocalDate    | SDK LocalDate    |                                                       |
| LocalTime    | SDK LocalTime    |                                                       |
| Instant      | SDK Instant      |                                                       |
| Regex        | SDK Regex        |                                                       |
| Maybe a      | SDK Maybe<A>     | Abstracts away differences between null and undefined |
| Result e a   | SDK Result<E, A> |                                                       |
| Set a        | SDK Set<A>       | supports complex values                               |
| List a       | SDK List<A>      | supports complex values                               |
| Dict k a     | SDK Dict<K, A>   | supports complex keys                                 |

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

## Values Expressions
