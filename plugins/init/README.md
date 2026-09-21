# @mgood-pi/plugin-init

Pi extension that provides a safe preview of the `mgood-pi` project bootstrap layout and a curated plugin installer.

## Install

```bash
pi install npm:@mgood-pi/plugin-init
```

## Use

Start Pi in a target project, then run:

```text
/mgood:init
```

The current command only displays planned files. It does not write project files, start subprocesses, access Git, use the network, or persist data.

### Plugin catalog

Run the following in an interactive Pi session:

```text
/mgood:plugins
```

The catalog is curated by this package and displays each plugin's exact pinned npm source and capabilities. You choose global or project-local scope, then explicitly confirm before this extension runs `pi install` with direct argument values (never through a shell). Installing a Pi package grants it full system access; install only packages you trust.

For non-interactive runs, the command prints the catalog and a copyable manual install command instead of installing anything.

## Compatibility

- Node.js 22+
- Pi 0.84.2+

For repository development and release instructions, see the root [README](../../README.md) and [release guide](../../docs/releasing.md).
