import { describe, expect, test } from "bun:test";
import { BytesSession, type BytesImports } from "./bytes-host";

/** A fake guest: `behave` gets the request text and the imports, and returns what handle returns. */
function fake(behave: (request: string, imports: BytesImports) => number) {
  return (imports: BytesImports) => ({
    handle: () => {
      const bytes: number[] = [];
      for (let i = 0; i < imports.morphir_bytes_v1.input_len(); i++) {
        bytes.push(imports.morphir_bytes_v1.input_byte(i));
      }
      return behave(new TextDecoder().decode(new Uint8Array(bytes)), imports);
    },
  });
}

function write(imports: BytesImports, text: string): number {
  const bytes = new TextEncoder().encode(text);
  for (const byte of bytes) imports.morphir_bytes_v1.output_byte(byte);
  return bytes.length;
}

describe("BytesSession", () => {
  test("returns the response bytes when handle returns their length", () => {
    const session = new BytesSession(fake((request, imports) => write(imports, `echo ${request}`)));
    expect(session.call('{"id":1}')).toEqual({ kind: "response", text: 'echo {"id":1}' });
  });

  test("returns a notification when handle returns -2", () => {
    const session = new BytesSession(fake(() => -2));
    expect(session.call('{"method":"morphir.initialized"}')).toEqual({ kind: "notification" });
  });

  test("returns exit when handle returns 0, and refuses later calls", () => {
    const session = new BytesSession(fake(() => 0));
    expect(session.call('{"method":"morphir.exit"}')).toEqual({ kind: "exit" });
    expect(() => session.call("{}")).toThrow(/exited/);
  });

  test("returns failure when handle returns -1", () => {
    const session = new BytesSession(fake(() => -1));
    expect(session.call("{}")).toEqual({ kind: "failure" });
  });

  test("fails when the length differs from the bytes written", () => {
    const session = new BytesSession(fake((_, imports) => write(imports, "abc") + 1));
    expect(() => session.call("{}")).toThrow(/wrote 3 bytes but returned 4/);
  });

  test("fails when a notification or exit writes bytes", () => {
    const session = new BytesSession(fake((_, imports) => (write(imports, "x"), -2)));
    expect(() => session.call("{}")).toThrow(/wrote 1 bytes but returned -2/);
  });

  test("fails on an output value that is not a byte", () => {
    const session = new BytesSession(fake((_, imports) => (imports.morphir_bytes_v1.output_byte(256), 1)));
    expect(() => session.call("{}")).toThrow(/not a byte/);
  });

  test("answers -1 for an input index out of range", () => {
    let seen = 0;
    const session = new BytesSession(
      fake((_, imports) => ((seen = imports.morphir_bytes_v1.input_byte(99)), -2))
    );
    session.call("{}");
    expect(seen).toBe(-1);
  });
});
