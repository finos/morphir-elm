// imports
const fs = require("fs");
const util = require("util");
const migration = require("../../ir-migration/src/main");
const fsWriteFile = util.promisify(fs.writeFile);
const fsReadFile = util.promisify(fs.readFile);

describe("IR Migration Test", () => {
  
  test("Validating If IR format is latest", async () => {
    const morphirIRJSON = {
      formatVersion: migration.MigrationList.length,
      distribution: [],
    };
    await fsWriteFile("./morphir-ir.json", JSON.stringify(morphirIRJSON));

    const migratedIR = await migration.migrate("./", migration.MigrationList);

    expect(morphirIRJSON.formatVersion).toEqual(migratedIR.formatVersion);
  });

  
  test("Validating Previous IR is Migrated", async () => {
    const morphirIRJSON = {
      formatVersion: 1,
      distribution: [],
    };
    await fsWriteFile("./morphir-ir.json", JSON.stringify(morphirIRJSON));

    const migratedIR = await migration.migrate("./", migration.MigrationList);

    expect(migratedIR.formatVersion).toBeGreaterThan(
      morphirIRJSON.formatVersion
    );
  });

  
  test("Validating Specific Migration", async () => {
    const morphirIRJSON = {
      formatVersion: 2,
      distribution: [],
    };
    await fsWriteFile("./morphir-ir.json", JSON.stringify(morphirIRJSON));

    const migratedIR = await migration.migrate("./", migration.MigrationList);

    expect(migratedIR.formatVersion).toEqual(3);
  });
});
