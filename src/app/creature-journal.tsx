"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { PublishedCreatureJournalPage } from "../domain/creature-page/creature-page-view-model";

type CreatureJournalPageProps = {
  viewModel: PublishedCreatureJournalPage;
  showOwnerNotes?: boolean;
};

const tagFamilies = [
  { key: "type", label: "Types", icon: "leaf" },
  { key: "foodChain", label: "Food", icon: "chain" },
  { key: "seasonality", label: "Season", icon: "sun" },
  { key: "safety", label: "Safety", icon: "eyes" }
] as const;

type TagFamilyKey = (typeof tagFamilies)[number]["key"];

function toFixtureImageUrl(path: string) {
  const fileName = path.split("/").at(-1);

  return fileName ? `/fixtures/web-images/${fileName}` : path;
}

function TagFamilyRail({ viewModel }: { viewModel: PublishedCreatureJournalPage }) {
  const [activeFamily, setActiveFamily] = useState<TagFamilyKey>("type");
  const tagValues = viewModel.tags[activeFamily];

  return (
    <section className="creature-tags" aria-label="Tag families">
      <div className="creature-tags__families">
        {tagFamilies.map((family) => (
          <button
            key={family.key}
            aria-pressed={activeFamily === family.key}
            onClick={() => setActiveFamily(family.key)}
            type="button"
          >
            <span aria-hidden="true" data-icon={family.icon} />
            {family.label}
          </button>
        ))}
      </div>
      <div className="creature-tags__values" aria-label="Expanded tag values">
        {tagValues.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </section>
  );
}

function PhotoCarousel({ viewModel }: { viewModel: PublishedCreatureJournalPage }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiplePhotos = viewModel.carouselPhotos.length > 1;
  const activePhoto = viewModel.carouselPhotos[activeIndex] ?? viewModel.defaultPhoto;
  const goToPreviousPhoto = () =>
    setActiveIndex((index) =>
      index === 0 ? viewModel.carouselPhotos.length - 1 : index - 1
    );
  const goToNextPhoto = () =>
    setActiveIndex((index) =>
      index === viewModel.carouselPhotos.length - 1 ? 0 : index + 1
    );

  return (
    <figure className="creature-photo">
      <Image
        alt={activePhoto.altText}
        height={activePhoto.dimensions.full.height}
        priority
        src={toFixtureImageUrl(activePhoto.files.full)}
        unoptimized
        width={activePhoto.dimensions.full.width}
      />
      <span className="creature-photo__rarity">{viewModel.rarity.rank}</span>
      {hasMultiplePhotos ? (
        <>
          <button
            aria-label="Previous photo"
            className="creature-photo__arrow creature-photo__arrow--previous"
            onClick={goToPreviousPhoto}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M15 18 9 12l6-6" />
            </svg>
          </button>
          <button
            aria-label="Next photo"
            className="creature-photo__arrow creature-photo__arrow--next"
            onClick={goToNextPhoto}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <div className="creature-photo__dots" aria-label="Photo carousel position">
            {viewModel.carouselPhotos.map((photo, index) => (
              <button
                key={photo.id}
                aria-label={`Photo ${index + 1} of ${viewModel.carouselPhotos.length}`}
                aria-pressed={index === activeIndex}
                className={photo.id === activePhoto.id ? "is-active" : ""}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
        </>
      ) : null}
    </figure>
  );
}

function AdultScience({ viewModel }: CreatureJournalPageProps) {
  return (
    <details className="creature-accordion" data-testid="adult-science">
      <summary>Would you like to know more?</summary>
      <p>{viewModel.adultScience.summary}</p>
      <ul>
        {viewModel.adultScience.citations.map((citation) => (
          <li key={citation.url}>
            <a href={citation.url}>{citation.label}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function formatHistoryDetails(details: string) {
  return details.replace(/https?:\/\/\S+/g, "source link");
}

function HistoryTable({ viewModel }: CreatureJournalPageProps) {
  return (
    <details className="creature-accordion" open>
      <summary>Creature Journal History</summary>
      <table aria-label="Creature journal history">
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {viewModel.history.map((event) => (
            <tr key={event.id}>
              <td>{event.dateLabel}</td>
              <td>{event.label}</td>
              <td>{formatHistoryDetails(event.details)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

export function CreatureJournalPage({
  viewModel,
  showOwnerNotes = false
}: CreatureJournalPageProps) {
  return (
    <main className="creature-journal-shell">
      <article className="creature-device" aria-labelledby="creature-title">
        <header className="creature-device__top">
          <Link aria-label="Hill Country DripDex home" className="device-brand" href="/">
            <span className="device-lens" aria-hidden="true" />
            <div>
              <span>Hill Country DripDex</span>
              <strong>Creature Journal</strong>
            </div>
          </Link>
          <div className="device-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </header>
        <section className="creature-screen">
          <div className="creature-screen__header">
            <span>
              #{viewModel.dripdexNumber} {viewModel.commonName}
            </span>
            <strong>{viewModel.rarity.rank} Frame</strong>
          </div>
          <PhotoCarousel viewModel={viewModel} />
          <section className="creature-summary">
            <p className="creature-summary__label">Nickname</p>
            <div className="creature-summary__nickname">{viewModel.displayName}</div>
            <h1 id="creature-title">{viewModel.commonName}</h1>
            <p>{viewModel.flavorText}</p>
            <TagFamilyRail viewModel={viewModel} />
          </section>
          <AdultScience viewModel={viewModel} />
          {showOwnerNotes ? (
            <section className="creature-notes" aria-labelledby="creature-notes-title">
              <h2 id="creature-notes-title">Owner Notes</h2>
              <p>Private owner notes will live here when edit mode arrives.</p>
            </section>
          ) : null}
          <HistoryTable viewModel={viewModel} />
        </section>
      </article>
    </main>
  );
}
