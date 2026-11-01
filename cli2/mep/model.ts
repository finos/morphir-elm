// The MEP 0.2.0-draft.1 model transport of the Elm classic extension: the tuples and limits it supports, how it
// agrees them with a host, and the morphir-json model envelope. The rules match the Elm extension (moonbit/mep), so
// that a host sees the same envelope from either Elm frontend.
import { createHash } from "node:crypto";

export const ENVELOPE_VERSION = "0.1.0-draft.1";
export const MODEL_IR_VERSION = "4.0.0";
export const COMPILE_MODEL = "morphir.frontend.compileModel";

export interface Tuple {
  readonly operation: string;
  readonly profile: string;
  readonly codec: string;
  readonly envelopeVersion: string;
  readonly irVersion: string;
}

export interface Limits {
  readonly maxEncodedBytes: number;
  readonly maxDecodedBytes: number;
  readonly maxDepth: number;
  readonly maxNodes: number;
}

export interface Transport {
  readonly tuples: readonly Tuple[];
  readonly limits: Limits;
  readonly guarantees: readonly string[];
}

const COMPILE_MODEL_TUPLE: Tuple = Object.freeze({
  operation: COMPILE_MODEL,
  profile: "morphir-ir",
  codec: "morphir-json",
  envelopeVersion: ENVELOPE_VERSION,
  irVersion: MODEL_IR_VERSION,
});

/** The extension's own limits are the host defaults; a session uses the smaller of each pair. */
const SUPPORTED_LIMITS: Limits = Object.freeze({
  maxEncodedBytes: 2796204,
  maxDecodedBytes: 2097152,
  maxDepth: 128,
  maxNodes: 100000,
});

/** The model transport that describe claims. */
export const supportedTransport: Transport = Object.freeze({
  tuples: Object.freeze([COMPILE_MODEL_TUPLE]),
  limits: SUPPORTED_LIMITS,
  guarantees: Object.freeze([]),
});

const TUPLE_KEYS = ["operation", "profile", "codec", "envelopeVersion", "irVersion"] as const;
const LIMIT_KEYS = ["maxEncodedBytes", "maxDecodedBytes", "maxDepth", "maxNodes"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A tuple with exactly the five members, each a string; undefined for anything else. */
export function readTuple(value: unknown): Tuple | undefined {
  if (
    !isRecord(value) ||
    Object.keys(value).length !== TUPLE_KEYS.length ||
    !TUPLE_KEYS.every((key) => typeof value[key] === "string")
  ) {
    return undefined;
  }
  return {
    operation: value.operation as string,
    profile: value.profile as string,
    codec: value.codec as string,
    envelopeVersion: value.envelopeVersion as string,
    irVersion: value.irVersion as string,
  };
}

export function sameTuple(a: Tuple, b: Tuple): boolean {
  return TUPLE_KEYS.every((key) => a[key] === b[key]);
}

export type Agreement =
  | { readonly kind: "agreed"; readonly transport: Transport }
  | { readonly kind: "invalid"; readonly message: string };

/** Agrees a host's model transport offer: the offered tuples the extension supports, and the smaller limits. */
export function agreeTransport(offer: unknown): Agreement {
  const invalid = (message: string) => ({ kind: "invalid", message } as const);
  if (!isRecord(offer)) {
    return invalid("modelTransport must be an object");
  }
  if (!Array.isArray(offer.tuples)) {
    return invalid("modelTransport.tuples must be an array");
  }
  const offered: Tuple[] = [];
  for (const item of offer.tuples) {
    const tuple = readTuple(item);
    if (tuple === undefined) {
      return invalid(
        "each model transport tuple has exactly operation, profile, codec, envelopeVersion and irVersion"
      );
    }
    offered.push(tuple);
  }
  if (!isRecord(offer.limits)) {
    return invalid("modelTransport.limits must be an object");
  }
  const limits: Record<string, number> = {};
  for (const key of LIMIT_KEYS) {
    const value = offer.limits[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 2147483647) {
      return invalid(`modelTransport.limits.${key} must be an integer from 1 to 2147483647`);
    }
    limits[key] = Math.min(value, SUPPORTED_LIMITS[key]);
  }
  const guarantees = offer.guarantees ?? [];
  if (
    !Array.isArray(guarantees) ||
    !guarantees.every((g) => typeof g === "string" && g.length > 0) ||
    new Set(guarantees).size !== guarantees.length
  ) {
    return invalid("modelTransport.guarantees must hold unique non-empty strings");
  }
  const tuples = offered.filter((tuple) =>
    supportedTransport.tuples.some((supported) => sameTuple(tuple, supported))
  );
  return {
    kind: "agreed",
    transport: { tuples, limits: limits as unknown as Limits, guarantees: [] },
  };
}

export function sha256Hex(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The model id of a package: the same as the Elm extension gives it. */
export function modelId(packageName: string): string {
  return `urn:finos:morphir-elm:model:${sha256Hex(packageName)}`;
}

/** The morphir-json model envelope for IR 4.0.0 text, or undefined when it is over the agreed limits. */
export function envelope(irText: string, packageName: string, limits: Limits) {
  const bytes = new TextEncoder().encode(irText);
  const content = Buffer.from(bytes).toString("base64");
  if (bytes.byteLength > limits.maxDecodedBytes || content.length > limits.maxEncodedBytes) {
    return undefined;
  }
  const digest = sha256Hex(bytes);
  return {
    envelopeVersion: ENVELOPE_VERSION,
    modelId: modelId(packageName),
    revision: `sha256:${digest}`,
    irVersion: MODEL_IR_VERSION,
    profile: "morphir-ir",
    payload: {
      codec: "morphir-json",
      layout: "single-document",
      decodedByteLength: bytes.byteLength,
      sha256: digest,
      content,
    },
  };
}
