# CLAUDE.md

## Overview

This is the public Typhon lab library -- a static file repository that the Typhon MCP server fetches CTF labs from. The build pipeline turns lab source directories into a deployable static site.

## Commands

- `npm run build` -- generates dist/ from labs/ (index.json, typhon-library.json, checksums.json, per-lab files)
- `npm run validate` -- validates all labs in labs/ against Zod schemas, checks structure
- `npm run serve` -- serves dist/ on localhost:3456 for local development testing

To test locally with Typhon, run `npm run build && npm run serve`, then add `http://localhost:3456` as a library in the Typhon MCP server.

## Lab Structure

Each lab lives in `labs/{id}/` where the ID matches `^[a-z]+-\d{2}-[a-z0-9-]+$`.

```
labs/{id}/
  lab.json          # Full metadata (LabMetadataSchema)
  hints.json        # Tiered hints (HintsFileSchema)
  src/
    docker-compose.yml   # Required, uses TYPHON_* env vars
    Dockerfile           # Optional
    app/                 # Application code
    db/                  # DB init scripts (optional)
```

The build script packages `src/` into `package.tar.gz`. Files named with `.example` extension (in `_template/`) are ignored by the build.

## Schemas

`schemas.ts` contains Zod schemas copied from the Typhon MCP server at `typhon/src/labs/schema.ts`. When Typhon updates its schemas, this file must be updated to match.

## Build Output

The dist/ directory matches the Typhon Library API v1 spec:

```
dist/
  typhon-library.json
  index.json
  checksums.json
  labs/{id}/lab.json
  labs/{id}/hints.json
  labs/{id}/package.tar.gz
```

index.json strips flags, briefings, and objectives from lab metadata (public-safe summary only).

## Key Files

- `schemas.ts` -- Zod schemas (keep in sync with Typhon)
- `scripts/build.ts` -- build pipeline
- `scripts/validate.ts` -- validation script
- `scripts/serve.ts` -- local dev server
- `labs/_template/` -- template files for new labs (uses .example extension)
- `.github/workflows/deploy.yml` -- GitHub Actions deployment to GitHub Pages
