import { Just, Nothing, Maybe } from '~/sdk/maybe';

describe('Maybe', () => {
    describe('Just', () => {
        it('should create a Just with the given value', () => {
            const justValue = Just(42);
            expect(justValue.kind).toBe('Just');
        });

        it('should return the value using getOrElse', () => {
            const justValue = Just(42);
            expect(justValue.getOrElse(0)).toBe(42);
        });

        it('should map the value using map', () => {
            const justValue = Just(10);
            const mappedValue = justValue.map(x => x * 2);
            expect(mappedValue.kind).toBe('Just');
            expect(mappedValue.getOrElse(0)).toBe(20);
        });

        it('should flatMap the value using flatMap', () => {
            const justValue = Just(5);
            const flatMappedValue = justValue.flatMap(x => Just(x * 3));
            expect(flatMappedValue.kind).toBe('Just');
            expect(flatMappedValue.getOrElse(0)).toBe(15);
        });
    });

    describe('Nothing', () => {
        it('should create a Nothing', () => {
            const nothingValue = Nothing<number>();
            expect(nothingValue.kind).toBe('Nothing');
        });

        it('should return the default value using getOrElse', () => {
            const nothingValue = Nothing<number>();
            expect(nothingValue.getOrElse(0)).toBe(0);
        });

        it('should remain Nothing when using map', () => {
            const nothingValue = Nothing<number>();
            const mappedValue = nothingValue.map(x => x * 2);
            expect(mappedValue.kind).toBe('Nothing');
        });

        it('should remain Nothing when using flatMap', () => {
            const nothingValue = Nothing<number>();
            const flatMappedValue = nothingValue.flatMap(x => Just(x * 3));
            expect(flatMappedValue.kind).toBe('Nothing');
        });
    });

    describe('Maybe', () => {
        it('should create a Just when the value is not null or undefined', () => {
            const maybeValue = Maybe(100);
            expect(maybeValue.kind).toBe('Just');
            expect(maybeValue.getOrElse(0)).toBe(100);
        });

        it('should create a Nothing when the value is null', () => {
            const maybeValue = Maybe(null);
            expect(maybeValue.kind).toBe('Nothing');
        });

        it('should create a Nothing when the value is undefined', () => {
            const maybeValue = Maybe(undefined);
            expect(maybeValue.kind).toBe('Nothing');
        });
    });
});