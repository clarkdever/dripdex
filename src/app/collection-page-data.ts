import {
  buildCollectionViewModel,
  type LockedCollectionCardInput,
  type CollectionViewModel
} from "../domain/collection/collection-view-model";
import type { ResolvedFixtureCreature } from "../domain/fixtures/fixture-repository";
import {
  type FixtureDataset,
  type History,
  type Observation,
  type Photo
} from "../domain/fixtures/fixture-schemas";

import manifest from "../../docs/fixtures/metadata/fixture-manifest.json";
import collectionViewFixture from "../../docs/fixtures/metadata/collection-view.json";
import americanSnout from "../../docs/fixtures/metadata/creatures/american-snout.json";
import devilsCigar from "../../docs/fixtures/metadata/creatures/devils-cigar.json";
import giantRedheadedCentipede from "../../docs/fixtures/metadata/creatures/giant-redheaded-centipede.json";
import gulfCoastToad from "../../docs/fixtures/metadata/creatures/gulf-coast-toad.json";
import houseFinch from "../../docs/fixtures/metadata/creatures/house-finch.json";
import mysteryWhiteShelfFungus from "../../docs/fixtures/metadata/creatures/mystery-white-shelf-fungus.json";
import texasBluebonnet from "../../docs/fixtures/metadata/creatures/texas-bluebonnet.json";
import texasBrownTarantula from "../../docs/fixtures/metadata/creatures/texas-brown-tarantula.json";
import texasPricklyPear from "../../docs/fixtures/metadata/creatures/texas-prickly-pear.json";
import texasSpinyLizard from "../../docs/fixtures/metadata/creatures/texas-spiny-lizard.json";
import westernMosquitofish from "../../docs/fixtures/metadata/creatures/western-mosquitofish.json";
import whiteTailedDeer from "../../docs/fixtures/metadata/creatures/white-tailed-deer.json";
import photoAmericanSnout from "../../docs/fixtures/metadata/photos/photo-american-snout-001.json";
import photoDevilsCigar from "../../docs/fixtures/metadata/photos/photo-devils-cigar-001.json";
import photoGiantRedheadedCentipede from "../../docs/fixtures/metadata/photos/photo-giant-redheaded-centipede-001.json";
import photoGulfCoastToad from "../../docs/fixtures/metadata/photos/photo-gulf-coast-toad-001.json";
import photoHouseFinch from "../../docs/fixtures/metadata/photos/photo-house-finch-001.json";
import photoMysteryWhiteShelfFungus from "../../docs/fixtures/metadata/photos/photo-mystery-white-shelf-fungus-001.json";
import photoTexasBluebonnet from "../../docs/fixtures/metadata/photos/photo-texas-bluebonnet-001.json";
import photoTexasBrownTarantula from "../../docs/fixtures/metadata/photos/photo-texas-brown-tarantula-001.json";
import photoTexasPricklyPear from "../../docs/fixtures/metadata/photos/photo-texas-prickly-pear-001.json";
import photoTexasSpinyLizard from "../../docs/fixtures/metadata/photos/photo-texas-spiny-lizard-001.json";
import photoWesternMosquitofish from "../../docs/fixtures/metadata/photos/photo-western-mosquitofish-001.json";
import photoWhiteTailedDeer from "../../docs/fixtures/metadata/photos/photo-white-tailed-deer-001.json";
import obsAmericanSnout from "../../docs/fixtures/metadata/observations/obs-american-snout-001.json";
import obsDevilsCigar from "../../docs/fixtures/metadata/observations/obs-devils-cigar-001.json";
import obsGiantRedheadedCentipede from "../../docs/fixtures/metadata/observations/obs-giant-redheaded-centipede-001.json";
import obsGulfCoastToad from "../../docs/fixtures/metadata/observations/obs-gulf-coast-toad-001.json";
import obsHouseFinch from "../../docs/fixtures/metadata/observations/obs-house-finch-001.json";
import obsMysteryWhiteShelfFungus from "../../docs/fixtures/metadata/observations/obs-mystery-white-shelf-fungus-001.json";
import obsTexasBluebonnet from "../../docs/fixtures/metadata/observations/obs-texas-bluebonnet-001.json";
import obsTexasBrownTarantula from "../../docs/fixtures/metadata/observations/obs-texas-brown-tarantula-001.json";
import obsTexasPricklyPear from "../../docs/fixtures/metadata/observations/obs-texas-prickly-pear-001.json";
import obsTexasSpinyLizard from "../../docs/fixtures/metadata/observations/obs-texas-spiny-lizard-001.json";
import obsWesternMosquitofish from "../../docs/fixtures/metadata/observations/obs-western-mosquitofish-001.json";
import obsWhiteTailedDeer from "../../docs/fixtures/metadata/observations/obs-white-tailed-deer-001.json";
import historyAmericanSnout from "../../docs/fixtures/metadata/history/history-american-snout.json";
import historyDevilsCigar from "../../docs/fixtures/metadata/history/history-devils-cigar.json";
import historyGiantRedheadedCentipede from "../../docs/fixtures/metadata/history/history-giant-redheaded-centipede.json";
import historyGulfCoastToad from "../../docs/fixtures/metadata/history/history-gulf-coast-toad.json";
import historyHouseFinch from "../../docs/fixtures/metadata/history/history-house-finch.json";
import historyMysteryWhiteShelfFungus from "../../docs/fixtures/metadata/history/history-mystery-white-shelf-fungus.json";
import historyTexasBluebonnet from "../../docs/fixtures/metadata/history/history-texas-bluebonnet.json";
import historyTexasBrownTarantula from "../../docs/fixtures/metadata/history/history-texas-brown-tarantula.json";
import historyTexasPricklyPear from "../../docs/fixtures/metadata/history/history-texas-prickly-pear.json";
import historyTexasSpinyLizard from "../../docs/fixtures/metadata/history/history-texas-spiny-lizard.json";
import historyWesternMosquitofish from "../../docs/fixtures/metadata/history/history-western-mosquitofish.json";
import historyWhiteTailedDeer from "../../docs/fixtures/metadata/history/history-white-tailed-deer.json";

