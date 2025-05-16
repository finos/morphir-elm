import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { version } from "../package.json"; // Import version from package.json
import { Command } from "commander"; // Import commander
import { compileElm } from "./ElmTools";

// Process arguments using commander
const program = new Command();
program
    .option("--elm-command <command>", "Specify the Elm command")
    .parse(process.argv);

const options = program.opts();
const elmCommand = options.elmCommand;

// Create an MCP server
const server = new McpServer({
    name: "Morphir MCP Server",
    version // Use the imported version
});

// Add an addition tool
server.tool("verifyElmCode",
    { code: z.string() },
    async ({ code }) => {
        const elmResult = await compileElm(code, elmCommand);
        switch (elmResult._tag) {
            case "None":
                return {
                    content: [{ type: "text", text: "No errors" }]
                };
            case "Some":
                return {
                    content: [{ type: "text", text: elmResult.value }]
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