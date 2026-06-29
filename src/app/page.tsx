import { createCollectionPageViewModel } from "./collection-page-data";
import { CollectionPage } from "./collection-view";

export default function HomePage() {
  return <CollectionPage viewModel={createCollectionPageViewModel()} />;
}
