import { notFound } from "next/navigation";

import { canViewPrivateJournalQueue } from "../journal-access";
import { PrivateJournalQueuePage } from "../journal-dashboard";
import { createPrivateJournalQueuePageViewModel } from "../journal-page-data";

export const dynamic = "force-dynamic";

export default function JournalRoute() {
  if (!canViewPrivateJournalQueue()) {
    notFound();
  }

  return <PrivateJournalQueuePage viewModel={createPrivateJournalQueuePageViewModel()} />;
}
