# @mgood-pi/plugin-market

Pi extension that provides the `mgood-pi` curated plugin marketplace plus a safe project bootstrap preview.

## Install

```bash
pi install npm:@mgood-pi/plugin-market
```

## Use

Start Pi in a target project, then run the marketplace command in an interactive Pi session:

```text
/mgood:market
```

The catalog is curated by this package and displays each plugin's exact pinned npm source and capabilities. You choose global or project-local scope, then explicitly confirm before this extension runs `pi install` with direct argument values (never through a shell). Installing a Pi package grants it full system access; install only packages you trust.

For non-interactive runs, the command prints the catalog and a copyable manual install command instead of installing anything.

### Bootstrap preview

```text
/mgood:init
```

This companion command only displays planned project bootstrap files. It does not write project files, start subprocesses, access Git, use the network, or persist data.

## Compatibility

- Node.js 22+
- Pi 0.84.2+

For repository development and release instructions, see the root [README](../../README.md) and [release guide](../../docs/releasing.md).
