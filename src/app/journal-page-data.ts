import { buildPrivateJournalQueueViewModel } from "../domain/journal/journal-queue";

import { createCollectionPageViewModel } from "./collection-page-data";

export function createPrivateJournalQueuePageViewModel() {
  return buildPrivateJournalQueueViewModel(createCollectionPageViewModel().cards);
}
