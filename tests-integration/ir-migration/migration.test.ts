// imports
const fs = require("fs")
const util = require("util")
const migration = require("../../ir-migration/src/main")
const fsWriteFile = util.promisify(fs.writeFile)

describe("IR Migration Test", () => {
    
    test("Validating IR format version is latest", async () => {
        const morphirIRJSON = {
            "formatVersion": migration.MigrationList.length, 
            "distribution": []
        }
        await fsWriteFile("./morphir-ir.json", JSON.stringify(morphirIRJSON))
        
        expect(await migration.migrate("./", migration.MigrationList))
            .toContain("IR already in Latest Version")
    })

    test("Validating Correct Number of Migrations Ran", async () => {
        const morphirIRJSON = {
            "formatVersion": migration.MigrationList.length, 
            "distribution": []
        }
        await fsWriteFile("./morphir-ir.json", JSON.stringify(morphirIRJSON))
    })
})