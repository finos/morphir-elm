import { describe, expect, test } from "bun:test";

import { discover, parseDiscoveryRequest } from "./workspace";

const widget =
  "module Acme.Widget exposing (Size)\n\n\ntype alias Size =\n    Int\n";
const gadget = "module Acme.Gadget exposing (Size)\n";

type Entry =
  | { readonly kind: "directory" }
  | { readonly kind: "file"; readonly text: string }
  | { readonly kind: "symlink"; readonly target: string };

function files(texts: Readonly<Record<string, string>>): Record<string, Entry> {
  return Object.fromEntries([
    [".", { kind: "directory" }],
    ...Object.entries(texts).map(([path, text]) => [
      path,
      { kind: "file", text },
    ]),
  ]);
}

function adHoc({
  entries = files({ "src/Widget.elm": widget }),
  root = "src",
  paths = ["src/Widget.elm"],
  project = { kind: "synthesized" } as unknown,
  cliOverlay = {} as unknown,
  languageId = "elm",
  protocolVersion = "0.1.0-draft.1" as unknown,
}: {
  readonly entries?: Record<string, Entry>;
  readonly root?: string;
  readonly paths?: readonly string[];
  readonly project?: unknown;
  readonly cliOverlay?: unknown;
  readonly languageId?: string;
  readonly protocolVersion?: unknown;
} = {}) {
  return {
    protocolVersion,
    developmentRoot: { entries },
    morphirHome: null,
    systemConfig: null,
    environment: {},
    cliOverlay,
    purpose: {
      kind: "ad-hoc-sources",
      project,
      sources: { root, paths },
      languageId,
    },
  };
}

function discoverParams(params: unknown) {
  const parsed = parseDiscoveryRequest(params);
  if (parsed.kind === "invalid") {
    throw new Error(parsed.message);
  }
  return discover(parsed.request);
}

function expectFailure(params: unknown, code: string, path: string | null) {
  const response = discoverParams(params);
  expect(response.status).toBe("failure");
  expect(response).toHaveProperty("error.code", code);
  expect(response).toHaveProperty("error.path", path);
  expect(response).toHaveProperty("error.message", expect.any(String));
}

function expectProject(params: unknown) {
  const response = discoverParams(params);
  if (response.status !== "success") {
    throw new Error(`expected success, got ${JSON.stringify(response)}`);
  }
  expect(response.snapshot.projects).toHaveLength(1);
  return response.snapshot.projects[0]!;
}

