
import List from '~/utils/morphir/sdk/list'

describe('List', () => {
    it('should create an empty list', () => {
        const list = List.empty()
        expect(list.length).toBe(0)
    })

    it('should create a list from an iterable', () => {
        const array = [1, 2, 3]
        const list = List.from(array)
        expect(list.length).toBe(3)
        expect([...list.iterator]).toEqual(array)
    })

    it('should append a value to the list', () => {
        let list = List.empty<number>()
        list = list.append(1)
        expect(list.length).toBe(1)
        expect([...list.iterator]).toEqual([1])
    })

    it('should prepend a value to the list', () => {
        let list = List.empty<number>()
        list = list.prepend(1)
        expect(list.length).toBe(1)
        expect([...list.iterator]).toEqual([1])
    })

    it('should concatenate two lists', () => {
        const list1 = List.from([1, 2])
        const list2 = List.from([3, 4])
        const concatenatedList = list1.concat(list2)
        expect(concatenatedList.length).toBe(4)
        expect([...concatenatedList.iterator]).toEqual([1, 2, 3, 4])
    })

    it('should concatenate multple lists', () => {
        const list1 = List.from([1, 2])
        const list2 = List.from([3, 4])
        const list3 = List.from([5, 6])
        const concatenatedList = list1.concat(list2, list3)
        expect(concatenatedList.length).toBe(6)
        expect([...concatenatedList.iterator]).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should reduce the list from the left', () => {
        const list = List.from([1, 2, 3])
        const sum = list.foldl((acc, value) => acc + value, 0)
        expect(sum).toBe(6)
    })

    it('should check if two lists are equal', () => {
        const list1 = List.from([1, 2, 3])
        const list2 = List.from([1, 2, 3])
        const list3 = List.from([4, 5, 6])
        expect(list1.equals(list2)).toBe(true)
        expect(list1.equals(list3)).toBe(false)
    })
})