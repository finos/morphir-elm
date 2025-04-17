/**
 * @jest-environment jsdom
 */
import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
import { JSDOM } from "jsdom";
import { getIR } from "../../cli/treeview/src/index";

const { window } = new JSDOM(`<!DOCTYPE html><body><div></div></body>`);

describe("test getIR", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="insight"></div><div id="loading"></div>';
    global.fetch = jest.fn();
    (fetch as jest.Mock).mockClear();
  });

  test("test IR with no modules", async () => {
    const expectedTree = require("./test-ir-files/base-result.json");

    expect(await mockIR("./test-ir-files/base-ir.json")).toEqual(expectedTree);
  });

  test("test multilevel modules", async () => {
    const expectedTree = require("./test-ir-files/multilevelModules-result.json");

    expect(await mockIR("./test-ir-files/multilevelModules-ir.json")).toEqual(
      expectedTree
    );
  });

  test("test simple value tree", async () => {
    //Tests node types LetDefinition, Apply, Reference, Variable, IfThenElse, and Literal
    const expectedTree = require("./test-ir-files/simpleValueTree-result.json");

    expect(await mockIR("./test-ir-files/simpleValueTree-ir.json")).toEqual(
      expectedTree
    );
  });

  test("test simple type tree", async () => {
    //Tests node types Record, Enum, Custom Type, and Alias
    const expectedTree = require("./test-ir-files/simpleTypeTree-result.json");

    expect(await mockIR("./test-ir-files/simpleTypeTree-ir.json")).toEqual(
      expectedTree
    );
  });

  test("test List and Constructor nodes", async () => {
    const expectedTree = require("./test-ir-files/listType-result.json");

    expect(await mockIR("./test-ir-files/listType-ir.json")).toEqual(
      expectedTree
    );
  });

  test("test Tuple nodes", async () => {
    const expectedTree = require("./test-ir-files/tupleType-result.json");

    expect(await mockIR("./test-ir-files/tupleType-ir.json")).toEqual(
      expectedTree
    );
  });
});

async function mockIR(path: string) {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce(require(path)),
  });
  return await getIR();
}
