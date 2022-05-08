# New incremental approach

* Status: {proposed | rejected | accepted | deprecated | … | superseded by [ADR-0005](0005-example.md)} <!-- optional -->
* Deciders: {list everyone involved in the decision} <!-- optional -->
* Date: {YYYY-MM-DD when the decision was last updated} <!-- optional -->

Technical Story: {description | ticket/issue URL} <!-- optional -->

## Context and Problem Statement

The current approach to building incrementally captures and processes changes on a modular level. Different types of changes require different ordering of modules to complete without failure.

**Trivial Usecase**
Assuming module `Foo` has function called `foo` that depends on a function called `bar` in module `Bar`, and `bar` has no dependencies.

``` mermaid
        flowchart LR
            foo ---> bar
            subgraph Foo
                foo
            end
            subgraph Bar
                bar
            end 
```

_diagram showing modules Foo and Bar and the dependency between them._

Example of operations that require special orderings:

* Updating `Foo.foo` to no longer depend on `Bar.bar` and deleting `Bar.bar`. This requires `Foo.foo` to be processed first to remove the dependency between `Foo.foo` and `Bar.bar` before deleting `Bar.bar`.

* Updating type `Foo.foo` to depend on a new type `Bar.fooBar`. This requires processing `Bar.fooBar` to include the new type before processing `Foo.foo` to add that dependency.

What is the best way to process changes?

## Decision Drivers <!-- optional -->

* Tooling Performance
* Maintainability
* Meaningful error reporting

## Considered Options
* Process changes in any order and validate the the final result (Repo)
* Capture, order, and apply changes on a granular level

## Decision Outcome

Chosen option: "Option 2", Only option one.

### Positive Consequences <!-- optional -->

* {e.g., improvement of quality attribute satisfaction, follow-up decisions required, …}
* …

### Negative Consequences <!-- optional -->

* {e.g., compromising quality attribute, follow-up decisions required, …}
* …

## Pros and Cons of the Options <!-- optional -->

### Process changes in any order and validate the the final result (Repo)

Process all the changed modules in any order and validate the result (Repo) <!-- optional -->

* Good, because d
* Good, because {argument b}
* Bad, because {argument c}
* … <!-- numbers of pros and cons can vary -->

### Capture, order, and apply changes on a granular level

Capturing changes on a granular level simply means that instead of detecting that `module Foo` has been updated, we could detect that `foo` is what was updated within `Foo`, and further capture changes like **access levels**, **deletes**, **type Constructor added**, etc. making it as granular as possible.



{example | description | pointer to more information | …} <!-- optional -->

* Good, because we 
* Good, because {argument b}
* Bad, because {argument c}
* … <!-- numbers of pros and cons can vary -->

## Links <!-- optional -->

* {Link type} {Link to ADR} <!-- example: Refined by [ADR-0005](0005-example.md) -->
* … <!-- numbers of links can vary -->
