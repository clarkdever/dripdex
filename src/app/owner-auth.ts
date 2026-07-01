import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

const OWNER_SESSION_TTL_SECONDS = 60 * 60 * 12;
const OWNER_PASSWORD_HASH_PREFIX = "scrypt";
const OWNER_PASSWORD_HASH_VERSION = "v1";
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_KEY_LENGTH = 32;
const DEFAULT_SCRYPT_COST = 16384;
const MAX_SCRYPT_MEMORY = 64 * 1024 * 1024;
const MIN_AUTH_SECRET_LENGTH = 32;

export const OWNER_SESSION_COOKIE_NAME = "dripdex_owner_session";

type OwnerAuthEnv = Record<string, string | undefined>;

type CreateOwnerPasswordHashOptions = {
  salt?: string;
  cost?: number;
};

type OwnerCredentials = {
  username: string;
  password: string;
};

type OwnerCredentialsVerificationResult =
  | {
      success: true;
    }
  | {
      success: false;
      reason: "invalid_credentials" | "missing_config";
    };

type CreateOwnerSessionTokenInput = {
  env: OwnerAuthEnv;
  now?: Date;
  username: string;
};

type OwnerSessionVerificationResult =
  | {
      success: true;
      username: string;
    }
  | {
      success: false;
      reason: "expired_session" | "invalid_session" | "missing_config";
    };

export function createOwnerPasswordHash(
  password: string,
  options: CreateOwnerPasswordHashOptions = {}
): string {
  const salt = Buffer.from(options.salt ?? base64UrlEncode(randomBytes(16)), "utf8");
  const cost = options.cost ?? DEFAULT_SCRYPT_COST;
  const key = derivePasswordKey(password, salt, cost);

  return [
    OWNER_PASSWORD_HASH_PREFIX,
    OWNER_PASSWORD_HASH_VERSION,
    String(cost),
    String(SCRYPT_BLOCK_SIZE),
    String(SCRYPT_PARALLELIZATION),
    base64UrlEncode(salt),
    base64UrlEncode(key)
  ].join("$");
}

export function verifyOwnerCredentials(
  credentials: OwnerCredentials,
  env: OwnerAuthEnv = process.env
): OwnerCredentialsVerificationResult {
  const config = readOwnerAuthConfig(env);

  if (config === null) {
    return {
      success: false,
      reason: "missing_config"
    };
  }

  const usernameMatches = safeEqual(credentials.username, config.username);
  const passwordMatches = verifyPasswordHash(credentials.password, config.passwordHash);

  if (!usernameMatches || !passwordMatches) {
    return {
      success: false,
      reason: "invalid_credentials"
    };
  }

  return {
    success: true
  };
}

