import {createHash, createHmac, randomBytes, timingSafeEqual} from "node:crypto";
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

export function createSeedWordVerifiers(seedPhrase: string, pepper: string) {
  return normalizeRecoverySeed(seedPhrase)
    .split(" ")
    .map((word) => createHmac("sha256", pepper).update(word).digest("hex"));
}

export function verifySeedWord(word: string, expectedVerifier: string, pepper: string) {
  const actual = createHmac("sha256", pepper).update(word.trim().toLowerCase()).digest();
  const expected = Buffer.from(expectedVerifier, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Позиции выводятся из случайного challenge token. Сервер хранит только хеш
 * token и может повторно вычислить тот же набор при подтверждении входа.
 */
export function createSeedChallengePositions(token: string, wordCount: number, requestedCount = 4) {
  if (wordCount < requestedCount) throw new Error("Недостаточно слов для seed challenge");

  const positions = new Set<number>();
  let entropy = sha256Buffer(token);
  let offset = 0;
  while (positions.size < requestedCount) {
    if (offset + 4 > entropy.length) {
      entropy = sha256Buffer(entropy.toString("hex"));
      offset = 0;
    }
    positions.add(entropy.readUInt32BE(offset) % wordCount);
    offset += 4;
  }

  return [...positions].sort((left, right) => left - right).map((position) => position + 1);
}
