import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceDirectories = [
  "packages/core",
  "packages/git",
  "plugins/plan",
  "plugins/git",
  "plugins/market",
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

async function loadWorkspaces() {
  return Promise.all(
    workspaceDirectories.map(async (directory) => {
      const manifest = JSON.parse(
        await readFile(path.join(repositoryRoot, directory, "package.json"), "utf8"),
      );
      if (manifest.private) return null;
      return { directory, name: manifest.name, version: manifest.version };
    }),
  );
}

async function isPublished(workspace) {
  const result = await run("npm", [
    "view",
    `${workspace.name}@${workspace.version}`,
    "version",
    "--registry=https://registry.npmjs.org",
  ]);
  if (result.code === 0) return true;
  if (/\bE404\b/u.test(result.stderr)) return false;
  throw new Error(
    `Could not determine whether ${workspace.name}@${workspace.version} is already published.\n${result.stderr}`,
  );
}

async function main() {
  const workspaces = (await loadWorkspaces()).filter(Boolean);
  for (const workspace of workspaces) {
    if (await isPublished(workspace)) {
      console.log(`Skipping published ${workspace.name}@${workspace.version}.`);
      continue;
    }

    console.log(`Staging ${workspace.name}@${workspace.version}.`);
    const result = await run("npm", [
      "stage",
      "publish",
      `--workspace=${workspace.name}`,
      "--access=public",
      "--provenance",
    ]);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.code !== 0) {
      throw new Error(`Failed to stage ${workspace.name}@${workspace.version}.`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
