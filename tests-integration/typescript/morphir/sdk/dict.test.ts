
import { Dict, List } from '~/exports/sdk'

describe('Dict', () => {
    it('should create an empty dictionary', () => {
        const dict = Dict.empty()
        expect(dict.toString()).toBe('Dict({})')
    })

    it('should convert a list to a dictionary', () => {
        const list: List<[string, string]> = List.from([['key1', 'value1'], ['key2', 'value2']])
        const dict = Dict.fromList(list)
        expect(dict.get('key1')).toBe('value1')
        expect(dict.get('key2')).toBe('value2')
    })

    it('should insert a key-value pair', () => {
        let dict = Dict.empty<string, string>()
        dict = dict.insert('key1', 'value1')
        expect(dict.get('key1')).toBe('value1')
    })

    it('should update a value for an existing key', () => {
        let dict = Dict.empty<string, number>()
        dict = dict.insert('key1', 1)
        dict = dict.update('key1', (value) => value + 1)
        expect(dict.get('key1')).toBe(2)
    })

    it('should not update a value for a non-existing key', () => {
        let dict = Dict.empty<string, number>()
        dict = dict.update('key1', (value) => value + 1)
        expect(dict.get('key1')).toBeUndefined()
    })

    it('should remove a key-value pair', () => {
        let dict = Dict.empty<string, string>()
        dict = dict.insert('key1', 'value1')
        dict = dict.remove('key1')
        expect(dict.get('key1')).toBeUndefined()
    })

    it('should check if a key is present', () => {
        let dict = Dict.fromList<string, string>(List.from([['key1', 'value1']]))
        expect(dict.member('key1')).toBe(true)
        expect(dict.member('key2')).toBe(false)
    })

    it('should fold over the key-value pairs', () => {
        let dict = Dict.fromList<string, number>(List.from([['key1', 1], ['key2', 2]]))
        const sum = dict.foldl((acc, [_, value]) => acc + value, 0)
        expect(sum).toBe(3)
    })

    it('should combine two dictionaries', () => {
        let dict1 = Dict.fromList<string, number>(List.from([['key1', 1]]))
        let dict2 = Dict.fromList<string, number>(List.from([['key2', 2]]))
        let dict = dict1.union(dict2)
        expect(dict.get('key1')).toBe(1)
        expect(dict.get('key2')).toBe(2)

        dict1 = Dict.fromList<string, number>(List.from([['key1', 1], ['key3', 4]]))
        dict2 = Dict.fromList<string, number>(List.from([['key2', 2], ['key1', 3]]))
        dict = dict1.union(dict2)
        expect(dict.get('key1')).toBe(3)
        expect(dict.get('key2')).toBe(2)
        expect(dict.get('key3')).toBe(4)
    })
})