const pageFixtureDataset = {
  manifest,
  creatures: [
    americanSnout,
    devilsCigar,
    giantRedheadedCentipede,
    gulfCoastToad,
    houseFinch,
    mysteryWhiteShelfFungus,
    texasBluebonnet,
    texasBrownTarantula,
    texasPricklyPear,
    texasSpinyLizard,
    westernMosquitofish,
    whiteTailedDeer
  ],
  photos: [
    photoAmericanSnout,
    photoDevilsCigar,
    photoGiantRedheadedCentipede,
    photoGulfCoastToad,
    photoHouseFinch,
    photoMysteryWhiteShelfFungus,
    photoTexasBluebonnet,
    photoTexasBrownTarantula,
    photoTexasPricklyPear,
    photoTexasSpinyLizard,
    photoWesternMosquitofish,
    photoWhiteTailedDeer
  ],
  observations: [
    obsAmericanSnout,
    obsDevilsCigar,
    obsGiantRedheadedCentipede,
    obsGulfCoastToad,
    obsHouseFinch,
    obsMysteryWhiteShelfFungus,
    obsTexasBluebonnet,
    obsTexasBrownTarantula,
    obsTexasPricklyPear,
    obsTexasSpinyLizard,
    obsWesternMosquitofish,
    obsWhiteTailedDeer
  ],
  histories: [
    historyAmericanSnout,
    historyDevilsCigar,
    historyGiantRedheadedCentipede,
    historyGulfCoastToad,
    historyHouseFinch,
    historyMysteryWhiteShelfFungus,
    historyTexasBluebonnet,
    historyTexasBrownTarantula,
    historyTexasPricklyPear,
    historyTexasSpinyLizard,
    historyWesternMosquitofish,
    historyWhiteTailedDeer
  ]
} as unknown as FixtureDataset;

