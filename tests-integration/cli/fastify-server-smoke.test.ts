import { afterEach, describe, expect, test } from "bun:test";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const repoRoot = path.resolve(__dirname, "../..");
const testNodePath = process.env.MORPHIR_TEST_NODE_PATH ?? path.join(repoRoot, "node_modules");
const runningProcesses: ChildProcess[] = [];

afterEach(async () => {
  await Promise.all(runningProcesses.splice(0).map(stopProcess));
});

describe("web server smoke tests", () => {
  test("develop server serves project JSON and SPA fallback", async () => {
    const projectDir = makeTempDir("morphir-develop-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Smoke" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");

    const port = await getAvailablePort();
    await startNodeScript("cli/morphir-elm-develop.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`);

    await expectJson(`http://127.0.0.1:${port}/server/morphir.json`, { name: "Smoke" });
    await expectJson(`http://127.0.0.1:${port}/server/morphir-tests.json`, []);

    const fallback = await fetch(`http://127.0.0.1:${port}/nested/spa/path`);
    expect(fallback.status).toBe(200);
    expect(fallback.headers.get("content-type") ?? "").toContain("text/html");
    expect(await fallback.text()).toContain("<!DOCTYPE html>");
  });

  test("treeview server serves packaged SVG fallback", async () => {
    const port = await getAvailablePort();
    await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      ".",
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/`);

    const fallbackLogo = await fetch(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(fallbackLogo.status).toBe(200);
    expect(fallbackLogo.headers.get("content-type") ?? "").toContain("image/svg+xml");
    expect(await fallbackLogo.text()).toContain("<svg");
  });

  test("treeview server serves project SVG override", async () => {
    const projectDir = makeTempDir("morphir-treeview-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Tree" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");
    const projectAssetDir = path.join(projectDir, "treeview", "assets");
    fs.mkdirSync(projectAssetDir, { recursive: true });
    fs.writeFileSync(path.join(projectAssetDir, "2020_Morphir_Logo_Icon_WHT.svg"), "<svg>project</svg>");

    const port = await getAvailablePort();
    await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`);

    const projectLogo = await fetch(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(projectLogo.status).toBe(200);
    expect(await projectLogo.text()).toBe("<svg>project</svg>");
  });

  test("treeview server falls back to packaged SVG when project has no logo", async () => {
    const projectDir = makeTempDir("morphir-treeview-no-logo-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Tree" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");

    const port = await getAvailablePort();
    await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`);

    const fallbackLogo = await fetch(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(fallbackLogo.status).toBe(200);
    expect(await fallbackLogo.text()).toContain("<svg");
  });

  test("standalone server returns insight HTML after writing posted IR", async () => {
    await startNodeScript("server/server.js", []);
    await waitForHttp("http://127.0.0.1:8080/");

    const insight = await fetch("http://127.0.0.1:8080/insight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    const insightHtml = await insight.text();
    expect(insight.status).toBe(200);
    expect(insightHtml).toContain("<!DOCTYPE HTML>");

    await expectJson("http://127.0.0.1:8080/server/morphir-ir.json", { hello: "world" });
  });

  test("generated Dapr app shell starts and accepts CloudEvents JSON", async () => {
    const appDir = makeTempDir("morphir-dapr-shell-");
    fs.copyFileSync(path.join(repoRoot, "cli", "assets", "DaprAppShell.js"), path.join(appDir, "DaprAppShell.js"));
    fs.mkdirSync(path.join(appDir, "node_modules", "isomorphic-fetch"), { recursive: true });
    fs.writeFileSync(
      path.join(appDir, "node_modules", "isomorphic-fetch", "index.js"),
      "global.fetch = async () => ({ ok: false, statusText: 'stubbed' });\n"
    );
    fs.writeFileSync(
      path.join(appDir, "Main.js"),
      [
        "exports.Elm = {",
        "  Main: {",
        "    init: () => ({",
        "      ports: {",
        "        stateCommandPort: { send: () => {} },",
        "        stateEventPort: { subscribe: () => {} }",
        "      }",
        "    })",
        "  }",
        "};",
        "",
      ].join("\n")
    );

    await startNodeScript(path.join(appDir, "DaprAppShell.js"), [], {
      cwd: appDir,
      env: { NODE_PATH: buildNodePath([testNodePath]) },
    });
    await waitForHttp("http://127.0.0.1:3000/dapr/subscribe");

    await expectJson("http://127.0.0.1:3000/dapr/subscribe", ["A"]);

    const command = await fetch("http://127.0.0.1:3000/A", {
      method: "POST",
      headers: { "content-type": "application/cloudevents+json" },
      body: JSON.stringify({ data: { key: "k", command: {} } }),
    });
    expect(command.status).toBe(200);
    expect(await command.text()).toBe("OK");
  });
});

async function expectJson(url: string, expected: unknown): Promise<void> {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(expected);
}

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function getAvailablePort(): Promise<number> {
  const net = await import("net");
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("Could not allocate test port")));
      }
    });
    server.on("error", reject);
  });
}

async function startNodeScript(
  scriptPath: string,
  args: string[],
  options: { cwd?: string; env?: Record<string, string> } = {}
): Promise<ChildProcess> {
  const child = spawn(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd ?? repoRoot,
    env: { ...process.env, NODE_PATH: buildNodePath([testNodePath, process.env.NODE_PATH]), ...options.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  runningProcesses.push(child);

  let output = "";
  child.stdout?.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    output += chunk.toString();
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => resolve(), 100);
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Process exited before startup finished with code ${code}:\n${output}`));
    });
  });

  return child;
}

function buildNodePath(entries: Array<string | undefined>): string {
  return entries.filter((entry): entry is string => Boolean(entry)).join(path.delimiter);
}

async function waitForHttp(url: string): Promise<void> {
  const deadline = Date.now() + 5000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await Bun.sleep(100);
  }

  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  child.kill();

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
