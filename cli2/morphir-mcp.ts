import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { version } from "../package.json"; // Import version from package.json
import { Command } from "commander"; // Import commander
import { compileElm } from "./ElmTools";
import { spawn } from "child_process"; // Import spawn from child_process

// Process arguments using commander
const program = new Command();
program
    .option("--elm-command <command>", "Specify the Elm command")
    .option("--root-dir <directory>", "Specify the root directory of the Morphir project")
    .parse(process.argv);

const options = program.opts();
const elmCommand = options.elmCommand;
const rootDir = options.rootDir; // Capture the new option

if (!rootDir) {
    throw new Error("Root directory is not specified. Use the --root-dir option.");
}

// Create an MCP server
const server = new McpServer(
    {
        name: "Morphir MCP Server",
        version // Use the imported version
    },
    {
        // Define the server's resources
        instructions:
            `
        This is a Morphir MCP server. It provides tools to interact with Morphir projects.
        The server supports the following tools:
        - addModule: Adds a module to the Morphir project. A module can contain types and
        functions defined using the syntax of the Elm programming language.
        `
    }
);


// Utility function to ensure elm.json exists, creates it if missing
async function ensureElmJson(rootDir: string, sourceDirectory: string): Promise<{ existed: boolean }> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const elmJsonPath = path.join(rootDir, "elm.json");
    let existed = true;
    try {
        await fs.access(elmJsonPath);
    } catch {
        existed = false;
        const elmJsonContent = JSON.stringify({
            type: "application",
            "source-directories": [sourceDirectory],
            "elm-version": "0.19.1",
            dependencies: {
                direct: {
                    "elm/browser": "1.0.2",
                    "elm/core": "1.0.5",
                    "elm/html": "1.0.0"
                },
                indirect: {
                    "elm/json": "1.1.3",
                    "elm/time": "1.0.0",
                    "elm/url": "1.0.0",
                    "elm/virtual-dom": "1.0.3"
                }
            },
            "test-dependencies": {
                direct: {},
                indirect: {}
            }
        }, null, 4);
        await fs.writeFile(elmJsonPath, elmJsonContent, "utf8");
    }
    return { existed };
}

// Add a new tool to add a module to the Morphir project
server.tool("addModule",
    `This tool adds a module to the Morphir project. A module can contain types and 
    functions defined using the syntax of the Elm programming language. 

    The tool takes two arguments: the name of the module and the content of the module.
    The name of the module should be a valid Elm module name, preferably single word, 
    and the content should be a valid Elm code without the module declaration line. 
    Imports are supported, but should be limited to the elm/core library.

    Every module name will implicitly be prefixed with "MorphirMCP.".
    `,
    {
        moduleName: z.string(),
        content: z.string()
    },
    async ({ moduleName, content }) => {
        if (!rootDir) {
            throw new Error("Root directory is not specified. Use the --root-dir option.");
        }
        const fs = await import("fs/promises");
        const path = await import("path");
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        // Read morphir.json to get the sourceDirectory and name
        const morphirConfigPath = path.join(rootDir, "morphir.json");
        const morphirConfig = JSON.parse(await fs.readFile(morphirConfigPath, "utf8"));
        const sourceDirectory = morphirConfig.sourceDirectory;
        const projectName = morphirConfig.name;

        if (!sourceDirectory) {
            throw new Error("sourceDirectory is not defined in morphir.json.");
        }
        if (!projectName) {
            throw new Error("name is not defined in morphir.json.");
        }

        // Prepend the module declaration to the content
        const moduleDeclaration = `module ${projectName}.${moduleName} exposing (..)\n\n`;
        const fullContent = moduleDeclaration + content;

        // Construct the full path for the module
        const modulePath = path.join(rootDir, sourceDirectory, projectName, `${moduleName}.elm`);

        // Ensure the directory exists
        await fs.mkdir(path.dirname(modulePath), { recursive: true });

        // Write the module file
        await fs.writeFile(modulePath, fullContent, "utf8");

        // Ensure elm.json exists in the root directory, create if missing
        const { existed: elmJsonExisted } = await ensureElmJson(rootDir, sourceDirectory);

        // Run "elm make" on the saved module file
        try {
            await execAsync(`${elmCommand} make ${modulePath}`, { cwd: rootDir });
        } catch (error) {
            await fs.unlink(modulePath).catch(() => { });
            if (!elmJsonExisted) {
                const elmJsonPath = path.join(rootDir, "elm.json");
                await fs.unlink(elmJsonPath).catch(() => { });
            }
            return {
                content: [{ type: "text", text: `Elm compile error:\n${(error as any).stderr || (error as any).message}` }]
            };
        }

        // Run "morphir make" in the root directory
        try {
            const { stdout } = await execAsync("morphir make", { cwd: rootDir });
            return {
                content: [{ type: "text", text: `Module ${moduleName} added successfully.\n${stdout}` }]
            };
        } catch (error) {
            await fs.unlink(modulePath).catch(() => { });
            if (!elmJsonExisted) {
                const elmJsonPath = path.join(rootDir, "elm.json");
                await fs.unlink(elmJsonPath).catch(() => { });
            }
            return {
                content: [{ type: "text", text: `Failed to run "morphir make":\n${(error as any).stderr || (error as any).message}` }]
            };
        }
    }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

// Try to start the server
server.connect(transport).then(() => {
    // nothing to log here since stdout is used for MCP transport
}).catch((error) => {
    console.error("Failed to connect server:", error);
});
