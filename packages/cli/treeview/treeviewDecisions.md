# Treeview Decisions

This document contains the decisions taken on how logic is to be displayed in the collapsible tree visualisation.

## Types

All types are considered terminal nodes. This includes:
- Enum
- CustomType
- Record
- Alias

## Flyout

All type nodes and value nodes have an associated flyout with additional detail that can be opened with a left click.
Type nodes use a bespoke definition in their flyout while value nodes use the insight API from morphir-develop (eventually planned to be replaced).