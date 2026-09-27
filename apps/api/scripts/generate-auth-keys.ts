import {generateKeyPairSync} from "node:crypto";
import {access, chmod, mkdir, writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";

const keysDirectory = fileURLToPath(new URL("../../../infrastructure/keys", import.meta.url));
const privateKeyPath = `${keysDirectory}/jwt-private.pem`;
const publicKeyPath = `${keysDirectory}/jwt-public.pem`;

try {
  await Promise.all([access(privateKeyPath), access(publicKeyPath)]);
  console.log(`RS256 keys already exist in ${keysDirectory}`);
  process.exit(0);
} catch {
  // At least one key is missing, so a complete pair is generated below.
}

const {privateKey, publicKey} = generateKeyPairSync("rsa", {
  modulusLength: 3072,
  privateKeyEncoding: {type: "pkcs8", format: "pem"},
  publicKeyEncoding: {type: "spki", format: "pem"},
});

await mkdir(keysDirectory, {recursive: true});
await writeFile(privateKeyPath, privateKey, {mode: 0o600, flag: "wx"});
await writeFile(publicKeyPath, publicKey, {mode: 0o644, flag: "wx"});
await chmod(privateKeyPath, 0o600);
console.log(`RS256 keys created in ${keysDirectory}`);
