
import * as dep from './dependencies';
import { z, ZodError } from "zod";
import * as path from 'path'
import { decode, labelToName } from "whatwg-encoding";

describe('the dependencies module', () => {

    test("should declare loadAllDependencies", async () => {
        expect(dep.loadAllDependencies).toBeDefined
    })

    test("should declare configuration types", async () => {
        expect(dep.DataUrl).toBeDefined
        expect(dep.FileUrl).toBeDefined
        expect(dep.LocalFile).toBeDefined
    })

    describe("The LocalFile configuration type", () => {
        test("should fail if can't find the file.", () => {
            try {
                dep.LocalFile.parse({
                    projectDir: __dirname,
                    sanitized: "./shouldFail.ir"
                });
            } catch (error) {
                expect(error instanceof ZodError).toBeTruthy;
                let issues = (error as ZodError).issues;
                let expectedIssue = {
                    "code": "custom",
                    "message": "File not found ./shouldFail.ir",
                };
                expect(issues[0].message).toBe(expectedIssue.message);
                expect(issues[0].code).toBe(expectedIssue.code);

            }
        });
        test("should support local file.", () => {
            let fileName = 'dependencies.ts'
            let expectedFile = path.join(__dirname, fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);

            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse({
                projectDir: __dirname,
                sanitized: `./${fileName}`
            });
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
        test("should support local files on an above folder", () => {
            let fileName = 'gulpfile.js'
            let expectedFile = path.join(__dirname, '..', fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);
            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse({
                projectDir: __dirname, 
                sanitized: `../${fileName}`
            });
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
        test("should support local files on a sibling folder", () => {
            let fileName = 'morphir.js'
            let expectedFile = path.resolve(__dirname, "..",  "cli", fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);
            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse({
                projectDir: __dirname, 
                sanitized: `../cli/${fileName}`
            });
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
    });
    describe("The Url configuration type", () => {
        test("should support http.", () => {
            let url = "http://www.google.com/"
            let { success, data: fileData } = dep.Url.safeParse(url);
            expect(success).toBeTruthy()
            expect(fileData).toStrictEqual(new URL(url));
        });
        test("should support https.", () => {
            let url = "https://www.google.com/"
            let { success, data: fileData } = dep.Url.safeParse(url);
            expect(success).toBeTruthy()
            expect(fileData).toStrictEqual(new URL(url));
        });
        test("should support ftp.", () => {
            let url = "ftp://www.google.com/"
            let { success, data: fileData } = dep.Url.safeParse(url);
            expect(success).toBeTruthy()
            expect(fileData).toStrictEqual(new URL(url));
        });
        test("should NOT support S3.", () => {
            let url = "s3://www.aws.com/mybucket"
            let { success, data: fileData } = dep.Url.safeParse(url);
            expect(success).toBeFalsy()
            expect(fileData).toBeUndefined
        });
    });

    describe("The DataURL type", ()=>{
        
        test("should support encoded json.", () => {
             
            let obj = {hello: "world"}
            let content = encodeURIComponent(JSON.stringify(obj))
            let { success, data: parseResult } = dep.DataUrl.safeParse("data:text/html,"+content);
            expect(success).toBeTruthy()

            const encodingName = labelToName(parseResult.mimeType.parameters.get("charset") || "utf-8") || "UTF-8";
            const bodyDecoded = decode(parseResult.body, encodingName);

            
             expect(bodyDecoded).toStrictEqual(JSON.stringify(obj));

        });

    })



})
