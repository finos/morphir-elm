import { getUri } from "get-uri";
import { Readable } from "stream";
import { z } from "zod";

export async function fetchUriToJson(uri: string | URL ) {
    const data = await getUri(uri);
    const buffer = await toBuffer(data);
    const jsonString = buffer.toString();
    return JSON.parse(jsonString);
}

async function toBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  