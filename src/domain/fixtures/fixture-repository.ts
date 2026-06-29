import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, join, normalize } from "node:path";

import {
  type Creature,
  type FixtureDataset,
  type History,
  type Observation,
  type Photo,
  validateFixtureDataset
} from "./fixture-schemas";

export type FixtureRepositoryOptions = {
  metadataRoot?: string;
  projectRoot?: string;
};

export type ResolvedFixtureCreature = {
  creature: Creature;
  defaultPhoto: Photo;
  photos: Photo[];
  observations: Observation[];
  history: History;
  publicImagePaths: string[];
};

export type FixtureRepository = {
  listCreatures: () => ResolvedFixtureCreature[];
  getCreatureById: (id: string) => ResolvedFixtureCreature | null;
  getCreatureByDripdexNumber: (
    dripdexNumber: string
  ) => ResolvedFixtureCreature | null;
};

const defaultMetadataPath = "docs/fixtures/metadata";
const publicImageRoot = "docs/fixtures/web-images";
const syntheticExifRoot = "tests/fixtures/exif";

type FixtureRepositoryIndex = {
  photosById: Map<string, Photo>;
  observationsById: Map<string, Observation>;
  historiesById: Map<string, History>;
};

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsonDirectory(directory: string): unknown[] {
  return readdirSync(directory)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => readJsonFile(join(directory, fileName)));
}

function resolveMetadataRoot(options: Required<FixtureRepositoryOptions>): string {
  if (isAbsolute(options.metadataRoot)) {
    return options.metadataRoot;
  }

  return join(options.projectRoot, options.metadataRoot);
}

function readFixtureDataset(metadataRoot: string): unknown {
  return {
    manifest: readJsonFile(join(metadataRoot, "fixture-manifest.json")),
    creatures: readJsonDirectory(join(metadataRoot, "creatures")),
    photos: readJsonDirectory(join(metadataRoot, "photos")),
    observations: readJsonDirectory(join(metadataRoot, "observations")),
    histories: readJsonDirectory(join(metadataRoot, "history"))
  };
}

function assertPublicImagePath(projectRoot: string, publicImagePath: string) {
  const normalizedPath = normalize(publicImagePath);

  if (
    isAbsolute(publicImagePath) ||
    normalizedPath.startsWith("..") ||
    !normalizedPath.startsWith(`${publicImageRoot}/`) ||
    normalizedPath.startsWith(`${syntheticExifRoot}/`)
  ) {
    throw new Error(`Public image path is not a safe web fixture: ${publicImagePath}`);
  }

  if (!existsSync(join(projectRoot, normalizedPath))) {
    throw new Error(`Public image path does not exist: ${publicImagePath}`);
  }
}

function createIndexById<TRecord extends { id: string }>(records: TRecord[]) {
  return new Map(records.map((record) => [record.id, record]));
}

function findDuplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function createFixtureRepositoryIndex(dataset: FixtureDataset): FixtureRepositoryIndex {
  return {
    photosById: createIndexById(dataset.photos),
    observationsById: createIndexById(dataset.observations),
    historiesById: createIndexById(dataset.histories)
  };
}

function assertUniqueDripdexNumbers(creatures: Creature[]) {
  const duplicates = findDuplicateValues(
    creatures.map((creature) => creature.dripdexNumber)
  );

  if (duplicates.length > 0) {
    throw new Error(`Duplicate DripDex number ${duplicates.join(", ")}`);
  }
}

function collectPublicImagePaths(
  dataset: FixtureDataset,
  index: FixtureRepositoryIndex,
  creature: Creature
) {
  const manifestCreature = dataset.manifest.creatures.find(
    (candidate) => candidate.id === creature.id
  );
  const paths = new Set<string>();

  if (manifestCreature) {
    paths.add(manifestCreature.webImage);
  }

  for (const photoId of creature.photoIds) {
    const photo = index.photosById.get(photoId);

    if (photo) {
      paths.add(photo.files.full);
      paths.add(photo.files.card);
      paths.add(photo.files.thumbnail);
    }
  }

  return [...paths];
}

function resolveCreature(
  dataset: FixtureDataset,
  index: FixtureRepositoryIndex,
  projectRoot: string,
  creature: Creature
): ResolvedFixtureCreature {
  const defaultPhoto = index.photosById.get(creature.defaultPhotoId);
  const history = index.historiesById.get(creature.historyId);

  if (!defaultPhoto) {
    throw new Error(`Fixture creature ${creature.id} is missing its default photo`);
  }

  if (!history) {
    throw new Error(`Fixture creature ${creature.id} is missing its history`);
  }

  const photos = creature.photoIds.map((photoId) => {
    const photo = index.photosById.get(photoId);

    if (!photo) {
      throw new Error(`Fixture creature ${creature.id} is missing photo ${photoId}`);
    }

    return photo;
  });
  const observations = creature.observationIds.map((observationId) => {
    const observation = index.observationsById.get(observationId);

    if (!observation) {
      throw new Error(
        `Fixture creature ${creature.id} is missing observation ${observationId}`
      );
    }

    return observation;
  });
  const publicImagePaths = collectPublicImagePaths(dataset, index, creature);

  for (const publicImagePath of publicImagePaths) {
    assertPublicImagePath(projectRoot, publicImagePath);
  }

  return {
    creature,
    defaultPhoto,
    photos,
    observations,
    history,
    publicImagePaths
  };
}

function copyResolvedCreature(record: ResolvedFixtureCreature): ResolvedFixtureCreature {
  return structuredClone(record);
}

export function createFixtureRepository(
  options: FixtureRepositoryOptions = {}
): FixtureRepository {
  const resolvedOptions = {
    metadataRoot: options.metadataRoot ?? defaultMetadataPath,
    projectRoot: options.projectRoot ?? process.cwd()
  };
  const metadataRoot = resolveMetadataRoot(resolvedOptions);
  const validationResult = validateFixtureDataset(readFixtureDataset(metadataRoot));

  if (!validationResult.success) {
    throw new Error(
      `Fixture dataset failed validation:\n${validationResult.errors.join("\n")}`
    );
  }

  assertUniqueDripdexNumbers(validationResult.data.creatures);

  const index = createFixtureRepositoryIndex(validationResult.data);
  const creatures = validationResult.data.creatures
    .map((creature) =>
      resolveCreature(
        validationResult.data,
        index,
        resolvedOptions.projectRoot,
        creature
      )
    )
    .sort((a, b) =>
      a.creature.dripdexNumber.localeCompare(b.creature.dripdexNumber)
    );
  const creaturesById = new Map(
    creatures.map((record) => [record.creature.id, record])
  );
  const creaturesByDripdexNumber = new Map(
    creatures.map((record) => [record.creature.dripdexNumber, record])
  );

  return {
    listCreatures() {
      return creatures.map(copyResolvedCreature);
    },
    getCreatureById(id) {
      const record = creaturesById.get(id);

      return record ? copyResolvedCreature(record) : null;
    },
    getCreatureByDripdexNumber(dripdexNumber) {
      const record = creaturesByDripdexNumber.get(dripdexNumber);

      return record ? copyResolvedCreature(record) : null;
    }
  };
}