function createIndexById<TRecord extends { id: string }>(records: readonly TRecord[]) {
  return new Map(records.map((record) => [record.id, record]));
}

function assertRecord<TRecord>(
  record: TRecord | undefined,
  message: string
): TRecord {
  if (!record) {
    throw new Error(message);
  }

  return record;
}

function resolvePageFixtureRecords(dataset: FixtureDataset): ResolvedFixtureCreature[] {
  const photosById = createIndexById<Photo>(dataset.photos);
  const observationsById = createIndexById<Observation>(dataset.observations);
  const historiesById = createIndexById<History>(dataset.histories);

  return dataset.creatures
    .map((creature) => {
      const defaultPhoto = assertRecord(
        photosById.get(creature.defaultPhotoId),
        `Fixture creature ${creature.id} is missing its default photo`
      );
      const history = assertRecord(
        historiesById.get(creature.historyId),
        `Fixture creature ${creature.id} is missing its history`
      );
      const photos = creature.photoIds.map((photoId) =>
        assertRecord(
          photosById.get(photoId),
          `Fixture creature ${creature.id} is missing photo ${photoId}`
        )
      );
      const observations = creature.observationIds.map((observationId) =>
        assertRecord(
          observationsById.get(observationId),
          `Fixture creature ${creature.id} is missing observation ${observationId}`
        )
      );
      const manifestCreature = dataset.manifest.creatures.find(
        (candidate) => candidate.id === creature.id
      );
      const publicImagePaths = new Set<string>();

      if (manifestCreature) {
        publicImagePaths.add(manifestCreature.webImage);
      }
      for (const photo of photos) {
        publicImagePaths.add(photo.files.full);
        publicImagePaths.add(photo.files.card);
        publicImagePaths.add(photo.files.thumbnail);
      }

      return {
        creature,
        defaultPhoto,
        photos,
        observations,
        history,
        publicImagePaths: [...publicImagePaths]
      };
    })
    .sort((a, b) =>
      a.creature.dripdexNumber.localeCompare(b.creature.dripdexNumber)
    );
}

function createFixtureRecords() {
  return resolvePageFixtureRecords(pageFixtureDataset);
}

function createDraftRecord(
  source: ResolvedFixtureCreature,
  overrides: {
    id: string;
    dripdexNumber: string;
    commonName: string;
    scientificName: string;
  }
): ResolvedFixtureCreature {
  const draftRecord = structuredClone(source);

  draftRecord.creature.id = overrides.id;
  draftRecord.creature.dripdexNumber = overrides.dripdexNumber;
  draftRecord.creature.commonName = overrides.commonName;
  draftRecord.creature.scientificName = overrides.scientificName;
  draftRecord.creature.status = "draft";
  draftRecord.creature.displayName = {
    generatedNickname: overrides.commonName,
    customName: null
  };

  return draftRecord;
}

export function createCollectionPageViewModel(): CollectionViewModel {
  const records = createFixtureRecords();
  const draftRecords = collectionViewFixture.draftCards.map((draftCard) => {
    const sourceDraftRecord =
      records.find((record) => record.creature.id === draftCard.sourceCreatureId) ??
      records[0];

    return createDraftRecord(sourceDraftRecord, draftCard);
  });
  const checklistCreatureIds = records
    .filter((record) => record.creature.status === "published")
    .map((record) => record.creature.id);

  return buildCollectionViewModel([...records, ...draftRecords], {
    checklistCreatureIds,
    favoriteCreatureIds: collectionViewFixture.favoriteCreatureIds,
    newCreatureIds: collectionViewFixture.newCreatureIds,
    lockedCards: collectionViewFixture.lockedCards as readonly LockedCollectionCardInput[]
  });
}
