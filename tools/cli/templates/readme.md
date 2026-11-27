# My Login Project

A customer project built on the Ping Login Widget (`@forgerock/login-widget`):
an embeddable, framework-agnostic login UI that drives ForgeRock AM
authentication journeys.

## Getting started

```sh
pnpm install
cp .env.example .env    # add your ForgeRock AM connection details
pnpm dev
```

See `ping-lf --help` for the project CLI: it scaffolds custom components
(`ping-lf generate callback|stage <Name>`), and updates the framework files
in place while keeping everything you own (`ping-lf update`).

## Writing custom components

Everything you author lives under `custom/components/`: one directory per
stage or callback component, plus the layout wrappers in
`custom/components/layout/`.

Start from the authoring guide:
[custom/components/README.md](custom/components/README.md)

It covers the curated import surface (`$login-framework`), the documented
props each component receives, and the build-time boundary rules.
