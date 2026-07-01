import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const defaultEnvFile = ".env.local";
const defaultExampleFile = ".env.example";
const defaultEnvironment = "production";

export function parseDotenvContent(content) {
  const values = new Map();

  for (const [lineIndex, rawLine] of content.split(/\r?\n/u).entries()) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();

    if (!/^[A-Z0-9_]+$/u.test(key)) {
      throw new Error(`Unsupported dotenv key on line ${lineIndex + 1}.`);
    }

    values.set(key, parseDotenvValue(rawValue, lineIndex + 1));
  }

  return values;
}

export function parseExampleKeys(content) {
  return Array.from(parseDotenvContent(content).keys());
}

export function createSyncPlan(exampleKeys, localValues, existingNames) {
  return exampleKeys.flatMap((name) => {
    const value = localValues.get(name);

    if (!value) {
      return [];
    }

    return [
      {
        action: existingNames.has(name) ? "update" : "add",
        name,
        sensitive: true
      }
    ];
  });
}

export function createVercelEnvArgs({ action, environment, name, sensitive }) {
  return [
    "env",
    action,
    name,
    environment,
    "--yes",
    ...(sensitive ? ["--sensitive"] : [])
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2));
}

function main(args) {
  const options = parseArgs(args);
  const exampleContent = readRequiredFile(options.exampleFile);
  const envContent = readRequiredFile(options.envFile);
  const exampleKeys = parseExampleKeys(exampleContent);
  const localValues = parseDotenvContent(envContent);
  const populatedNames = exampleKeys.filter((name) => localValues.get(name));

  if (populatedNames.length === 0) {
    console.log(`No populated ${options.envFile} values matched ${options.exampleFile}.`);
    return;
  }

  if (!options.apply) {
    console.log(`Dry run for Vercel ${options.environment} env sync from ${options.envFile}:`);

    for (const name of populatedNames) {
      console.log(`- ${name}`);
    }

    console.log("No values were printed or sent. Re-run with --apply to add/update Vercel env vars.");
    return;
  }

  const projectLink = readVercelProjectLink();
  requireProjectConfirmation(options.confirmProject, projectLink);
  console.log(
    `Sync target: Vercel project ${projectLink.projectId} in org/team ${projectLink.orgId}.`
  );

  const existingNames = readExistingVercelEnvNames(options.environment, exampleKeys);
  const plan = createSyncPlan(exampleKeys, localValues, existingNames);

  for (const item of plan) {
    syncVercelEnvValue({
      action: item.action,
      environment: options.environment,
      name: item.name,
      sensitive: item.sensitive,
      value: localValues.get(item.name)
    });
    console.log(`${item.action === "add" ? "Added" : "Updated"} ${item.name} in Vercel ${options.environment}.`);
  }

  console.log("Vercel env changes apply only to new deployments. Redeploy production when ready.");
}

function parseArgs(args) {
  const options = {
    apply: false,
    confirmProject: null,
    envFile: defaultEnvFile,
    environment: defaultEnvironment,
    exampleFile: defaultExampleFile
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--env-file") {
      options.envFile = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--confirm-project") {
      options.confirmProject = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--example-file") {
      options.exampleFile = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--environment") {
      options.environment = requireValue(args, index, arg);
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function readRequiredFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing required file: ${path}`);
  }

  return readFileSync(path, "utf8");
}

function readExistingVercelEnvNames(environment, allowedNames) {
  const result = spawnSync("vercel", ["env", "ls", environment], {
    encoding: "utf8"
  });

  if (result.error) {
    throw new Error("Unable to run Vercel CLI. Install it and run vercel login first.");
  }

  if (result.status !== 0) {
    throw new Error("Unable to list Vercel environment variables. Run vercel link and vercel login first.");
  }

  return new Set(
    allowedNames.filter((name) => new RegExp(`(^|\\s)${escapeRegExp(name)}(\\s|$)`, "u").test(result.stdout))
  );
}

export function syncVercelEnvValue({
  action,
  environment,
  name,
  sensitive,
  spawn = spawnSync,
  value
}) {
  const result = spawn("vercel", createVercelEnvArgs({ action, environment, name, sensitive }), {
    encoding: "utf8",
    input: value,
    stdio: ["pipe", "pipe", "pipe"]
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Unable to ${action} Vercel environment variable ${name}.`);
  }
}

function requireValue(args, index, flag) {
  const value = args[index + 1];

  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function readVercelProjectLink() {
  const path = ".vercel/project.json";

  if (!existsSync(path)) {
    throw new Error("Missing .vercel/project.json. Run vercel link before applying env changes.");
  }

  const parsed = JSON.parse(readFileSync(path, "utf8"));

  if (!parsed || typeof parsed.orgId !== "string" || typeof parsed.projectId !== "string") {
    throw new Error("Unable to read Vercel project link. Run vercel link again before applying env changes.");
  }

  return {
    orgId: parsed.orgId,
    projectId: parsed.projectId
  };
}

export function requireProjectConfirmation(confirmProject, projectLink) {
  if (confirmProject !== projectLink.projectId) {
    throw new Error(
      `Refusing to apply without --confirm-project ${projectLink.projectId}. ` +
        "Run the dry run, verify the linked Vercel project, then pass that exact project id."
    );
  }
}

function parseDotenvValue(rawValue, lineNumber) {
  if (rawValue.startsWith("\"") || rawValue.startsWith("'")) {
    return parseQuotedDotenvValue(rawValue, lineNumber);
  }

  if (rawValue.includes("#")) {
    throw new Error(`Unsupported inline comment on line ${lineNumber}. Put comments on their own line.`);
  }

  return rawValue;
}

function parseQuotedDotenvValue(rawValue, lineNumber) {
  const quote = rawValue.at(0);

  if (!rawValue.endsWith(quote) || rawValue.length === 1) {
    throw new Error(`Unsupported unterminated quoted value on line ${lineNumber}.`);
  }

  const innerValue = rawValue.slice(1, -1);

  if (innerValue.includes(quote) || innerValue.includes("\\n") || innerValue.includes("\\r")) {
    throw new Error(`Unsupported quoted value syntax on line ${lineNumber}.`);
  }

  return innerValue;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function printHelp() {
  console.log(`Usage: npm run vercel:env:sync -- [--apply] [--confirm-project <project-id>] [--env-file .env.local] [--environment production]

Dry-run mode is the default and prints env var names only.
Use --apply with --confirm-project after reviewing the names and linked Vercel project.
Values are added or updated as sensitive Vercel env vars through stdin and are never printed by this script.`);
}
