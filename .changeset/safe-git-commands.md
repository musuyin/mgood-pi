---
"@mgood-pi/git": major
"@mgood-pi/plugin-git": major
---

**Breaking:** `/mgood:git-commit [constraints]` now permits best-effort semantic whole-file grouping only when the index is clean and candidates are unstaged/untracked. It does not require absolute semantic proof but avoids obviously unrelated files; staged/mixed and risk hard stops remain, and ambiguous remainder paths stay uncommitted rather than receiving a default consolidate commit. Conventional project PNG resources are ordinary exact-path candidates: when reasonably related by their path, name, and repository role, they may be committed with source, Markdown, configuration, lockfile, or other project files instead of stopping solely because they are binary. The hidden `mgood-git-commit` custom-message contract, exact-path execution, silent short-SHA/message success, no preview/second confirmation, and independent configured-upstream push contract remain unchanged. The plugin does not perform provider planning, deterministic batching, or direct commit execution; `@mgood-pi/git` continues to expose no commit-only APIs.
