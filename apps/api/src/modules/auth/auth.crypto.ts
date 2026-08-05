import {randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash} from "node:crypto";
import {promisify} from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_KEY_LENGTH = 64;

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = await scrypt(password, salt, PASSWORD_KEY_LENGTH);

  return {
    salt,
    hash: Buffer.from(hash as Buffer).toString("base64url"),
  };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
  const expectedBuffer = Buffer.from(expectedHash, "base64url");
  const actualBuffer = Buffer.from(actualHash as Buffer);

  // timingSafeEqual защищает от утечки информации через время сравнения.
  // Перед сравнением обязательно проверяем длину, иначе Node выбросит ошибку.
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
