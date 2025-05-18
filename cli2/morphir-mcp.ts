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

        // Construct the full path for the module
        const modulePath = path.join(rootDir, sourceDirectory, projectName, `${moduleName}.elm`);

        // Ensure the directory exists
        await fs.mkdir(path.dirname(modulePath), { recursive: true });

        // Prepend the module declaration to the content
        const moduleDeclaration = `module ${projectName}.${moduleName} exposing (..)\n\n`;
        const fullContent = moduleDeclaration + content;

        // Write the module file
        await fs.writeFile(modulePath, fullContent, "utf8");

        // Run "morphir make" in the root directory
        try {
            const { stdout } = await execAsync("morphir make", { cwd: rootDir });
            return {
                content: [{ type: "text", text: `Module ${moduleName} added successfully.\n${stdout}` }]
            };
        } catch (error) {
            // Delete the module file if the command fails
            await fs.unlink(modulePath).catch(() => {
                // Ignore errors if the file cannot be deleted
            });
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
