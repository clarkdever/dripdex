"use client";

import Image from "next/image";
import { type FormEvent, useMemo, useState } from "react";

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

export function CollectionPage({ viewModel }: { viewModel: CollectionViewModel }) {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [primaryFilter, setPrimaryFilter] =
    useState<PrimaryCollectionFilter>("all");
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
