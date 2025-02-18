import * as getUriWrapper from './get-uri-wrapper';
import * as path from 'path'

describe('the get-uri-wrapper module', () => {

    test("should declare fetchUriToJson", async () => {
        expect(getUriWrapper.fetchUriToJson).toBeDefined
    });
    test("that fetches a document and converts it to JSON", async () => {
        let file = path.resolve("./elm.json")
        let elmJson = await getUriWrapper.fetchUriToJson(`file://${file}`);
        expect(elmJson).toHaveProperty("compilerOptions");
 
    });
});
