const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const IP_BUCKET_USERNAME = "__ip__";

type RateLimitInput = {
  ipAddress: string;
  now?: Date;
  username: string;
};

type LoginAttemptBucket = {
  attempts: number;
  expiresAt: number;
};

const loginAttempts = new Map<string, LoginAttemptBucket>();

export function isOwnerLoginRateLimited({
  ipAddress,
  now = new Date(),
  username
}: RateLimitInput): boolean {
  return (
    isBucketRateLimited(createRateLimitKey(ipAddress, IP_BUCKET_USERNAME), now) ||
    isBucketRateLimited(createRateLimitKey(ipAddress, username), now)
  );
}

function isBucketRateLimited(key: string, now: Date): boolean {
  const bucket = loginAttempts.get(key);

  if (!bucket || bucket.expiresAt <= now.getTime()) {
    loginAttempts.delete(key);
    return false;
  }

  return bucket.attempts >= MAX_ATTEMPTS;
}

export function recordOwnerLoginFailure({
  ipAddress,
  now = new Date(),
  username
}: RateLimitInput): void {
  recordFailureForKey(createRateLimitKey(ipAddress, IP_BUCKET_USERNAME), now);
  recordFailureForKey(createRateLimitKey(ipAddress, username), now);
}

function recordFailureForKey(key: string, now: Date): void {
  const existing = loginAttempts.get(key);

  if (!existing || existing.expiresAt <= now.getTime()) {
    loginAttempts.set(key, {
      attempts: 1,
      expiresAt: now.getTime() + WINDOW_MS
    });
    return;
  }

  loginAttempts.set(key, {
    attempts: existing.attempts + 1,
    expiresAt: existing.expiresAt
  });
}

export function clearOwnerLoginRateLimit(): void {
  loginAttempts.clear();
}

function createRateLimitKey(ipAddress: string, username: string): string {
  return `${ipAddress.trim().toLowerCase()}::${username.trim().toLowerCase()}`;
}
