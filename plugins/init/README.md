# @mgood-pi/plugin-init

Pi extension that registers `/mgood:init`, a safe preview of the `mgood-pi` project bootstrap layout.

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

## Compatibility

- Node.js 22+
- Pi 0.84.2+

For repository development and release instructions, see the root [README](../../README.md) and [release guide](../../docs/releasing.md).
