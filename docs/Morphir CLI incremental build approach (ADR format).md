# ADR for Morphir CLI incremental build approach
## Context and Problem Statement

#### **Context**
Morphir CLI tool offers a way to convert business models into the **Morphir IR** by parsing source files when a `make` command is run. The tooling performs poorly on very large models with especially syntactically complex logics. The initial approach to building the **Morphir IR** was to read all the source files and process them to produce the **IR**. This approach is obviously inefficient because we do not need read and parse all source files every other time the `make` command is run. We decided to **Build Incrementally**.

#### **Problem**
Our approach to building incrementally captures and processes changes on a modular level. However, different types of changes within a module would require the modules to be processed in different orders to complete successfully.

**Example**
Assuming module `Foo` has a function called `foo` that depends on a function called `bar` in module `Bar`, and `bar` has no dependencies.

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
* Process changes in any order and validate the final result (Repo)
* Capture, order, and apply changes on a granular level
* Order modules dependency and then proceed with option 2

## Decision Outcome

Chosen option: "Option 3", Only option three takes all decision drivers into account by design.

### Positive Consequences <!-- optional -->
* Allows for name resolution and also allows type inferencing to be done at an early stage.

### Negative Consequences <!-- optional -->
???

* {e.g., compromising quality attribute, follow-up decisions required, …}
* …

## Pros and Cons of the Options <!-- optional -->

### Process changes in any order and validate the the final result (Repo)

Processing in this manner simply means that after changed modules (inserted, deleted or updated modules) have been collected, we proceed to process the changes that occurred without re-ordering modules, or types or values.
After all processing has been done, then we attempt to validate the Repo (the output of the process) and error out if the repo is invalid.

* Good, It's fast.
* Good, because this approach isn't complex.
* Bad, because it doesn't take name resolution into account.
* Bad, as it would be difficult to collect meaningful errors after validating the repo

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
