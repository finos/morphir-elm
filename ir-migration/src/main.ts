import * as fs from "fs";
import * as util from "util";
import * as path from "path";

import * as v1 from "./migrations/v1Migration";
import * as v2 from "./migrations/v2Migration";
import * as v3 from "./migrations/v3Migration";

const fsReadFile = util.promisify(fs.readFile)

type Migration = (previousVersion: JSON) => JSON

const MigrationList : Migration[] = [
    v1.Migration,
    v2.Migration,
    v3.Migration
]
 
async function migrate(projectDir: string, migrationList : any) : Promise<JSON | string | void> {
    const morphirIrPath: string = path.join(projectDir, "morphir-ir.json");
    const morphirIRJSON = JSON.parse((await fsReadFile(morphirIrPath)).toString() )
    const loadedIRVersion = morphirIRJSON['formatVersion']  
  
    if (loadedIRVersion == migrationList.length) {
        // do nothing. IR is latest 
        return "IR already in Latest Version";
    }
    else {
        // upgrade current format version to latest  
        for (let i = loadedIRVersion; i < migrationList.length; i++) {
          let nextMigrationtoRun = i
          // break on migration list overflow
          if((nextMigrationtoRun - 1) <= -1) {
            break
          }
          else {
            let migrateFunc = migrationList[nextMigrationtoRun - 1]
            migrateFunc(morphirIRJSON)
          }
        }
    }
    
  }

export {migrate, MigrationList}