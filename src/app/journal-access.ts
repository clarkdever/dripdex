type JournalAccessEnv = Record<string, string | undefined>;

export function canViewPrivateJournalQueue(env: JournalAccessEnv = process.env) {
  return env.DRIPDEX_OWNER_JOURNAL_PREVIEW === "enabled";
}
