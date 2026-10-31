# Spec Delta

## MODIFIED Requirements

### Requirement: MoonBit tasks use a pinned toolchain

The MoonBit tasks SHALL run with the MoonBit version that the repository pins in its MoonBit mise environment. A
MoonBit task started without that environment SHALL stop with a message that names the environment to set.

#### Scenario: Pinned version

- **WHEN** a contributor installs the MoonBit environment and asks for the MoonBit version
- **THEN** the version is `0.10.18+6c83a7f62`

#### Scenario: Environment not set

- **WHEN** a contributor runs a MoonBit task with no `moon` executable available
- **THEN** the task fails before it does any work
- **AND** the message contains `MISE_ENV=moonbit`
