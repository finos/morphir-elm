// A small host for the morphir-bytes-v1 ABI, for tests and tools. It behaves as the MoonBit CLI's worker does for
// one session: one instance, and one `handle` call for each unframed JSON-RPC message.
//   handle() > 0   the response has exactly that many bytes, written with output_byte
//   handle() = 0   the guest exited; it wrote no bytes
//   handle() = -2  the message was a notification; no bytes
//   handle() = -1  infrastructure failure

export interface BytesImports {
  readonly morphir_bytes_v1: {
    readonly input_len: () => number;
    readonly input_byte: (index: number) => number;
    readonly output_byte: (value: number) => void;
  };
}

export interface BytesExports {
  readonly handle: () => number;
}

export type CallResult =
  | { readonly kind: "response"; readonly text: string }
  | { readonly kind: "notification" }
  | { readonly kind: "exit" }
  | { readonly kind: "failure" };

export class BytesSession {
  readonly #exports: BytesExports;
  #input: Uint8Array = new Uint8Array();
  #output: number[] = [];
  #exited = false;

  constructor(instantiate: (imports: BytesImports) => BytesExports) {
    this.#exports = instantiate({
      morphir_bytes_v1: {
        input_len: () => this.#input.length,
        input_byte: (index) => (index >= 0 && index < this.#input.length ? this.#input[index] : -1),
        output_byte: (value) => {
          if (!Number.isInteger(value) || value < 0 || value > 255) {
            throw new Error(`output_byte got ${value}, which is not a byte`);
          }
          this.#output.push(value);
        },
      },
    });
  }

  /** Sends one message and returns what the guest answered. Throws when the guest breaks the ABI. */
  call(message: string): CallResult {
    if (this.#exited) {
      throw new Error("the guest has exited");
    }
    this.#input = new TextEncoder().encode(message);
    this.#output = [];
    const result = this.#exports.handle();
    const written = this.#output.length;
    if (result === -1) {
      return { kind: "failure" };
    }
    if (result > 0 ? written !== result : written !== 0 || (result !== 0 && result !== -2)) {
      throw new Error(`the guest wrote ${written} bytes but returned ${result}`);
    }
    if (result === 0) {
      this.#exited = true;
      return { kind: "exit" };
    }
    if (result === -2) {
      return { kind: "notification" };
    }
    return { kind: "response", text: new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(this.#output)) };
  }
}

/** Instantiates a guest module. The module may import nothing but the three morphir_bytes_v1 functions. */
export function wasmGuest(bytes: BufferSource): (imports: BytesImports) => BytesExports {
  const module_ = new WebAssembly.Module(bytes);
  return (imports) => {
    const instance = new WebAssembly.Instance(module_, imports as unknown as WebAssembly.Imports);
    const handle = instance.exports.handle;
    if (typeof handle !== "function") {
      throw new Error("the module does not export handle");
    }
    return { handle: handle as () => number };
  };
}

/** The module's imports as "module.name" strings, sorted. */
export function moduleImports(bytes: BufferSource): string[] {
  return WebAssembly.Module.imports(new WebAssembly.Module(bytes))
    .map((entry) => `${entry.module}.${entry.name}`)
    .sort();
}
