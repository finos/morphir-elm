export const MAX_MEP_PAYLOAD_BYTES = 64 * 1024 * 1024;

const MAX_MEP_HEADER_BYTES = 64 * 1024;
const CRLF_HEADER_END = Uint8Array.of(13, 10, 13, 10);
const LF_HEADER_END = Uint8Array.of(10, 10);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export type JsonRpcId = string | number | null;

export interface JsonRpcError {
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}

export type JsonRpcResponse =
  | {
      readonly jsonrpc: "2.0";
      readonly id: JsonRpcId;
      readonly result: unknown;
    }
  | {
      readonly jsonrpc: "2.0";
      readonly id: JsonRpcId;
      readonly error: JsonRpcError;
    };

function appendBytes(left: Uint8Array, right: Uint8Array): Uint8Array {
  const combined = new Uint8Array(left.byteLength + right.byteLength);
  combined.set(left);
  combined.set(right, left.byteLength);
  return combined;
}

function asBytes(chunk: unknown): Uint8Array {
  if (typeof chunk === "string") {
    return encoder.encode(chunk);
  }
  if (chunk instanceof Uint8Array) {
    return chunk;
  }
  throw new Error("MEP input produced a non-byte chunk");
}

function endsWithBytes(values: readonly number[], suffix: Uint8Array): boolean {
  if (values.length < suffix.byteLength) {
    return false;
  }
  const offset = values.length - suffix.byteLength;
  return suffix.every((byte, index) => values[offset + index] === byte);
}

function delimiterLength(window: readonly number[]): number | undefined {
  if (endsWithBytes(window, CRLF_HEADER_END)) {
    return CRLF_HEADER_END.byteLength;
  }
  if (endsWithBytes(window, LF_HEADER_END)) {
    return LF_HEADER_END.byteLength;
  }
  return undefined;
}

function delimiterPrefixLength(window: readonly number[]): number {
  return [CRLF_HEADER_END, LF_HEADER_END].reduce((longest, delimiter) => {
    const maximum = Math.min(window.length, delimiter.byteLength - 1);
    for (let length = maximum; length > longest; length -= 1) {
      const offset = window.length - length;
      if (
        delimiter
          .subarray(0, length)
          .every((byte, index) => window[offset + index] === byte)
      ) {
        return length;
      }
    }
    return longest;
  }, 0);
}

function parseContentLength(headerBytes: Uint8Array): number {
  const lines = decoder.decode(headerBytes).split("\n");
  const lengths = lines.flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) {
      throw new Error("invalid MEP header");
    }
    const name = line.slice(0, separator).trim();
    if (name.toLowerCase() !== "content-length") {
      return [];
    }
    return [line.slice(separator + 1).trim()];
  });

  if (lengths.length === 0) {
    throw new Error("MEP frame is missing Content-Length");
  }
  if (lengths.length > 1) {
    throw new Error("MEP frame has duplicate Content-Length headers");
  }

  const value = lengths[0];
  if (!/^\d+$/.test(value)) {
    throw new Error("MEP frame has an invalid Content-Length");
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    throw new Error("MEP frame has an invalid Content-Length");
  }
  if (length > MAX_MEP_PAYLOAD_BYTES) {
    throw new Error(`MEP frame payload exceeds ${MAX_MEP_PAYLOAD_BYTES} bytes`);
  }
  return length;
}

export async function* readFrames(
  input: NodeJS.ReadableStream
): AsyncGenerator<Uint8Array> {
  const header = new Uint8Array(
    MAX_MEP_HEADER_BYTES + CRLF_HEADER_END.byteLength
  );
  let headerBytesSeen = 0;
  let delimiterWindow: number[] = [];
  let expectedBodyLength: number | undefined;
  let body: Uint8Array | undefined;
  let bodyBytesSeen = 0;

  for await (const chunk of input as AsyncIterable<unknown>) {
    const bytes = asBytes(chunk);
    let cursor = 0;

    while (cursor < bytes.byteLength) {
      if (expectedBodyLength === undefined) {
        let completedDelimiterLength: number | undefined;

        while (cursor < bytes.byteLength) {
          if (headerBytesSeen >= header.byteLength) {
            throw new Error("MEP frame header exceeds 65536 bytes");
          }
          const byte = bytes[cursor];
          cursor += 1;
          header[headerBytesSeen] = byte;
          headerBytesSeen += 1;
          delimiterWindow.push(byte);
          if (delimiterWindow.length > CRLF_HEADER_END.byteLength) {
            delimiterWindow.shift();
          }

          completedDelimiterLength = delimiterLength(delimiterWindow);
          if (completedDelimiterLength !== undefined) {
            break;
          }

          const possibleDelimiterBytes = delimiterPrefixLength(delimiterWindow);
          if (headerBytesSeen - possibleDelimiterBytes > MAX_MEP_HEADER_BYTES) {
            throw new Error("MEP frame header exceeds 65536 bytes");
          }
        }

        if (completedDelimiterLength === undefined) {
          continue;
        }

        const headerByteLength = headerBytesSeen - completedDelimiterLength;
        if (headerByteLength > MAX_MEP_HEADER_BYTES) {
          throw new Error("MEP frame header exceeds 65536 bytes");
        }
        expectedBodyLength = parseContentLength(
          header.subarray(0, headerByteLength)
        );
        body = new Uint8Array(expectedBodyLength);
        headerBytesSeen = 0;
        delimiterWindow = [];

        if (expectedBodyLength === 0) {
          yield body;
          expectedBodyLength = undefined;
          body = undefined;
        }
        continue;
      }

      if (body === undefined) {
        throw new Error("MEP body buffer was not initialized");
      }
      const bytesNeeded = expectedBodyLength - bodyBytesSeen;
      const bytesAvailable = bytes.byteLength - cursor;
      const includedLength = Math.min(bytesNeeded, bytesAvailable);
      body.set(bytes.subarray(cursor, cursor + includedLength), bodyBytesSeen);
      bodyBytesSeen += includedLength;
      cursor += includedLength;

      if (bodyBytesSeen === expectedBodyLength) {
        yield body;
        expectedBodyLength = undefined;
        body = undefined;
        bodyBytesSeen = 0;
      }
    }
  }

  if (expectedBodyLength !== undefined) {
    throw new Error("truncated MEP frame body");
  }
  if (headerBytesSeen > MAX_MEP_HEADER_BYTES) {
    throw new Error("MEP frame header exceeds 65536 bytes");
  }
  if (headerBytesSeen > 0) {
    throw new Error("truncated MEP frame header");
  }
}

export function encodeFrame(message: JsonRpcResponse): Uint8Array {
  const body = encoder.encode(JSON.stringify(message));
  const header = encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`);
  return appendBytes(header, body);
}