describe("Elm ad-hoc workspace discovery", () => {
  test("names an unnamed single source for its declared module", () => {
    expect(discoverParams(adHoc())).toEqual({
      status: "success",
      snapshot: {
        protocolVersion: "0.1.0-draft.1",
        configAnchor: null,
        name: null,
        state: "open",
        diagnostics: [],
        projects: [
          {
            name: "local/acme-widget",
            version: null,
            relativePath: "src",
            configAnchor: null,
            sourceDirectory: ".",
            state: "unloaded",
            diagnostics: [],
            origin: { kind: "synthesized", inputs: ["src/Widget.elm"] },
            exposedModules: ["Acme.Widget"],
          },
        ],
      },
    });
  });

  test.each([
    [
      "a port module",
      "port module App.Ports exposing (Size, sendMessage)\n\nport sendMessage : String -> Cmd msg\n",
      "local/app-ports",
      "App.Ports",
    ],
    [
      "an effect module",
      "effect module Foo.Bar where { command = MyCmd, subscription = MySub } exposing (Size)\n",
      "local/foo-bar",
      "Foo.Bar",
    ],
    [
      "a nested block comment before the header",
      "{- outer {- nested -} comment -}\nmodule Acme.Widget exposing (Size)\n",
      "local/acme-widget",
      "Acme.Widget",
    ],
    [
      "a byte order mark and a line comment before the header",
      "\uFEFF-- banner\nmodule Acme.Widget exposing (Size)\n",
      "local/acme-widget",
      "Acme.Widget",
    ],
    [
      "an underscore in the module name",
      "module Foo_Bar exposing (X)\n",
      "local/foo_bar",
      "Foo_Bar",
    ],
  ])("names %s like a plain module", (_, text, name, module) => {
    const project = expectProject(
      adHoc({
        entries: files({ "Source.elm": text }),
        root: ".",
        paths: ["Source.elm"],
      })
    );
    expect(project.name).toBe(name);
    expect(project.exposedModules).toEqual([module]);
  });

  test("falls back to the file stem when the source declares no module", () => {
    const project = expectProject(
      adHoc({
        entries: files({ "src/Widget.elm": "x = 1\n" }),
      })
    );
    expect(project.name).toBe("local/widget");
    expect(project.exposedModules).toEqual(["Widget"]);
  });

  test("falls back to Main when the file stem is not a module path", () => {
    const project = expectProject(
      adHoc({
        entries: files({ "src/not-a-module.elm": "x = 1\n" }),
        paths: ["src/not-a-module.elm"],
      })
    );
    expect(project.name).toBe("local/main");
    expect(project.exposedModules).toEqual(["Main"]);
  });

  test("keeps a trimmed explicit name and still derives exposure", () => {
    const project = expectProject(
      adHoc({ cliOverlay: { project: { name: "  acme/widgets \n" } } })
    );
    expect(project.name).toBe("acme/widgets");
    expect(project.exposedModules).toEqual(["Acme.Widget"]);
  });

  test("a named selection exposes every module in selection order", () => {
    const project = expectProject(
      adHoc({
        entries: files({ "src/Widget.elm": widget, "src/Gadget.elm": gadget }),
        paths: ["src/Widget.elm", "src/Gadget.elm"],
        cliOverlay: { project: { name: "acme/widgets" } },
      })
    );
    expect(project.name).toBe("acme/widgets");
    expect(project.origin).toEqual({
      kind: "synthesized",
      inputs: ["src/Widget.elm", "src/Gadget.elm"],
    });
    expect(project.exposedModules).toEqual(["Acme.Widget", "Acme.Gadget"]);
  });

  test("a manifest selection takes its name from the overlay and its anchor from the manifest", () => {
    const project = expectProject(
      adHoc({
        entries: files({ "morphir.toml": "", "src/Widget.elm": widget }),
        project: { kind: "manifest", path: "morphir.toml" },
        cliOverlay: { project: { name: "acme/widgets" } },
      })
    );
    expect(project).toEqual({
      name: "acme/widgets",
      version: null,
      relativePath: "src",
      configAnchor: "morphir.toml",
      sourceDirectory: ".",
      state: "unloaded",
      diagnostics: [],
      origin: { kind: "manifest", path: "morphir.toml" },
      exposedModules: ["Acme.Widget"],
    });
  });

  test("accepts every path under the mount root", () => {
    const project = expectProject(
      adHoc({
        entries: files({ "Widget.elm": widget }),
        root: ".",
        paths: ["Widget.elm"],
      })
    );
    expect(project.relativePath).toBe(".");
  });

  test.each([
    [
      "a later draft of the protocol",
      adHoc({ protocolVersion: "0.1.0-draft.2" }),
      "workspace.protocol.unsupported",
      null,
    ],
    [
      "the release the draft leads to",
      adHoc({ protocolVersion: "0.1.0" }),
      "workspace.protocol.unsupported",
      null,
    ],
    [
      "another release line",
      adHoc({ protocolVersion: "1.0.0" }),
      "workspace.protocol.unsupported",
      null,
    ],
    [
      "a CLI overlay that is not an object",
      adHoc({ cliOverlay: ["x"] }),
      "workspace.config.invalid",
      null,
    ],
    [
      "a symlink in the development root",
      adHoc({
        entries: {
          ...files({ "src/Widget.elm": widget }),
          "src/Link.elm": { kind: "symlink", target: "src/Widget.elm" },
        },
      }),
      "workspace.symlink.unsupported",
      "src/Link.elm",
    ],
    [
      "a symlink in Morphir Home",
      {
        ...adHoc(),
        morphirHome: { entries: { a: { kind: "symlink", target: "b" } } },
      },
      "workspace.symlink.unsupported",
      "a",
    ],
    [
      "a manifest-projects purpose",
      { ...adHoc(), purpose: { kind: "manifest-projects" } },
      "workspace.purpose.unsupported",
      null,
    ],
    [
      "a request without a purpose",
      (({ purpose: _, ...rest }) => rest)(adHoc()),
      "workspace.purpose.unsupported",
      null,
    ],
    [
      "an empty language id",
      adHoc({ languageId: "" }),
      "workspace.language-id.empty",
      "src",
    ],
    [
      "a non-string explicit name",
      adHoc({ cliOverlay: { project: { name: 7 } } }),
      "workspace.config.invalid",
      "src",
    ],
    [
      "a blank explicit name",
      adHoc({ cliOverlay: { project: { name: " \t" } } }),
      "workspace.project-name.empty",
      "src",
    ],
    [
      "a manifest selection without an explicit name",
      adHoc({
        entries: files({ "morphir.toml": "", "src/Widget.elm": widget }),
        project: { kind: "manifest", path: "morphir.toml" },
      }),
      "workspace.selection.name-required",
      "morphir.toml",
    ],
    [
      "a manifest that is not a file",
      adHoc({
        project: { kind: "manifest", path: "morphir.toml" },
        cliOverlay: { project: { name: "acme/widgets" } },
      }),
      "workspace.selection.invalid",
      "morphir.toml",
    ],
    [
      "an empty selection",
      adHoc({ paths: [] }),
      "workspace.selection.empty",
      "src",
    ],
    [
      "a repeated path",
      adHoc({ paths: ["src/Widget.elm", "src/Widget.elm"] }),
      "workspace.selection.duplicate",
      "src/Widget.elm",
    ],
    [
      "a path in a sibling that shares the root's prefix",
      adHoc({
        entries: files({ "src-other/Widget.elm": widget }),
        paths: ["src-other/Widget.elm"],
      }),
      "workspace.selection.outside-root",
      "src-other/Widget.elm",
    ],
    [
      "the root itself",
      adHoc({ root: "src/Widget.elm" }),
      "workspace.selection.outside-root",
      "src/Widget.elm",
    ],
    [
      "a path that is a directory",
      adHoc({
        entries: { ...files({}), "src/Widget.elm": { kind: "directory" } },
      }),
      "workspace.selection.invalid",
      "src/Widget.elm",
    ],
    [
      "a missing path",
      adHoc({ entries: files({}) }),
      "workspace.selection.invalid",
      "src/Widget.elm",
    ],
    [
      "an explicit name outside the Elm package contract",
      adHoc({ cliOverlay: { project: { name: "Acme/Widgets" } } }),
      "workspace.project-name.invalid",
      "src",
    ],
    [
      "an unnamed selection of two sources",
      adHoc({
        entries: files({ "src/Widget.elm": widget, "src/Gadget.elm": gadget }),
        paths: ["src/Widget.elm", "src/Gadget.elm"],
      }),
      "workspace.selection.name-required",
      "src",
    ],
    [
      "two sources that define the same module",
      adHoc({
        entries: files({ "src/Widget.elm": widget, "src/Copy.elm": widget }),
        paths: ["src/Widget.elm", "src/Copy.elm"],
        cliOverlay: { project: { name: "acme/widgets" } },
      }),
      "workspace.selection.module-collision",
      "src/Copy.elm",
    ],
  ])("refuses %s", (_, params, code, path) => {
    expectFailure(params, code, path);
  });

  test("does not validate a derived package name", () => {
    const project = expectProject(
      adHoc({
        entries: files({
          "src/Widget.elm": "module ACME9.Widget exposing (x)\n",
        }),
      })
    );
    expect(project.name).toBe("local/acme9-widget");
  });

  // Where two failures coexist, the earlier check in the contract wins.
  test.each([
    [
      "protocol before overlay",
      adHoc({ protocolVersion: "9.0.0", cliOverlay: 1 }),
      "workspace.protocol.unsupported",
    ],
    [
      "overlay before symlink",
      adHoc({
        cliOverlay: "x",
        entries: { a: { kind: "symlink", target: "b" } },
      }),
      "workspace.config.invalid",
    ],
    [
      "symlink before purpose",
      {
        ...adHoc({ entries: { a: { kind: "symlink", target: "b" } } }),
        purpose: { kind: "manifest-projects" },
      },
      "workspace.symlink.unsupported",
    ],
    [
      "language id before name",
      adHoc({ languageId: "", cliOverlay: { project: { name: "" } } }),
      "workspace.language-id.empty",
    ],
    [
      "blank name before name-required manifest",
      adHoc({
        project: { kind: "manifest", path: "morphir.toml" },
        cliOverlay: { project: { name: " " } },
      }),
      "workspace.project-name.empty",
    ],
    [
      "manifest name before manifest file",
      adHoc({ project: { kind: "manifest", path: "morphir.toml" } }),
      "workspace.selection.name-required",
    ],
    [
      "manifest file before empty selection",
      adHoc({
        project: { kind: "manifest", path: "morphir.toml" },
        cliOverlay: { project: { name: "acme/widgets" } },
        paths: [],
      }),
      "workspace.selection.invalid",
    ],
    [
      "duplicate before outside root",
      adHoc({ paths: ["other/A.elm", "other/A.elm"] }),
      "workspace.selection.duplicate",
    ],
    [
      "outside root before not a file",
      adHoc({ paths: ["src/Missing.elm", "other/A.elm"] }),
      "workspace.selection.outside-root",
    ],
    [
      "not a file before the package contract",
      adHoc({
        paths: ["src/Missing.elm"],
        cliOverlay: { project: { name: "Not Canonical" } },
      }),
      "workspace.selection.invalid",
    ],
    [
      "package contract before module collision",
      adHoc({
        entries: files({ "src/Widget.elm": widget, "src/Copy.elm": widget }),
        paths: ["src/Widget.elm", "src/Copy.elm"],
        cliOverlay: { project: { name: "Not Canonical" } },
      }),
      "workspace.project-name.invalid",
    ],
    [
      "name required before module collision",
      adHoc({
        entries: files({ "src/Widget.elm": widget, "src/Copy.elm": widget }),
        paths: ["src/Widget.elm", "src/Copy.elm"],
      }),
      "workspace.selection.name-required",
    ],
  ])("checks %s", (_, params, code) => {
    const response = discoverParams(params);
    expect(response).toHaveProperty("error.code", code);
  });

  test("reports the first symlink in path order", () => {
    expectFailure(
      adHoc({
        entries: {
          "src/b": { kind: "symlink", target: "x" },
          "src/a": { kind: "symlink", target: "x" },
        },
      }),
      "workspace.symlink.unsupported",
      "src/a"
    );
  });

  test("reports the first module collision in selection order", () => {
    expectFailure(
      adHoc({
        entries: files({
          "src/A.elm": gadget,
          "src/B.elm": widget,
          "src/C.elm": widget,
          "src/D.elm": gadget,
        }),
        paths: ["src/A.elm", "src/B.elm", "src/C.elm", "src/D.elm"],
        cliOverlay: { project: { name: "acme/widgets" } },
      }),
      "workspace.selection.module-collision",
      "src/C.elm"
    );
  });

  test("accepts a null CLI overlay and omitted optional fields", () => {
    const { morphirHome, systemConfig, environment, ...request } = adHoc();
    expect(discoverParams({ ...request, cliOverlay: null }).status).toBe(
      "success"
    );
    const { cliOverlay, ...withoutOverlay } = request;
    expect(discoverParams(withoutOverlay).status).toBe("success");
  });
});

