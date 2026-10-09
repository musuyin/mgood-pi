# @mgood-pi/plan

A focused Plan mode for Pi. `/mgood-pi:plan` turns an initial request into one implementation-ready Markdown plan after clarifying requirements and investigating the repository.

## Install

```bash
pi install npm:@mgood-pi/plan
```

For local development:

```bash
pi -e ./plugins/plan
```

## Use

```text
/mgood-pi:plan Add retry handling to outbound requests
```

In TUI mode, `/mgood-pi:plan` with no argument asks for the initial request. In print, JSON, or RPC mode, provide the request as an argument.

The agent will:

1. restate its understanding;
2. ask focused follow-up questions about material ambiguities;
3. confirm requirements, non-goals, decisions, and assumptions;
4. inspect relevant repository evidence;
5. create exactly one descriptive file such as `tmp/plans/add-retry-handling.md`.

The resulting file has no required schema or frontmatter. It contains the objective, scope, decisions, current implementation evidence, concrete implementation steps, verification, risks, and objective acceptance criteria as relevant.

## Boundaries and data

The extension injects private bundled guidance as a hidden custom session message. That message and the request remain in Pi's session/model context and may be retained in local session data or exports.

The guidance permits only one write: a new Markdown file directly under `tmp/plans/`. It prohibits implementation, review artifacts, execution state, Git changes, dependency changes, and overwriting an existing plan. These are model instructions, not an operating-system sandbox; users should review the generated plan before acting on it.

The extension starts no timers, watchers, subprocesses, or network connections. It does not read existing plans, resume work, implement a plan, or delete files. Uninstalling the package does not remove plans already created under `tmp/plans/`.

## Compatibility

- Node.js 22+
- Pi 0.84.2+

See the [Plan feature documentation](../../docs/features/plan/README.md) and root [release guide](../../docs/releasing.md).
