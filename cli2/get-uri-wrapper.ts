import { getUri } from "get-uri";
import { Readable } from "stream";
import { z } from "zod";

export async function fetchUriToJson(uri: string | URL) {
  const data = await getUri(uri);
  try {
    const buffer = await toBuffer(data);
    const jsonString = buffer.toString();
    return JSON.parse(jsonString);
  } finally {
    // Ensure the underlying file descriptor is closed even if parsing throws
    // or if the stream was not fully consumed. Without this, a fs.ReadStream
    // from get-uri/file:// can be GC'd with an open fd, which under Node 24
    // surfaces as a fatal EBADF close-on-GC (finos/morphir-elm#1282).
    destroyStream(data);
  }
}

async function toBuffer(stream: Readable): Promise<Buffer> {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks as unknown as Uint8Array[]);
  } finally {
    destroyStream(stream);
  }
}

function destroyStream(stream: Readable): void {
  const s = stream as unknown as {
    destroy?: () => void;
    close?: () => void;
    readableEnded?: boolean;
    destroyed?: boolean;
  };
  // Prefer destroy() which properly closes the fd for fs.ReadStream
  if (s.destroyed || s.readableEnded) return;
  try {
    if (typeof s.destroy === "function") {
      s.destroy();
    } else if (typeof s.close === "function") {
      s.close();
    }
  } catch {
    // Ignore destroy errors - fd may already be closed
  }
}
