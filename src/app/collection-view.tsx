"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState, useSyncExternalStore } from "react";

import {
  filterCollectionViewModel,
  type PrimaryCollectionFilter
} from "../domain/collection/collection-search";
import type {
  CollectionCard,
  CollectionGroup,
  CollectionViewModel
} from "../domain/collection/collection-view-model";

export type CollectionPageCardProps = {
  card: CollectionCard;
  density?: "standard" | "compact";
  priority?: boolean;
};

type CollectionCardImageProps = {
  card: CollectionCard;
  priority: boolean;
};

type GuestbookEntry = {
  id: string;
  displayName: string;
  visitingFrom: string;
  message: string;
  status: "approved" | "pending";
};

const primaryFilters = [
  { key: "all", label: "All" },
  { key: "found", label: "Found" },
  { key: "favorites", label: "Favorites" },
  { key: "drafts", label: "Drafts" },
  { key: "mysteries", label: "Mysteries" }
] as const satisfies readonly {
  key: PrimaryCollectionFilter;
  label: string;
}[];

const visibleGroups = new Set([
  "birds",
  "mammals",
  "reptiles",
  "amphibians",
  "fish",
  "insects",
  "arachnids",
  "other-invertebrates",
  "plants",
  "fungi",
  "mysteries"
]);

const publicIntroHiddenKey = "dripdex_public_intro_hidden";
const publicIntroHiddenEvent = "dripdex-public-intro-hidden-change";
const guestbookPageSize = 50;

const approvedGuestbookEntries = [
  {
    id: "approved-1",
    displayName: "Maya",
    visitingFrom: "Austin, TX",
    message: "We used this to compare two backyard birds after breakfast.",
    status: "approved"
  },
  {
    id: "approved-2",
    displayName: "Room 12",
    visitingFrom: "4th grade science",
    message: "Please add more spiders. The draft stamp is our favorite part.",
    status: "approved"
  },
  {
    id: "approved-3",
    displayName: "Nana J",
    visitingFrom: "Kerrville",
    message: "Saw a ladder-backed woodpecker on a cedar post this morning.",
    status: "approved"
  },
  ...Array.from({ length: 49 }, (_, index) => {
    const noteNumber = index + 4;

    return {
      id: `approved-${noteNumber}`,
      displayName: `Trail visitor ${noteNumber}`,
      visitingFrom: "Texas Hill Country",
      message: "Stopped by the collection and left a field note for later.",
      status: "approved" as const
    };
  })
] as const satisfies readonly GuestbookEntry[];

function hasStoredPublicIntroHidden() {
  try {
    return window.localStorage.getItem(publicIntroHiddenKey) === "1";
  } catch {
    return false;
  }
}

function hasHiddenPublicIntro() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    hasStoredPublicIntroHidden() ||
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .includes(`${publicIntroHiddenKey}=1`)
  );
}

function subscribeToPublicIntroHidden(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(publicIntroHiddenEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(publicIntroHiddenEvent, onStoreChange);
  };
}

function getPublicIntroServerSnapshot() {
  return false;
}

