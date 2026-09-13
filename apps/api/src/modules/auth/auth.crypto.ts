import {createHash, randomBytes, timingSafeEqual} from "node:crypto";
import {generateMnemonic, validateMnemonic, wordlists} from "bip39";

export function createOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function createEmailCode() {
  return String(randomBytes(4).readUInt32BE() % 1_000_000).padStart(6, "0");
}

export function sha256Buffer(value: string) {
  return createHash("sha256").update(value).digest();
}

export function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashSecret(value: string) {
  return sha256Buffer(value.trim());
}

export function verifySecret(value: string, expectedHash: Buffer) {
  const actualHash = hashSecret(value);
  return actualHash.length === expectedHash.length && timingSafeEqual(actualHash, expectedHash);
}

export function createRecoverySeed(wordCount: 12 | 24 = 12) {
  return generateMnemonic(wordCount === 24 ? 256 : 128, undefined, wordlists.english);
}

export function normalizeRecoverySeed(seedPhrase: string) {
  return seedPhrase.trim().toLowerCase().replace(/\s+/g, " ");
}

export function assertValidRecoverySeed(seedPhrase: string) {
  const normalized = normalizeRecoverySeed(seedPhrase);
  if (!validateMnemonic(normalized, wordlists.english)) {
    throw new Error("Некорректная BIP-39 seed phrase");
  }

  return normalized;
}
