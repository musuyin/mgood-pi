# ADR 0001: Use TypeScript npm workspaces for the plugin kit

- **Status:** accepted
- **Date:** 2026-09-18

## Context

Pi extensions are TypeScript modules and Pi packages are distributed through npm or Git. The kit needs shared contracts plus independently installable feature plugins.

## Decision

Use an ESM TypeScript monorepo managed by npm workspaces. Keep framework-neutral code in `packages/*` and thin Pi adapters in `plugins/*`. Use strict compiler settings and Node.js 22+.

Version and publish each non-private workspace package independently with Changesets. Plugins remain separately installable Pi packages even though development, validation, and release automation stay in this repository.

A Go implementation is permitted only as an approved, separately buildable optional helper service with a versioned process boundary.

## Alternatives considered

- **Plain JavaScript:** lower initial ceremony, but weaker contracts for extension lifecycle, MCP configuration, Git state, and storage migrations.
- **Go-first:** appropriate for selected native services, but adds an unnecessary process/build/distribution boundary for Pi extension integration.
- **Independent repositories from day one:** would create release and contract overhead before feature boundaries are proven.

## Consequences

- Plugin code receives Pi API types and can be run directly from `.ts` source by Pi.
- Shared contracts can evolve with type-checked workspace consumers.
- npm lockfile and workspace tooling are repository requirements.
- Each publishable package needs public npm metadata, an explicit file allowlist, and a package README.
- Changesets creates a Release PR and publishes only versioned packages after that PR merges.
- Future packages must satisfy the split criteria in `AGENTS.md` before moving out of this monorepo.
