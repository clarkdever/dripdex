import { randomBytes, scryptSync } from "node:crypto";

const password = await readPasswordFromStdin();

if (!password) {
  console.error("Pipe the owner password to stdin before running this command.");
  process.exit(1);
}

const salt = randomBytes(16);
const key = scryptSync(password, salt, 32, {
  N: 16384,
  maxmem: 64 * 1024 * 1024,
  p: 1,
  r: 8
});

console.log(["scrypt", "v1", "16384", "8", "1", salt.toString("base64url"), key.toString("base64url")].join("$"));

async function readPasswordFromStdin() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8").replace(/[\r\n]+$/u, "");
}
