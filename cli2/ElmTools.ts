import { writeFile, unlink, mkdir, rmdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';
import { Option, some, none } from 'fp-ts/Option'; // Import Option from fp-ts

const execAsync = promisify(exec);

export async function compileElm(input: string, elmCommandPath: string): Promise<Option<string>> {
    const tempDirPath = join(tmpdir(), `temp-${uuidv4()}`); // Create a unique temp directory
    const tempFilePath = join(tempDirPath, `Main.elm`); // File inside the temp directory
    const elmJsonPath = join(tempDirPath, `elm.json`); // Path for elm.json

    try {
        // Create the temporary directory
        await mkdir(tempDirPath);

        // Write the input content to a temporary .elm file
        await writeFile(tempFilePath, input, 'utf8');

        // Write a basic Elm config to elm.json
        const elmJsonContent = JSON.stringify({
            type: "application",
            "source-directories": ["."],
            "elm-version": "0.19.1",
            dependencies: {
                direct: {},
                indirect: {}
            },
            "test-dependencies": {
                direct: {},
                indirect: {}
            }
        }, null, 4);
        await writeFile(elmJsonPath, elmJsonContent, 'utf8');

        // Invoke the "elm make" command with the temporary file
        await execAsync(`${elmCommandPath} make ${tempFilePath}`, { cwd: tempDirPath });
        return none; // Return no error (none) if the command was successful
    } catch (error: any) {
        return some(error.stderr?.toString() || 'Unknown error occurred'); // Return the error message wrapped in `some`
    } finally {
        // Clean up the temporary file and directory
        await unlink(tempFilePath).catch((error) => {
            console.error(`Failed to delete temp file: ${tempFilePath}`, error);
        });
        await unlink(elmJsonPath).catch((error) => {
            console.error(`Failed to delete elm.json: ${elmJsonPath}`, error);
        });
        await rmdir(tempDirPath).catch((error) => {
            console.error(`Failed to delete temp directory: ${tempDirPath}`, error);
        });
    }
}