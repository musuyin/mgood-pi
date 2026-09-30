# Safe Git Commands (v8 in progress)

> **Status:** Work Plan 008 is approved. Code, unit/regression tests, builds, and package dry runs are in progress. Real Pi TUI and disposable-repository acceptance, isolated installation/load/command smoke tests, and an independent review are not yet recorded. Do not treat this feature as released or accepted. Historical blocked and pending states from WP002–WP007 remain unchanged.

The feature consists of `@mgood-pi/git`, an independent configured-upstream push-safety core, and `@mgood-pi/plugin-git`, the Pi adapter. After publication, users install only the plugin:

```bash
pi install npm:@mgood-pi/plugin-git
pi install -l npm:@mgood-pi/plugin-git # project-local
```

It requires Node.js 22+, Git, a Pi version compatible with 0.84.2, and an interactive TUI. The current Agent must be idle.

## Commands

```text
/mgood:git-commit [natural-language constraints]
/mgood:git-commit-push [natural-language constraints]
/mgood:git-commit-push-pr [natural-language constraints]
```

There are no legacy aliases or model-callable Git write tools.

### One-command commit

`/mgood:git-commit` is a thin launcher. In an idle TUI it reads a bundled Markdown prompt, inserts any optional argument as plain-text guidance, and sends exactly one hidden Pi custom message with `customType: "mgood-git-commit"` and `triggerTurn: true`. Invocation authorizes the current Agent to make commits in the current worktree. The plugin does not inspect the repository, call a provider, display a plan or confirmation, stage files, commit, or push.

The Agent quietly evaluates status, diffs, related untracked files, recent history, and relevant files. With a clean index and only unstaged or untracked whole-file candidates, it may create coherent Conventional Commit groups using implementation semantics. It must avoid obviously unrelated paths. Existing staged or mixed state, uncertain scope, submodules or nested repositories, obvious secrets or private keys, and unrecognized, unsafe, or generated content are hard stops. It uses exact-path staging, rechecks drift before each commit, and never uses broad staging, destructive commands, automatic hunk staging, history rewriting, automatic rollback, retry, or push.

The normal result is only short commit SHAs, messages, and a concise completion state. Failures or partial work report the completed commits, failure stage, and a final `git status --short` summary. This is a behavioral prompt contract, not a technical capability sandbox.

### Confirmed commit-and-push commands

`/mgood:git-commit-push` and `/mgood:git-commit-push-pr` show one explicit TUI confirmation before injecting their hidden current-Agent prompts. They authorize a safe inspection, an automatically created descriptive feature branch when the current branch is protected, exact-path Conventional Commits, and a push only to that non-protected branch. The PR variant then runs one `gh pr create`.

The commands never push to `main`, `master`, `dev`, or `develop` (case-insensitive), force push, merge, alter Git configuration, delete refs, rewrite history, roll back automatically, or retry automatically. Protected branches may be PR bases but not push targets. If no repository naming convention is available, the Agent uses `<type>/<short-lowercase-kebab-case-summary>`, such as `feat/git-commit-workflow`.

## Data, permissions, and recovery

Loading the plugin starts no Git, network, timer, watcher, or background process. Each command reads its prompt and injects one message only when invoked. Push-capable commands require one confirmation. External systems such as hooks, GitHub CLI, transports, and server policy remain outside the plugin's sandbox; failures stop the workflow without automatic recovery.

See the [command contract](../../plugin-contracts/git-commands.md), [security review](../../security/git-commands.md), and [ADR 0008](../../adr/0008-one-click-agent-commits.md).

## Manual acceptance

Use only an authorized disposable repository and local bare remote, never the development checkout or a live remote. Before release, record the Pi version, TTY/model, redacted session transcript, and Git evidence before and after: semantic commit grouping and quiet success, no-change, staged or mixed safe stops, drift, hook partial success, narrow terminal behavior, no automatic push from commit, confirmed feature-branch commit-push, and confirmed commit-push-PR. Mocks and unit tests do not replace this evidence.
