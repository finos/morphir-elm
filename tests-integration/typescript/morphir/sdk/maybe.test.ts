import { Maybe } from '~/exports/sdk';

describe('Maybe', () => {
    describe('Just', () => {
        it('should create a Just with the given value', () => {
            const justValue = Maybe.Just(42);
            expect(justValue.kind).toBe('Just');
        });

        it('should return the value using withDefault', () => {
            const justValue = Maybe.Just(42);
            expect(justValue.withDefault(0)).toBe(42);
        });

        it('should map the value using map', () => {
            const justValue = Maybe.Just(10);
            const mappedValue = justValue.map(x => x * 2);
            expect(mappedValue.kind).toBe('Just');
            expect(mappedValue.withDefault(0)).toBe(20);
        });

        it('should return the value using andThen', () => {
            const justValue = Maybe.Just(5);
            const flatMappedValue = justValue.andThen(x => Maybe.Just(x * 3));
            expect(flatMappedValue.kind).toBe('Just');
            expect(flatMappedValue.withDefault(0)).toBe(15);
        });
    });

    describe('Nothing', () => {
        it('should create a Nothing', () => {
            const nothingValue = Maybe.Nothing<number>();
            expect(nothingValue.kind).toBe('Nothing');
        });

        it('should return the default value using withDefault', () => {
            const nothingValue = Maybe.Nothing<number>();
            expect(nothingValue.withDefault(0)).toBe(0);
        });

        it('should remain Nothing when using map', () => {
            const nothingValue = Maybe.Nothing<number>();
            const mappedValue = nothingValue.map(x => x * 2);
            expect(mappedValue.kind).toBe('Nothing');
        });

        it('should remain Nothing when using andThen', () => {
            const nothingValue = Maybe.Nothing<number>();
            const flatMappedValue = nothingValue.andThen(x => Maybe.Just(x * 3));
            expect(flatMappedValue.kind).toBe('Nothing');
        });
    });

    describe('Maybe', () => {
        it('should create a Just when the value is not null or undefined', () => {
            const maybeValue = Maybe.Maybe(100);
            expect(maybeValue.kind).toBe('Just');
            expect(maybeValue.withDefault(0)).toBe(100);
        });

        it('should create a Nothing when the value is null', () => {
            const maybeValue = Maybe.Maybe(null);
            expect(maybeValue.kind).toBe('Nothing');
        });

        it('should create a Nothing when the value is undefined', () => {
            const maybeValue = Maybe.Maybe(undefined);
            expect(maybeValue.kind).toBe('Nothing');
        });
    });
});