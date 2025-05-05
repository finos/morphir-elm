import { equal } from '~/sdk/basics';

describe('equal', () => {
    it('should return true for equal primitive values', () => {
        expect(equal(42, 42)).toBe(true);
        expect(equal("hello", "hello")).toBe(true);
        expect(equal(true, true)).toBe(true);
        expect(equal(4.2, 4.2)).toBe(true);
    });
    it('should return false for different primitive values', () => {
        expect(equal(42, 43)).toBe(false);
        expect(equal("hello", "world")).toBe(false);
        expect(equal(true, false)).toBe(false);
        expect(equal(4.2, 4.3)).toBe(false);
    });
    it('should return true for equal objects', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { a: 1, b: 2 };
        expect(equal(obj1, obj2)).toBe(true);
    });
    it('should return false for different objects', () => {
        const obj1 = { a: 1, b: 2 };
        const obj2 = { a: 1, b: 3 };
        expect(equal(obj1, obj2)).toBe(false);
    });
    it('should return true for equal arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 3];
        expect(equal(arr1, arr2)).toBe(true);
    });
    it('should return false for different arrays', () => {
        const arr1 = [1, 2, 3];
        const arr2 = [1, 2, 4];
        expect(equal(arr1, arr2)).toBe(false);
    });
    it('should return true for equal nested objects', () => {
        const obj1 = { a: { b: 1 }, c: 2 };
        const obj2 = { a: { b: 1 }, c: 2 };
        expect(equal(obj1, obj2)).toBe(true);
    });
    it('should return false for different nested objects', () => {
        const obj1 = { a: { b: 1 }, c: 2 };
        const obj2 = { a: { b: 2 }, c: 2 };
        expect(equal(obj1, obj2)).toBe(false);
    });
    it('should return true for equal nested arrays', () => {
        const arr1 = [1, [2, 3], 4];
        const arr2 = [1, [2, 3], 4];
        expect(equal(arr1, arr2)).toBe(true);
    });
    it('should return false for different nested arrays', () => {
        const arr1 = [1, [2, 3], 4];
        const arr2 = [1, [2, 4], 4];
        expect(equal(arr1, arr2)).toBe(false);
    });
    it('should return true for equal nested objects and arrays', () => {
        const obj1 = { a: [1, 2], b: { c: 3 } };
        const obj2 = { a: [1, 2], b: { c: 3 } };
        expect(equal(obj1, obj2)).toBe(true);
    });
    it('should return false for different nested objects and arrays', () => {
        const obj1 = { a: [1, 2], b: { c: 3 } };
        const obj2 = { a: [1, 3], b: { c: 3 } };
        expect(equal(obj1, obj2)).toBe(false);
    });
});