function getFormString(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function getApprovedGuestbookPage(page: number) {
  const start = page * guestbookPageSize;

  return approvedGuestbookEntries.slice(start, start + guestbookPageSize);
}

function getGuestbookPageLabel(page: number) {
  const start = page * guestbookPageSize + 1;
  const end = Math.min((page + 1) * guestbookPageSize, approvedGuestbookEntries.length);

  return `Showing ${start}-${end} of ${approvedGuestbookEntries.length} approved notes`;
}

function toFixtureImageUrl(path: string) {
  const fileName = path.split("/").at(-1);

  return fileName ? `/fixtures/web-images/${fileName}` : path;
}

function formatNumber(dripdexNumber: string | null) {
  return `#${dripdexNumber ?? "???"}`;
}

function getStatusLabel(card: CollectionCard) {
  if (card.isLocked) {
    return "Locked";
  }
  if (card.isMystery) {
    return "Mystery";
  }
  if (card.isDraft) {
    return "Draft";
  }

  return "Found";
}

function getAccessibleCardName(card: CollectionCard, statusLabel: string) {
  const name = card.isMystery ? "Mystery creature" : card.commonName;

  return `${name} ${statusLabel}`;
}

function getCardClassName(card: CollectionCard, density: CollectionPageCardProps["density"]) {
  return [
    "collection-card",
    density === "compact" ? "collection-card--compact" : "",
    card.isLocked ? "collection-card--locked" : "",
    card.isMystery ? "collection-card--mystery" : "",
    card.isDraft ? "collection-card--draft" : "",
    card.isFavorite ? "collection-card--favorite" : "",
    card.isNew ? "collection-card--new" : ""
  ]
    .filter(Boolean)
    .join(" ");
}

function getFeaturedTags(card: CollectionCard) {
  return [...new Set([...card.typeTags, ...card.foodChainTags])].slice(0, 3);
}

function CollectionCardImage({ card, priority }: CollectionCardImageProps) {
  if (card.isLocked) {
    return (
      <div className="collection-card__locked-art">
        <span aria-label="Locked checklist slot" className="collection-card__lock">
          <span aria-hidden="true" className="collection-card__lock-shackle" />
          <span aria-hidden="true" className="collection-card__lock-body" />
        </span>
      </div>
    );
  }

  if (card.isMystery) {
    return (
      <div className="collection-card__mystery-art">
        {card.image ? (
          <Image
            alt={`${card.displayName} mystery`}
            height={420}
            loading={priority ? "eager" : "lazy"}
            unoptimized
            width={560}
            src={toFixtureImageUrl(card.image.card)}
          />
        ) : null}
        <span aria-hidden="true" className="collection-card__question">
          ?
        </span>
      </div>
    );
  }

  if (!card.image) {
    return <div className="collection-card__empty-art" aria-hidden="true" />;
  }

  return (
    <Image
      alt={card.commonName}
      className="collection-card__photo"
      height={420}
      loading={priority ? "eager" : "lazy"}
      unoptimized
      width={560}
      src={toFixtureImageUrl(card.image.card)}
    />
  );
}

export function CollectionPageCard({
  card,
  density = "standard",
  priority = false
}: CollectionPageCardProps) {
  const tags = getFeaturedTags(card);
  const statusLabel = getStatusLabel(card);

  return (
    <article
      aria-label={getAccessibleCardName(card, statusLabel)}
      className={getCardClassName(card, density)}
    >
      <div className="collection-card__media">
        {card.isFavorite ? (
          <span className="collection-card__star" aria-label="Favorite">
            ★
          </span>
        ) : null}
        {card.isNew ? <span className="collection-card__new">NEW</span> : null}
        {card.isDraft ? (
          <span aria-label="Draft stamp" className="collection-card__draft-stamp">
            DRAFT
          </span>
        ) : null}
        <CollectionCardImage card={card} priority={priority} />
      </div>
      <div className="collection-card__body">
        <div className="collection-card__number-row">
          <span className="collection-card__number">
            {formatNumber(card.dripdexNumber)}
          </span>
          <span className="collection-card__status">{statusLabel.toUpperCase()}</span>
        </div>
        <h3 className="collection-card__name">{card.commonName}</h3>
        <p className="collection-card__scientific">
          {card.scientificName ?? (card.isLocked ? "Still searching" : "Needs your expert eye")}
        </p>
        {tags.length > 0 ? (
          <div className="collection-card__tags" aria-label="Tags">
            {tags.map((tag) => (
              <span key={tag} className="collection-card__tag">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CollectionGroupSection({
  group,
  isFirstGroup
}: {
  group: CollectionGroup;
  isFirstGroup: boolean;
}) {
  if (!visibleGroups.has(group.key) || group.cards.length === 0) {
    return null;
  }

  const foundCount = group.cards.filter((card) => card.isPublished).length;

  return (
    <section className="collection-group" aria-labelledby={`group-${group.key}`}>
      <div className="collection-group__header">
        <h2 id={`group-${group.key}`}>{group.label}</h2>
        <span>
          {foundCount} found / {group.cards.length} in Hill Country set
        </span>
      </div>
      <div className="collection-grid">
        {group.cards.map((card, index) => (
          <CollectionPageCard
            key={card.id}
            card={card}
            priority={isFirstGroup && index < 2}
          />
        ))}
      </div>
    </section>
  );
}

function FavoritesRow({ favorites }: { favorites: readonly CollectionCard[] }) {
  if (favorites.length === 0) {
    return null;
  }

  return (
    <section className="favorites-row" aria-labelledby="favorites-title">
      <div className="favorites-row__header">
        <h2 id="favorites-title">Front Row Favorites</h2>
        <span>Starred finds stay up top</span>
      </div>
      <div className="favorites-row__cards">
        {favorites.map((card) => (
          <CollectionPageCard
            key={card.id}
            card={card}
            density="compact"
            priority
          />
        ))}
      </div>
    </section>
  );
}

function GroupJumpList({ groups }: { groups: readonly CollectionGroup[] }) {
  return (
    <nav className="group-jump" aria-label="Jump to a group">
      {groups
        .filter((group) => visibleGroups.has(group.key))
        .map((group) => (
          <a key={group.key} href={`#group-${group.key}`}>
            {group.label}
          </a>
        ))}
    </nav>
  );
}

function GuestbookRow({ entry }: { entry: GuestbookEntry }) {
  return (
    <article
      aria-label={`${entry.displayName} guestbook note ${entry.status}`}
      className={`guestbook-row guestbook-row--${entry.status}`}
    >
      <strong className="guestbook-name">{entry.displayName}</strong>
      <span className="guestbook-from">{entry.visitingFrom}</span>
      <p className="guestbook-message">{entry.message}</p>
      <span className={`guestbook-badge guestbook-badge--${entry.status}`}>
        {entry.status === "pending" ? "Pending" : "Approved"}
      </span>
    </article>
  );
}

function GuestbookAccordion() {
  const [pendingEntries, setPendingEntries] = useState<GuestbookEntry[]>([]);
  const [approvedPage, setApprovedPage] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "New notes appear pending until owner approval."
  );
  const approvedPageEntries = getApprovedGuestbookPage(approvedPage);
  const pageCount = Math.ceil(approvedGuestbookEntries.length / guestbookPageSize);

  function submitGuestbook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const displayName = getFormString(formData, "displayName", "Field visitor");
    const visitingFrom = getFormString(formData, "visitingFrom", "Somewhere outside");
    const message = getFormString(formData, "message", "Signed the guest book.");

    setPendingEntries((entries) => [
      {
        id: `pending-${entries.length + 1}`,
        displayName,
        visitingFrom,
        message,
        status: "pending"
      },
      ...entries
    ]);
    setApprovedPage(0);
    setStatusMessage("Added below as pending owner approval.");
    form.reset();
  }

  return (
    <details className="guestbook">
      <summary>
        <span className="guestbook-title">
          <strong>Click to Sign Our Guest Book</strong>
          <span>See who has stopped by, then sign your own field note.</span>
        </span>
        <span className="guestbook-caret" aria-hidden="true">
          ›
        </span>
      </summary>
      <div className="guestbook-panel">
        <form className="guestbook-form" onSubmit={submitGuestbook}>
          <label>
            Name
            <input
              autoComplete="name"
              maxLength={80}
              name="displayName"
              placeholder="Scout, class name, or first name"
              required
              type="text"
            />
          </label>
          <label>
            Visiting From
            <input
              maxLength={100}
              name="visitingFrom"
              placeholder="Austin, science class, grandma's porch..."
              required
              type="text"
            />
          </label>
          <label className="guestbook-form__wide">
            Comment
            <textarea
              maxLength={500}
              name="message"
              placeholder="What did you notice? What should we look for next?"
              required
            />
          </label>
          <div className="guestbook-actions">
            <span className="guestbook-status" role="status" aria-live="polite">
              {statusMessage}
            </span>
            <button className="guestbook-send" type="submit">
              Sign Guest Book
            </button>
          </div>
        </form>

        <div className="guestbook-list" role="region" aria-label="Guest book entries">
          {pendingEntries.map((entry) => (
            <GuestbookRow key={entry.id} entry={entry} />
          ))}
          {approvedPageEntries.map((entry) => (
            <GuestbookRow key={entry.id} entry={entry} />
          ))}
        </div>

        <div className="guestbook-pagination">
          <span>{getGuestbookPageLabel(approvedPage)}</span>
          <span className="guestbook-page-buttons">
            <button
              className="guestbook-page-button"
              disabled={approvedPage === 0}
              onClick={() => setApprovedPage((page) => Math.max(0, page - 1))}
              type="button"
            >
              Prev
            </button>
            <button
              className="guestbook-page-button"
              disabled={approvedPage >= pageCount - 1}
              onClick={() =>
                setApprovedPage((page) => Math.min(pageCount - 1, page + 1))
              }
              type="button"
            >
              Next
            </button>
          </span>
        </div>
      </div>
    </details>
  );
}

export function CollectionPage({ viewModel }: { viewModel: CollectionViewModel }) {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [primaryFilter, setPrimaryFilter] =
    useState<PrimaryCollectionFilter>("all");
  const hasDismissedPublicIntro = useSyncExternalStore(
    subscribeToPublicIntroHidden,
    hasHiddenPublicIntro,
    getPublicIntroServerSnapshot
  );
  const filteredViewModel = useMemo(
    () =>
      filterCollectionViewModel(viewModel, {
        primary: primaryFilter,
        query
      }),
    [primaryFilter, query, viewModel]
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(queryInput);
  }

  function hidePublicIntro() {
    try {
      window.localStorage.setItem(publicIntroHiddenKey, "1");
    } catch {
      // The cookie fallback still dismisses the intro when storage is unavailable.
    }
    document.cookie = `${publicIntroHiddenKey}=1; max-age=31536000; path=/; samesite=lax`;
    window.dispatchEvent(new Event(publicIntroHiddenEvent));
  }

  return (
    <main className="collection-shell">
      <section className="dripdex-device" aria-labelledby="collection-title">
        <header className="device-header">
          <div className="device-brand">
            <span className="device-lens" aria-hidden="true" />
            <div>
              <span>Hill Country DripDex</span>
              <strong>Gotta Catch&apos;em Y&apos;all!</strong>
            </div>
          </div>
          <div className="device-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>
        <div className="collection-screen">
          <div className="collection-toolbar">
            <div>
              <h1 id="collection-title">Collection</h1>
              <p>
                Browse the Hill Country set by creature, status, and little local
                clues.
              </p>
            </div>
            <strong>
              {filteredViewModel.progress.found}/{filteredViewModel.progress.total}
              <span>Found</span>
            </strong>
          </div>
          {!hasDismissedPublicIntro ? (
            <section
              className="public-intro"
              id="learn-more"
              aria-labelledby="public-intro-title"
            >
              <div>
                <strong>Personal Hill Country field journal</strong>
                <h2 id="public-intro-title">About DripDex</h2>
                <p>
                  DripDex is a local creature collection, family field notebook, and
                  open-source pattern for self-hosted nature journals.
                </p>
              </div>
              <div className="public-intro__actions">
                <button className="public-intro__hide" onClick={hidePublicIntro} type="button">
                  Hide Intro
                </button>
                <a className="public-intro__learn" href="#learn-more">
                  Learn More
                </a>
              </div>
            </section>
          ) : null}
          <GuestbookAccordion />
          <form className="collection-search" role="search" onSubmit={submitSearch}>
            <label htmlFor="collection-search">Search collection</label>
            <input
              id="collection-search"
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Search birds, bugs, drafts..."
              type="search"
              value={queryInput}
            />
            <button type="submit">Filter</button>
          </form>
          <div className="collection-tabs" aria-label="Collection filters">
            {primaryFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                aria-pressed={primaryFilter === filter.key}
                onClick={() => setPrimaryFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
            <button className="collection-tabs__add" disabled type="button">
              Add Find
            </button>
          </div>
          <FavoritesRow favorites={filteredViewModel.favorites} />
          <GroupJumpList groups={filteredViewModel.groups} />
          {filteredViewModel.emptyState.isEmpty ? (
            <p className="collection-empty">{filteredViewModel.emptyState.message}</p>
          ) : (
            <div className="collection-groups">
              {filteredViewModel.groups.map((group, index) => (
                <CollectionGroupSection
                  key={group.key}
                  group={group}
                  isFirstGroup={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
