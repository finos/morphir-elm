import { afterEach, describe, expect, test } from "bun:test";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import http from "http";
import https from "https";
import os from "os";
import path from "path";

const repoRoot = path.resolve(__dirname, "../..");
const testNodePath = process.env.MORPHIR_TEST_NODE_PATH ?? path.join(repoRoot, "node_modules");
const serverTestTimeoutMs = 20000;
const runningProcesses: ChildProcess[] = [];
const processOutput = new WeakMap<ChildProcess, () => string>();

afterEach(async () => {
  await Promise.all(runningProcesses.splice(0).map(stopProcess));
});

describe("web server smoke tests", () => {
  test("develop server serves project JSON and SPA fallback", async () => {
    const projectDir = makeTempDir("morphir-develop-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Smoke" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");

    const port = await getAvailablePort();
    const server = await startNodeScript("cli/morphir-elm-develop.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`, server);

    await expectJson(`http://127.0.0.1:${port}/server/morphir.json`, { name: "Smoke" });
    await expectJson(`http://127.0.0.1:${port}/server/morphir-tests.json`, []);

    const fallback = await requestHttp(`http://127.0.0.1:${port}/nested/spa/path`);
    expect(fallback.status).toBe(200);
    expect(fallback.headers["content-type"] ?? "").toContain("text/html");
    expect(await fallback.text()).toContain("<!DOCTYPE html>");
  }, serverTestTimeoutMs);

  test("treeview server serves packaged SVG fallback", async () => {
    const port = await getAvailablePort();
    const server = await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      ".",
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/`, server);

    const fallbackLogo = await requestHttp(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(fallbackLogo.status).toBe(200);
    expect(fallbackLogo.headers["content-type"] ?? "").toContain("image/svg+xml");
    expect(await fallbackLogo.text()).toContain("<svg");
  }, serverTestTimeoutMs);

  test("treeview server serves project SVG override", async () => {
    const projectDir = makeTempDir("morphir-treeview-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Tree" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");
    const projectAssetDir = path.join(projectDir, "treeview", "assets");
    fs.mkdirSync(projectAssetDir, { recursive: true });
    fs.writeFileSync(path.join(projectAssetDir, "2020_Morphir_Logo_Icon_WHT.svg"), "<svg>project</svg>");

    const port = await getAvailablePort();
    const server = await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`, server);

    const projectLogo = await requestHttp(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(projectLogo.status).toBe(200);
    expect(await projectLogo.text()).toBe("<svg>project</svg>");
  }, serverTestTimeoutMs);

  test("treeview server falls back to packaged SVG when project has no logo", async () => {
    const projectDir = makeTempDir("morphir-treeview-no-logo-");
    fs.writeFileSync(path.join(projectDir, "morphir.json"), JSON.stringify({ name: "Tree" }));
    fs.writeFileSync(path.join(projectDir, "morphir-ir.json"), "{}");

    const port = await getAvailablePort();
    const server = await startNodeScript("cli/morphir-elm-treeview.js", [
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--project-dir",
      projectDir,
    ]);

    await waitForHttp(`http://127.0.0.1:${port}/server/morphir.json`, server);

    const fallbackLogo = await requestHttp(`http://127.0.0.1:${port}/assets/2020_Morphir_Logo_Icon_WHT.svg`);
    expect(fallbackLogo.status).toBe(200);
    expect(await fallbackLogo.text()).toContain("<svg");
  }, serverTestTimeoutMs);

  test("standalone server returns insight HTML after writing posted IR", async () => {
    const server = await startNodeScript("server/server.js", [], {
      env: { NODE_PATH: buildNodePath([makeTranspilerStubNodePath(), testNodePath]) },
    });
    await waitForHttp("http://127.0.0.1:8080/", server);

    const insight = await requestHttp("http://127.0.0.1:8080/insight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    const insightHtml = await insight.text();
    expect(insight.status).toBe(200);
    expect(insightHtml).toContain("<!DOCTYPE HTML>");

    await expectJson("http://127.0.0.1:8080/server/morphir-ir.json", { hello: "world" });
  }, serverTestTimeoutMs);

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

    const server = await startNodeScript(path.join(appDir, "DaprAppShell.js"), [], {
      cwd: appDir,
      env: { NODE_PATH: buildNodePath([testNodePath]) },
    });
    await waitForHttp("http://127.0.0.1:3000/dapr/subscribe", server);

    await expectJson("http://127.0.0.1:3000/dapr/subscribe", ["A"]);

    const command = await requestHttp("http://127.0.0.1:3000/A", {
      method: "POST",
      headers: { "content-type": "application/cloudevents+json; charset=utf-8" },
      body: JSON.stringify({ data: { key: "k", command: {} } }),
    });
    expect(command.status).toBe(200);
    expect(await command.text()).toBe("OK");
  }, serverTestTimeoutMs);
});

async function expectJson(url: string, expected: unknown): Promise<void> {
  const response = await requestHttp(url);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(expected);
}

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function makeTranspilerStubNodePath(): string {
  const nodeModulesDir = path.join(makeTempDir("morphir-transpiler-stub-"), "node_modules");
  const packageDir = path.join(nodeModulesDir, "morphir-bsq-transpiler");
  fs.mkdirSync(packageDir, { recursive: true });
  fs.writeFileSync(
    path.join(packageDir, "index.js"),
    [
      "'use strict';",
      "exports.bosque_check_ir = function bosqueCheckIr(_ir, callback) {",
      "  callback(null, 'OK');",
      "};",
      "",
    ].join("\n")
  );
  return nodeModulesDir;
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
  processOutput.set(child, () => output);

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

async function waitForHttp(url: string, child?: ChildProcess): Promise<void> {
  const deadline = Date.now() + 15000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (child && (child.exitCode !== null || child.signalCode !== null)) {
      throw new Error(`Process exited while waiting for ${url}:\n${processOutput.get(child)?.() ?? ""}`);
    }
    try {
      const response = await requestHttp(url);
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

async function requestHttp(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ status: number; headers: http.IncomingHttpHeaders; text: () => Promise<string>; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === "https:" ? https : http;
    const request = transport.request(
      parsedUrl,
      {
        method: options.method ?? "GET",
        headers: options.headers,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            text: async () => body,
            json: async () => JSON.parse(body),
          });
        });
      }
    );
    request.on("error", reject);
    if (options.body) {
      request.write(options.body);
    }
    request.end();
  });
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
