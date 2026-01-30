import { describe, it, expect } from 'bun:test'

import * as Types from '../generated/refModel/src/typescript/morphir/reference/model/types'

// Tests for generated TypeScript API, using types from reference-model.
//
// We are testing TypeScript types so bugs in the generated code will
// mostly appear as compile failures, rather than runtime assert failures.
describe('TypeScript type mapping', () => {
    it('represents custom type variants', () => {
        const goodNoArg: Types.Custom = { kind: 'CustomNoArg' }
        const goodOneArg: Types.Custom = { kind: 'CustomOneArg', arg1: true }
        const goodTwoArg: Types.Custom = { kind: 'CustomTwoArg', arg1: 'some good quantity', arg2: 42 }

        // The `kind` field must be specified even when we specify the variant explicitly.
        const goodNoArg_Explicit: Types.CustomNoArg = { kind: 'CustomNoArg' }
        const goodOneArg_Explicit: Types.CustomOneArg = { kind: 'CustomOneArg', arg1: true }
        const goodTwoArg_Explicit: Types.CustomTwoArg = { kind: 'CustomTwoArg', arg1: 'some good quantity', arg2: 42 }

        expect(goodNoArg.kind).toBe('CustomNoArg')
        expect(goodNoArg_Explicit.kind).toBe('CustomNoArg')
    })

    it('represents custom type unions', () => {
        const goodNoArg: Types.Custom = { kind: 'CustomNoArg' }
        const goodOneArg: Types.Custom = { kind: 'CustomOneArg', arg1: true }
        const goodTwoArg: Types.Custom = { kind: 'CustomTwoArg', arg1: 'some good quantity', arg2: 42 }

        const goodVariantArray: Types.Custom[] = [goodNoArg, goodOneArg, goodTwoArg]
        expect(goodVariantArray.length).toBe(3)
    })

    it('allows constructing custom types', () => {
        // This is rather ugly. Adding constructor functions might help, e.g.:
        //
        //     const goodFullName = FullName(FirstName("Brian"), LastName("Blessed"));
        //
        const fullName_Manual: Types.FullName = {
            kind: 'FullName',
            arg1: {
                kind: 'FirstName',
                arg1: 'Brian'
            },
            arg2: {
                kind: 'LastName',
                arg1: 'Blessed'
            }
        }

        const fullName_ConstructorFn = new Types.FullName(new Types.FirstName('Brian'), new Types.LastName('Blessed'))

        expect(fullName_Manual).toEqual(fullName_ConstructorFn)
    })

    it('allows constructing records', () => {
        const goodRecord: Types.FooBarBazRecord = {
            foo: 'A delicious banana',
            bar: true,
            baz: 123.456
        }
        expect(goodRecord.foo).toBe('A delicious banana')
    })
})
