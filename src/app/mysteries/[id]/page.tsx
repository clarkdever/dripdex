import { notFound } from "next/navigation";

import { MysteryInvestigationPage } from "../../mystery-investigation";
import { createMysteryWorkspacePageViewModel } from "../../mystery-page-data";

type MysteryInvestigationRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MysteryInvestigationRoute({
  params
}: MysteryInvestigationRouteProps) {
  const { id } = await params;
  const viewModel = createMysteryWorkspacePageViewModel(id);

  if (!viewModel) {
    notFound();
  }

  return <MysteryInvestigationPage viewModel={viewModel} />;
}
