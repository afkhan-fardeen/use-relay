import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { decryptSecret, encryptSecret } from "../src/lib/crypto.ts";

process.env.MASTER_KEY = randomBytes(32).toString("base64");
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

test("round trip", () => {
  const blob = encryptSecret(A, "shpss_super_secret");
  assert.equal(decryptSecret(A, blob), "shpss_super_secret");
});

test("fresh randomness: same input gives different blobs", () => {
  assert.notEqual(encryptSecret(A, "x"), encryptSecret(A, "x"));
});

test("blob is bound to its store", () => {
  const blob = encryptSecret(A, "secret");
  assert.throws(() => decryptSecret(B, blob));
});

test("tampering is detected", () => {
  const parts = encryptSecret(A, "secret").split(".");
  const ct = Buffer.from(parts[4], "base64url");
  ct[0] ^= 1;
  parts[4] = ct.toString("base64url");
  assert.throws(() => decryptSecret(A, parts.join(".")));
});

test("wrong master key cannot decrypt", () => {
  const blob = encryptSecret(A, "secret");
  process.env.MASTER_KEY = randomBytes(32).toString("base64");
  assert.throws(() => decryptSecret(A, blob));
});

test("plaintext never appears in the blob", () => {
  assert.ok(!encryptSecret(A, "shpss_super_secret").includes("shpss"));
});

test("rejects a bad master key", () => {
  process.env.MASTER_KEY = "too-short";
  assert.throws(() => encryptSecret(A, "x"));
});
