import { verifyOwnerSessionToken } from "./owner-auth";

type JournalAccessEnv = Record<string, string | undefined>;

type CanViewPrivateJournalQueueInput = {
  env?: JournalAccessEnv;
  now?: Date;
  sessionToken?: string;
};

export function canViewPrivateJournalQueue({
  env = process.env,
  now = new Date(),
  sessionToken
}: CanViewPrivateJournalQueueInput = {}) {
  return verifyOwnerSessionToken(sessionToken, env, now).success;
}
