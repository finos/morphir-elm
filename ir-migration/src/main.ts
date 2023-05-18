import * as fs from "fs";
import * as util from "util";
import * as path from "path";
import * as v1 from "./migrations/v1Migration";
import * as v2 from "./migrations/v2Migration";
import * as v3 from "./migrations/v3Migration";

const fsReadFile = util.promisify(fs.readFile);

type Json = object;

type Migration = (previousVersion: Json) => Json;

const MigrationList: Migration[] = [
  v1.Migration, 
  v2.Migration, 
  v3.Migration
];

/**
 * This function loads the Morphir-ir-json from path supplied, checks if the version is update to date, and if not upgrades the IR automically.
 *
 * @param projectDir
 * @param migrationList
 * @returns Promise<Json>
 */
async function migrate(projectDir: string, migrationList: any): Promise<Json> {
  const morphirIrPath: string = path.join(projectDir, "morphir-ir.json");
  const morphirIRJSON = JSON.parse(
    (await fsReadFile(morphirIrPath)).toString()
  );
  const loadedIRVersion = morphirIRJSON["formatVersion"];

  if (loadedIRVersion != migrationList.length) {
    let versionedIRJSON: Json = morphirIRJSON;
    for (let i = loadedIRVersion; i < migrationList.length; i++) {
      let nextMigrationtoRun = i - 1; // considering the 0 index of a List
      let migration = migrationList[nextMigrationtoRun];
      versionedIRJSON = migration(morphirIRJSON);
    }
    return versionedIRJSON;
  } else {
    // do nothing. IR is latest
    return morphirIRJSON;
  }
}

export { migrate, MigrationList, Json };
