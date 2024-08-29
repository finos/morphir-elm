
import * as dep from './dependencies';
import { z, ZodError } from "zod";
import * as path from 'path'

describe('the dependencies module', () => {

    test("should declare loadAllDependencies", async () => {
        expect(dep.loadAllDependencies).toBeDefined
    })

    test("should declare configuration types", async () => {
        expect(dep.DataUrl).toBeDefined
        expect(dep.FileUrl).toBeDefined
        expect(dep.GithubData).toBeDefined
        expect(dep.LocalFile).toBeDefined
    })
    describe("The LocalFile configuration type", () => {
        test("should fail if can't find the file .", () => {
            try {
                dep.LocalFile.parse("./shouldFail.ir");
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
        test("should support local file .", () => {
            let fileName = 'dependencies.ts'
            let expectedFile = path.join(__dirname, fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);

            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse(`./cli2/${fileName}`);
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
        test("should support local file different folder", () => {
            let fileName = 'gulpfile.js'
            let expectedFile = path.join(__dirname, '..', fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);
            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse(`./cli2/../${fileName}`);
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
        test("should support local file different sub folder", () => {
            let fileName = 'morphir.js'
            let expectedFile = path.join(__dirname, '..', "cli", fileName);

            let expectedUrl = new URL(`file://${expectedFile}`);
            let { success: urlSuccess, data: urlData } = dep.LocalFile.safeParse(`./cli2/../cli/${fileName}`);
            expect({ success: urlSuccess, data: urlData }).toStrictEqual({ success: true, data: expectedUrl });
        });
    });




})