describe("Elm discovery request parsing", () => {
  test.each([
    ["a non-object request", []],
    [
      "a missing protocol version",
      (({ protocolVersion: _, ...rest }) => rest)(adHoc()),
    ],
    [
      "the integer protocol version of earlier drafts",
      adHoc({ protocolVersion: 1 }),
    ],
    ["a protocol version that is not SemVer", adHoc({ protocolVersion: "1" })],
    [
      "a protocol version with a leading v",
      adHoc({ protocolVersion: "v0.1.0-draft.1" }),
    ],
    [
      "a missing development root",
      (({ developmentRoot: _, ...rest }) => rest)(adHoc()),
    ],
    [
      "an unknown entry kind",
      adHoc({ entries: { ".": { kind: "socket" } as never } }),
    ],
    [
      "a file entry without text",
      adHoc({ entries: { a: { kind: "file" } as never } }),
    ],
    [
      "an absolute entry path",
      adHoc({ entries: files({ "/etc/passwd": "" }) }),
    ],
    [
      "an escaping entry path",
      adHoc({ entries: files({ "../Widget.elm": "" }) }),
    ],
    [
      "an empty entry path segment",
      adHoc({ entries: files({ "src//Widget.elm": "" }) }),
    ],
    [
      "a backslash entry path",
      adHoc({ entries: files({ "src\\Widget.elm": "" }) }),
    ],
    [
      "a drive-letter entry path",
      adHoc({ entries: files({ "C:Widget.elm": "" }) }),
    ],
    [
      "a symlink target outside the mount",
      adHoc({ entries: { a: { kind: "symlink", target: "../b" } } }),
    ],
    ["a malformed Morphir Home", { ...adHoc(), morphirHome: 1 }],
    ["a non-string environment value", { ...adHoc(), environment: { A: 1 } }],
    ["an unknown purpose", { ...adHoc(), purpose: { kind: "everything" } }],
    ["an unknown project source", adHoc({ project: { kind: "remote" } })],
    ["a manifest without a path", adHoc({ project: { kind: "manifest" } })],
    ["an escaping selection root", adHoc({ root: ".." })],
    ["an escaping selected path", adHoc({ paths: ["src/../Widget.elm"] })],
    ["a non-string selected path", adHoc({ paths: [1 as never] })],
    [
      "a missing language id",
      { ...adHoc(), purpose: { ...adHoc().purpose, languageId: undefined } },
    ],
  ])("refuses %s as invalid params", (_, params) => {
    expect(parseDiscoveryRequest(params).kind).toBe("invalid");
  });
});
