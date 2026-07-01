import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { canViewPrivateJournalQueue } from "../journal-access";
import { PrivateJournalQueuePage } from "../journal-dashboard";
import { createPrivateJournalQueuePageViewModel } from "../journal-page-data";
import { OWNER_SESSION_COOKIE_NAME } from "../owner-auth";

export const dynamic = "force-dynamic";

export default async function JournalRoute() {
  const cookieStore = await cookies();

  if (
    !canViewPrivateJournalQueue({
      sessionToken: cookieStore.get(OWNER_SESSION_COOKIE_NAME)?.value
    })
  ) {
    redirect("/login?next=/journal");
  }

  return <PrivateJournalQueuePage viewModel={createPrivateJournalQueuePageViewModel()} />;
}
