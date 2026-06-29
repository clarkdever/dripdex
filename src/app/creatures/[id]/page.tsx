import { notFound } from "next/navigation";

import { buildCreaturePageViewModel } from "../../../domain/creature-page/creature-page-view-model";
import { createFixtureRecords } from "../../collection-page-data";
import { CreatureJournalPage } from "../../creature-journal";

type CreatureJournalRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CreatureJournalRoute({
  params
}: CreatureJournalRouteProps) {
  const { id } = await params;
  const record = createFixtureRecords().find(
    (candidate) => candidate.creature.id === id
  );

  if (!record) {
    notFound();
  }

  const viewModel = buildCreaturePageViewModel(record);

  if (viewModel.kind !== "published-journal") {
    notFound();
  }

  return <CreatureJournalPage viewModel={viewModel} />;
}
