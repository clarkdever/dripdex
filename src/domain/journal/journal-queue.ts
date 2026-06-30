import type { CollectionCard } from "../collection/collection-view-model";

export type JournalQueueItemKind = "draft" | "mystery" | "review";

export type JournalQueuePreviewState = {
  label: "Private only" | "Public preview";
  description: string;
};

export type JournalQueueItem = {
  id: string;
  kind: JournalQueueItemKind;
  initials: string;
  title: string;
  summary: string;
  reviewState: string;
  preview: JournalQueuePreviewState;
  actionLabel: "Review" | "Open";
  href: string;
};

export type PrivateJournalQueueViewModel = {
  title: "Private Journal";
  subtitle: string;
  mode: {
    publicLabel: "Public Preview";
    privateLabel: "Private Journal";
    active: "private";
  };
  stats: readonly {
    id: "drafts" | "mysteries" | "to_check" | "public_previews";
    value: number;
    label: string;
  }[];
  queueItems: readonly JournalQueueItem[];
  recentActivity: readonly {
    id: string;
    title: string;
    summary: string;
  }[];
  navigation: readonly {
    id: "queue" | "map" | "history" | "prefs";
    label: string;
    active: boolean;
  }[];
};

export function buildPrivateJournalQueueViewModel(
  cards: readonly CollectionCard[]
): PrivateJournalQueueViewModel {
  const draftItems = cards.filter((card) => card.isDraft).map(createDraftItem);
  const mysteryItems = cards.filter((card) => card.isMystery).map(createMysteryItem);
  const reviewItems = cards
    .filter((card) => card.isPublished && card.needsHumanValidation)
    .map(createReviewItem);
  const visibleReviewItems = reviewItems.slice(0, 2);
  const queueItems = [...draftItems, ...mysteryItems, ...visibleReviewItems];

  return {
    title: "Private Journal",
    subtitle: "Review queue, safe previews, and recent field activity.",
    mode: {
      publicLabel: "Public Preview",
      privateLabel: "Private Journal",
      active: "private"
    },
    stats: [
      { id: "drafts", value: draftItems.length, label: "Drafts" },
      { id: "mysteries", value: mysteryItems.length, label: "Mysteries" },
      {
        id: "to_check",
        value: draftItems.length + mysteryItems.length + reviewItems.length,
        label: "To Check"
      },
      {
        id: "public_previews",
        value: mysteryItems.length + reviewItems.length,
        label: "Public Previews"
      }
    ],
    queueItems,
    recentActivity: [
      {
        id: "activity-house-finch-photo",
        title: "House Finch photo added",
        summary: "Default card photo unchanged."
      },
      {
        id: "activity-location-privacy",
        title: "Location privacy upgraded",
        summary: "Near-home observation changed to region-only public view."
      }
    ],
    navigation: [
      { id: "queue", label: "Queue", active: true },
      { id: "map", label: "Map", active: false },
      { id: "history", label: "History", active: false },
      { id: "prefs", label: "Prefs", active: false }
    ]
  };
}

function createDraftItem(card: CollectionCard): JournalQueueItem {
  return {
    id: `queue-${card.id}`,
    kind: "draft",
    initials: "DR",
    title: `Finish ${card.displayName} draft`,
    summary: `${card.scientificName ?? "Unidentified draft"} is private until the owner publishes it.`,
    reviewState: "Draft needs owner review",
    preview: {
      label: "Private only",
      description: "Public preview: hidden until publish"
    },
    actionLabel: "Review",
    href: `/capture?draft=${card.id}`
  };
}

function createMysteryItem(card: CollectionCard): JournalQueueItem {
  return {
    id: `queue-${card.id}`,
    kind: "mystery",
    initials: "MI",
    title: `${card.displayName} mystery`,
    summary: "Candidate suggestions need an owner decision before the ID changes.",
    reviewState: "Mystery needs ID review",
    preview: {
      label: "Public preview",
      description: "Public preview: mystery card only"
    },
    actionLabel: "Open",
    href: `/mysteries/${card.id}`
  };
}

function createReviewItem(card: CollectionCard): JournalQueueItem {
  return {
    id: `queue-${card.id}`,
    kind: "review",
    initials: "SC",
    title: `${card.commonName} source check`,
    summary: "Fixture description is visible, but source notes still need owner review.",
    reviewState: "Source check pending",
    preview: {
      label: "Public preview",
      description: "Public preview: published card visible"
    },
    actionLabel: "Review",
    href: `/creatures/${card.id}`
  };
}
