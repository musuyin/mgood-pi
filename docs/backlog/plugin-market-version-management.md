---
title: Plugin Market Version and Update Management
state: parked
created: 2026-09-23
updated: 2026-09-23
priority: after-market-install-smoke-tests
---

# Plugin Market Version and Update Management

## Idea

Extend `@mgood-pi/plugin-market` from an explicit curated installer into a transparent update-management surface. It should help users understand which `mgood-pi` plugins are installed, which catalog version is available, which installation scope owns each package, and what update command would run.

This is **not** an implementation plan and must not change current `/mgood:market` behavior. Today, the market only installs a selected, version-pinned catalog entry after explicit confirmation.

## Desired experience

1. Show curated catalog entries with their pinned package sources and declared capabilities.
2. Detect relevant installed Pi package entries in global and project settings.
3. Present an understandable state for each entry:
   - not installed;
   - installed globally;
   - installed for this project;
   - installed version matches catalog;
   - catalog update available;
   - installed source is unmanaged, non-npm, malformed, or cannot be compared.
4. Before changing anything, show the exact resulting Pi command and the settings scope that will be changed.
5. Require explicit confirmation for every install, upgrade, downgrade, scope change, or removal.
6. Keep non-interactive mode read-only: print status and copyable commands; never update automatically.

Potential future commands or Market views:

```text
/mgood:market
/mgood:market status
/mgood:market update
/mgood:market update plan
```

The final command grammar must be validated against Pi's command parsing and must not shadow built-ins.

## Version policy questions

- Should the catalog pin exact versions, compatible ranges, or release channels such as stable/beta?
- Is the catalog version authoritative for packages installed through Market, or merely a recommended version?
- How should a user intentionally remain on an older version without repeated update prompts?
- How should prereleases, yanked npm versions, unavailable registry versions, and dependency compatibility be displayed?
- Should Market use `pi install npm:<package>@<version>` consistently, or invoke Pi's single-package `pi update` when the existing source is unpinned?
- What is the downgrade policy when the catalog version is older than a user-installed version?

## Safety and security constraints

- Keep the catalog curated, source-visible, and version-visible. Do not turn Market into a general arbitrary-package installer.
- Never auto-update on startup, session start, catalog load, or background timer.
- Compare metadata before executing an update; do not infer an installed package's version solely from a directory name.
- Use Pi's documented settings/package model and direct subprocess argument arrays. Never construct shell commands from source strings.
- Treat settings files, npm metadata, and package manifests as untrusted input; validate schemas and redact diagnostics.
- Preserve user choice of global versus project scope. Clearly explain precedence when the same package exists in both scopes.
- Warn that Pi packages execute with full local-user privileges and display changed capability declarations before an upgrade if catalog metadata changed.

## Likely implementation boundary

The feature belongs primarily in the existing Market capability, with parsing/comparison contracts factored out only when another plugin needs them:

```text
packages/core/           # catalog entry and version/status contracts, if broadly reusable
plugins/market/          # settings inspection, UI, confirmation, Pi CLI invocation
plugins/market tests     # settings/source parsing, comparison, command-preview, approval gates
```

Do not add a registry client, background daemon, remote catalog, telemetry, or automatic update scheduler as part of the first slice.

## Local development workflow (current, no implementation required)

For unpublished local development, install the package directory by path rather than through npm:

```bash
# Global local reference
pi install /absolute/path/to/mgood-pi/plugins/market

# Project-local local reference
pi install -l /absolute/path/to/mgood-pi/plugins/market
```

Pi stores a local path as a reference and does not copy the directory. After editing source, restart Pi to reload the package from that same path. For a one-off run without changing settings, use:

```bash
pi -e /absolute/path/to/mgood-pi/plugins/market
```

When package dependencies or generated artifacts change, first run the repository checks/build as appropriate. Local-path development is not npm publication and does not require a version bump.

## Promotion criteria

Do not implement until all of the following are true:

- `/mgood:market` has been manually smoke-tested for global and project-local installation;
- the package catalog contains at least two independently released plugins or there is a concrete status-comparison use case;
- Pi settings/source formats used for inspection are confirmed against the installed Pi version;
- a precise upgrade/downgrade and pinned-version policy has been decided and documented;
- the required settings read/write and package-update operations have tests for confirmation, cancellation, malformed settings, scope precedence, and command argument safety.

When ready, use `/mgood-pi:plan` with this backlog entry as context; revalidate Pi APIs and npm behavior instead of treating this note as executable.
