import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const npmStagePackage = "npm@12.2.0";
const workspaceDirectories = [
  "packages/core",
  "packages/git",
  "plugins/plan",
  "plugins/market",
  "plugins/git",
];

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: -1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}

function runStageCommand(args) {
  return run("npx", ["--yes", npmStagePackage, "stage", ...args]);
}

async function loadWorkspaces() {
  return Promise.all(
    workspaceDirectories.map(async (directory) => {
      const manifest = JSON.parse(
        await readFile(path.join(repositoryRoot, directory, "package.json"), "utf8"),
      );
      if (manifest.private) return null;
      return {
        directory,
        name: manifest.name,
        version: manifest.version,
        dependencies: manifest.dependencies ?? {},
      };
    }),
  );
}

async function isPublic(workspace) {
  const result = await run("npm", [
    "view",
    `${workspace.name}@${workspace.version}`,
    "version",
    "--registry=https://registry.npmjs.org",
  ]);
  if (result.code === 0) return true;
  if (/\bE404\b/u.test(result.stderr)) return false;
  throw new Error(
    `Could not determine whether ${workspace.name}@${workspace.version} is public.\n${result.stderr}`,
  );
}

async function loadStagedVersions() {
  const result = await runStageCommand(["list", "--json"]);
  if (result.code !== 0) throw new Error(`Could not list staged packages.\n${result.stderr}`);
  return new Set(JSON.parse(result.stdout).map((item) => `${item.packageName}@${item.version}`));
}

function assertDependenciesAreReady(workspace, workspaces, readyVersions) {
  for (const [name, range] of Object.entries(workspace.dependencies)) {
    const dependency = workspaces.find((candidate) => candidate.name === name);
    if (!dependency || range !== `^${dependency.version}`) continue;
    const version = `${dependency.name}@${dependency.version}`;
    if (!readyVersions.has(version)) {
      throw new Error(
        `Cannot stage ${workspace.name}@${workspace.version}: internal dependency ${version} is neither public nor staged.`,
      );
    }
  }
}

async function main() {
  const workspaces = (await loadWorkspaces()).filter(Boolean);
  const publicVersions = new Set();
  for (const workspace of workspaces) {
    if (await isPublic(workspace)) publicVersions.add(`${workspace.name}@${workspace.version}`);
  }

  const stagedVersions = await loadStagedVersions();
  const readyVersions = new Set([...publicVersions, ...stagedVersions]);
  for (const workspace of workspaces) {
    const version = `${workspace.name}@${workspace.version}`;
    if (publicVersions.has(version)) {
      console.log(`Skipping public ${version}.`);
      continue;
    }
    if (stagedVersions.has(version)) {
      console.log(`Skipping already staged ${version}.`);
      continue;
    }

    assertDependenciesAreReady(workspace, workspaces, readyVersions);
    console.log(`Staging ${version}.`);
    const result = await runStageCommand([
      "publish",
      `--workspace=${workspace.name}`,
      "--access=public",
      "--provenance",
    ]);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.code !== 0) throw new Error(`Failed to stage ${version}.`);
    stagedVersions.add(version);
    readyVersions.add(version);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
