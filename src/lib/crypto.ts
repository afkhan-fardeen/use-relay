// Envelope encryption for store credentials (AES-256-GCM).
//
//   MASTER_KEY (env, 32 bytes) ──wraps──► per-store data key ──encrypts──► secret
//
// Each secret gets a fresh random data key. Both layers are bound to the store ID
// through GCM "additional authenticated data", so a blob copied to another store
// fails to decrypt. Blob format: v1.<iv1>.<wrappedKey>.<iv2>.<ciphertext> (base64url,
// auth tags appended to the encrypted parts).
//
// Server-side only. Never import this from a client component.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const b64 = (b: Buffer) => b.toString("base64url");
const unb64 = (s: string) => Buffer.from(s, "base64url");

function masterKey(): Buffer {
  const raw = process.env.MASTER_KEY;
  if (!raw) throw new Error("MASTER_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("MASTER_KEY must be 32 bytes (base64)");
  return key;
}

function seal(key: Buffer, plaintext: Buffer, aad: string): { iv: Buffer; data: Buffer } {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  c.setAAD(Buffer.from(aad));
  const ct = Buffer.concat([c.update(plaintext), c.final()]);
  return { iv, data: Buffer.concat([ct, c.getAuthTag()]) };
}

function open(key: Buffer, iv: Buffer, data: Buffer, aad: string): Buffer {
  if (data.length < 16) throw new Error("Invalid encrypted data");
  const d = createDecipheriv("aes-256-gcm", key, iv);
  d.setAAD(Buffer.from(aad));
  d.setAuthTag(data.subarray(data.length - 16));
  return Buffer.concat([d.update(data.subarray(0, data.length - 16)), d.final()]);
}

export function encryptSecret(storeId: string, plaintext: string): string {
  const dataKey = randomBytes(32);
  const wrapped = seal(masterKey(), dataKey, `store:${storeId}:key`);
  const sealed = seal(dataKey, Buffer.from(plaintext, "utf8"), `store:${storeId}:secret`);
  dataKey.fill(0);
  return [VERSION, b64(wrapped.iv), b64(wrapped.data), b64(sealed.iv), b64(sealed.data)].join(".");
}

export function decryptSecret(storeId: string, blob: string): string {
  const [v, iv1, wrapped, iv2, ct] = blob.split(".");
  if (v !== VERSION || !iv1 || !wrapped || !iv2 || !ct) throw new Error("Unsupported secret format");
  const dataKey = open(masterKey(), unb64(iv1), unb64(wrapped), `store:${storeId}:key`);
  try {
    return open(dataKey, unb64(iv2), unb64(ct), `store:${storeId}:secret`).toString("utf8");
  } finally {
    dataKey.fill(0);
  }
}