export function createOwnerSessionToken({
  env,
  now = new Date(),
  username
}: CreateOwnerSessionTokenInput): string {
  const secret = env.DRIPDEX_AUTH_SECRET;

  if (!secret) {
    throw new Error("DRIPDEX_AUTH_SECRET must be configured before creating owner sessions.");
  }

  const payload = base64UrlEncode(
    Buffer.from(
      JSON.stringify({
        sub: username,
        exp: Math.floor(now.getTime() / 1000) + OWNER_SESSION_TTL_SECONDS
      }),
      "utf8"
    )
  );
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyOwnerSessionToken(
  token: string | undefined,
  env: OwnerAuthEnv = process.env,
  now: Date = new Date()
): OwnerSessionVerificationResult {
  const config = readOwnerAuthConfig(env);

  if (config === null) {
    return {
      success: false,
      reason: "missing_config"
    };
  }

  const [payload, signature, extra] = (token ?? "").split(".");

  if (!payload || !signature || extra !== undefined) {
    return {
      success: false,
      reason: "invalid_session"
    };
  }

  if (!safeEqual(signature, signPayload(payload, config.authSecret))) {
    return {
      success: false,
      reason: "invalid_session"
    };
  }

  const parsedPayload = parseSessionPayload(payload);

  if (parsedPayload === null || !safeEqual(parsedPayload.sub, config.username)) {
    return {
      success: false,
      reason: "invalid_session"
    };
  }

  if (parsedPayload.exp <= Math.floor(now.getTime() / 1000)) {
    return {
      success: false,
      reason: "expired_session"
    };
  }

  return {
    success: true,
    username: parsedPayload.sub
  };
}

export function getOwnerSessionCookieOptions(env: OwnerAuthEnv = process.env) {
  return {
    httpOnly: true,
    maxAge: OWNER_SESSION_TTL_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production"
  };
}

export function getClearedOwnerSessionCookieOptions(env: OwnerAuthEnv = process.env) {
  return {
    ...getOwnerSessionCookieOptions(env),
    maxAge: 0
  };
}

function readOwnerAuthConfig(env: OwnerAuthEnv) {
  const username = env.DRIPDEX_OWNER_USERNAME;
  const passwordHash = env.DRIPDEX_OWNER_PASSWORD_HASH;
  const authSecret = env.DRIPDEX_AUTH_SECRET;

  if (!username || !passwordHash || !authSecret) {
    return null;
  }

  if (!isStrongAuthSecret(authSecret) || parsePasswordHash(passwordHash) === null) {
    return null;
  }

  return {
    authSecret,
    passwordHash,
    username
  };
}

function verifyPasswordHash(password: string, passwordHash: string): boolean {
  const parsedHash = parsePasswordHash(passwordHash);

  if (parsedHash === null) {
    return false;
  }

  const derivedKey = tryDerivePasswordKey(password, parsedHash.salt, parsedHash.cost);

  return derivedKey !== null && timingSafeEqual(derivedKey, parsedHash.key);
}

function parsePasswordHash(passwordHash: string) {
  const [algorithm, version, cost, blockSize, parallelization, salt, key, extra] =
    passwordHash.split("$");

  if (
    algorithm !== OWNER_PASSWORD_HASH_PREFIX ||
    version !== OWNER_PASSWORD_HASH_VERSION ||
    blockSize !== String(SCRYPT_BLOCK_SIZE) ||
    parallelization !== String(SCRYPT_PARALLELIZATION) ||
    extra !== undefined
  ) {
    return null;
  }

  const parsedCost = Number(cost);
  const parsedSalt = tryBase64UrlDecode(salt);
  const parsedKey = tryBase64UrlDecode(key);

  if (
    !Number.isInteger(parsedCost) ||
    parsedCost < 1024 ||
    parsedCost > DEFAULT_SCRYPT_COST ||
    parsedSalt === null ||
    parsedSalt.length === 0 ||
    parsedKey === null ||
    parsedKey.length !== SCRYPT_KEY_LENGTH
  ) {
    return null;
  }

  return {
    cost: parsedCost,
    key: parsedKey,
    salt: parsedSalt
  };
}

function parseSessionPayload(payload: string) {
  try {
    const parsed = JSON.parse(base64UrlDecode(payload).toString("utf8")) as {
      exp?: unknown;
      sub?: unknown;
    };

    if (typeof parsed.sub !== "string" || typeof parsed.exp !== "number") {
      return null;
    }

    return {
      exp: parsed.exp,
      sub: parsed.sub
    };
  } catch {
    return null;
  }
}

function derivePasswordKey(password: string, salt: Buffer, cost: number): Buffer {
  return scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: cost,
    maxmem: MAX_SCRYPT_MEMORY,
    p: SCRYPT_PARALLELIZATION,
    r: SCRYPT_BLOCK_SIZE
  });
}

function tryDerivePasswordKey(password: string, salt: Buffer, cost: number): Buffer | null {
  try {
    return derivePasswordKey(password, salt, cost);
  } catch {
    return null;
  }
}

function signPayload(payload: string, secret: string): string {
  return base64UrlEncode(createHmac("sha256", secret).update(payload).digest());
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isStrongAuthSecret(authSecret: string): boolean {
  const trimmedSecret = authSecret.trim();

  return (
    trimmedSecret.length >= MIN_AUTH_SECRET_LENGTH &&
    !["password", "secret", "changeme", "dev"].includes(trimmedSecret.toLowerCase())
  );
}

function base64UrlEncode(input: Buffer): string {
  return input.toString("base64url");
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input, "base64url");
}

function tryBase64UrlDecode(input: string): Buffer | null {
  try {
    return base64UrlDecode(input);
  } catch {
    return null;
  }
}
