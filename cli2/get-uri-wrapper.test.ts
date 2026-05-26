import { describe, test, expect } from 'bun:test';
import * as getUriWrapper from './get-uri-wrapper';
import * as path from 'path'
import { pathToFileURL } from 'url'

describe('the get-uri-wrapper module', () => {

    test("should declare fetchUriToJson", async () => {
        expect(getUriWrapper.fetchUriToJson).toBeDefined
    });
    test("that fetches a document and converts it to JSON", async () => {
        let file = path.resolve("./elm.json")
        let elmJson = await getUriWrapper.fetchUriToJson(pathToFileURL(file).href);
        expect(elmJson).toHaveProperty("type");

    });
});
