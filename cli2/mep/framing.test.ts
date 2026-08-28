import { describe, expect, test } from "bun:test";
import { Readable } from "node:stream";

import {
  MAX_MEP_PAYLOAD_BYTES,
  encodeFrame,
  readFrames,
  type JsonRpcResponse,
} from "./framing";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function collectFrames(chunks: readonly (string | Uint8Array)[]) {
  const input = Readable.from(
    chunks.map((chunk) =>
      typeof chunk === "string" ? encoder.encode(chunk) : chunk
    )
  );
  const frames: Uint8Array[] = [];

  for await (const frame of readFrames(input)) {
    frames.push(frame);
  }

  return frames;
}

function frame(body: string, lineEnding = "\r\n") {
  return `Content-Length: ${
    encoder.encode(body).byteLength
  }${lineEnding}${lineEnding}${body}`;
}

describe("MEP Content-Length framing", () => {
  test("reads a header fragmented across chunks", async () => {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: { ok: true },
    });

    const frames = await collectFrames([
      "Cont",
      "ent-Len",
      `gth: ${encoder.encode(body).byteLength}\r`,
      "\n\r",
      `\n${body.slice(0, 8)}`,
      body.slice(8),
    ]);

    expect(frames.map((value) => decoder.decode(value))).toEqual([body]);
  });

  for (const lineEnding of ["\r\n", "\n"] as const) {
    test(`copies a fragmented ${JSON.stringify(
      lineEnding
    )} header from a reusable changing buffer`, async () => {
      const body = JSON.stringify({ reused: lineEnding });
      const framed = encoder.encode(frame(body, lineEnding));
      async function* input() {
        const reusableByte = new Uint8Array(1);
        for (const byte of framed) {
          reusableByte[0] = byte;
          yield reusableByte;
        }
      }
      const frames: Uint8Array[] = [];

      for await (const parsed of readFrames(
        input() as unknown as NodeJS.ReadableStream
      )) {
        frames.push(parsed);
      }

      expect(frames.map((value) => decoder.decode(value))).toEqual([body]);
    });
  }

  test("accepts mixed-case Content-Length and additional headers", async () => {
    const body = "{}";
    const frames = await collectFrames([
      `X-MEP-Test: ignored\r\ncOnTeNt-LeNgTh: ${body.length}\r\n\r\n${body}`,
    ]);

    expect(frames.map((value) => decoder.decode(value))).toEqual([body]);
  });

  test("accepts LF-only header delimiters", async () => {
    const body = JSON.stringify({ jsonrpc: "2.0", id: "lf", result: {} });

    const frames = await collectFrames([frame(body, "\n")]);

    expect(frames.map((value) => decoder.decode(value))).toEqual([body]);
  });

  test("reads two consecutive frames from one chunk", async () => {
    const first = JSON.stringify({ jsonrpc: "2.0", id: 1, result: {} });
    const second = JSON.stringify({ jsonrpc: "2.0", id: "two", result: {} });

    const frames = await collectFrames([`${frame(first)}${frame(second)}`]);

    expect(frames.map((value) => decoder.decode(value))).toEqual([
      first,
      second,
    ]);
  });

  test("copies a highly fragmented body a linear number of bytes", async () => {
    const body = encoder.encode("x".repeat(4096));
    const chunks = [
      encoder.encode(`Content-Length: ${body.byteLength}\r\n\r\n`),
      ...Array.from(body, (byte) => Uint8Array.of(byte)),
    ];
    const originalSet = Uint8Array.prototype.set;
    let copiedBytes = 0;
    Uint8Array.prototype.set = function (
      source: ArrayLike<number>,
      offset?: number
    ) {
      copiedBytes += source.length;
      return originalSet.call(this, source, offset);
    };

    try {
      const frames = await collectFrames(chunks);
      expect(frames).toEqual([body]);
    } finally {
      Uint8Array.prototype.set = originalSet;
    }

    expect(copiedBytes).toBeLessThan(body.byteLength * 4);
  });

  test("copies reusable body fragments immediately and parses their frame tail", async () => {
    const firstBody = encoder.encode("0123456789abcdef".repeat(2048));
    const secondBody = JSON.stringify({ tail: true });
    const reusableByte = new Uint8Array(1);
    async function* input() {
      yield encoder.encode(`Content-Length: ${firstBody.byteLength}\r\n\r\n`);
      for (let index = 0; index < firstBody.byteLength - 1; index += 1) {
        reusableByte[0] = firstBody[index];
        yield reusableByte;
      }
      yield encoder.encode(
        `${String.fromCharCode(firstBody[firstBody.byteLength - 1])}${frame(
          secondBody
        )}`
      );
    }
    const frames: Uint8Array[] = [];

    for await (const parsed of readFrames(
      input() as unknown as NodeJS.ReadableStream
    )) {
      frames.push(parsed);
    }

    expect(frames.map((value) => decoder.decode(value))).toEqual([
      decoder.decode(firstBody),
      secondBody,
    ]);
  });

  test("reads consecutive frames across deterministic randomized chunks", async () => {
    const bodies = [
      JSON.stringify({ id: 1, value: "first" }),
      JSON.stringify({ id: "two", value: "λ" }),
      JSON.stringify({ id: 3, value: "last" }),
    ];
    const stream = encoder.encode(bodies.map((body) => frame(body)).join(""));
    const chunks: Uint8Array[] = [];
    let seed = 0x5eed;
    let offset = 0;
    while (offset < stream.byteLength) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const chunkLength = Math.min((seed % 17) + 1, stream.byteLength - offset);
      chunks.push(stream.subarray(offset, offset + chunkLength));
      offset += chunkLength;
    }

    const frames = await collectFrames(chunks);

    expect(frames.map((value) => decoder.decode(value))).toEqual(bodies);
  });

  test("rejects payload declarations above the 64 MiB limit", async () => {
    expect(MAX_MEP_PAYLOAD_BYTES).toBe(64 * 1024 * 1024);

    await expect(
      collectFrames([`Content-Length: ${MAX_MEP_PAYLOAD_BYTES + 1}\r\n\r\n`])
    ).rejects.toThrow("exceeds 67108864 bytes");
  });

  test("accepts a CRLF delimiter split after an exact-size header", async () => {
    const headerLimit = 64 * 1024;
    const prefix = "Content-Length: 2\r\nX-Padding: ";
    const header = `${prefix}${"a".repeat(headerLimit - prefix.length)}`;

    const frames = await collectFrames([`${header}\r`, "\n\r\n{}"]);

    expect(header.length).toBe(headerLimit);
    expect(frames.map((value) => decoder.decode(value))).toEqual(["{}"]);
  });

  test("accepts an LF delimiter split after an exact-size header", async () => {
    const headerLimit = 64 * 1024;
    const prefix = "Content-Length: 2\nX-Padding: ";
    const header = `${prefix}${"a".repeat(headerLimit - prefix.length)}`;

    const frames = await collectFrames([`${header}\n`, "\n{}"]);

    expect(header.length).toBe(headerLimit);
    expect(frames.map((value) => decoder.decode(value))).toEqual(["{}"]);
  });

  test("allows the 64 MiB limit before reporting a truncated body", async () => {
    await expect(
      collectFrames([`Content-Length: ${MAX_MEP_PAYLOAD_BYTES}\r\n\r\n`])
    ).rejects.toThrow("truncated MEP frame body");
  });

  test("rejects a frame with no Content-Length header", async () => {
    await expect(
      collectFrames(["Content-Type: application/json\r\n\r\n{}"])
    ).rejects.toThrow("missing Content-Length");
  });

  test("rejects duplicate Content-Length headers", async () => {
    await expect(
      collectFrames(["Content-Length: 2\r\ncontent-length: 2\r\n\r\n{}"])
    ).rejects.toThrow("duplicate Content-Length");
  });

  test("rejects malformed Content-Length values", async () => {
    await expect(
      collectFrames(["Content-Length: 2.5\r\n\r\n{}"])
    ).rejects.toThrow("invalid Content-Length");
  });

  test("rejects a truncated body", async () => {
    await expect(
      collectFrames(["Content-Length: 4\r\n\r\n{}"])
    ).rejects.toThrow("truncated MEP frame body");
  });

  test("counts response bodies in UTF-8 bytes", () => {
    const response: JsonRpcResponse = {
      jsonrpc: "2.0",
      id: "utf8",
      result: { message: "Elm says λ" },
    };
    const encoded = encodeFrame(response);
    const separator = encoder.encode("\r\n\r\n");
    const boundary = encoded.findIndex((_, index) =>
      separator.every((byte, offset) => encoded[index + offset] === byte)
    );
    const header = decoder.decode(encoded.subarray(0, boundary));
    const body = encoded.subarray(boundary + separator.byteLength);

    expect(header).toBe(`Content-Length: ${body.byteLength}`);
    expect(JSON.parse(decoder.decode(body))).toEqual(response);
  });
});
