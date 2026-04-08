# Typhon Lab Library

The default lab library for the [Typhon](https://github.com/h4ck0rman/typhon) CTF platform. Typhon is an MCP-based server that lets you practice SQL injection (and other web security techniques) through interactive, containerized labs.

This repository is the source for the public lab catalog. It builds to a set of static files served via GitHub Pages, which the Typhon MCP server fetches at runtime.

You can fork this repository to create and host your own lab library.

## How It Works

The Typhon MCP server consumes lab libraries as static file APIs. Each library is a set of JSON files and tarball packages hosted on any static file server. This repository contains the source labs and a build pipeline that produces the correct output structure.

The build pipeline:

1. Scans `labs/` for lab directories
2. Validates each lab against the Typhon schemas
3. Packages each lab's `src/` directory into a `package.tar.gz`
4. Generates `index.json` (public catalog, no flags or briefings)
5. Generates `typhon-library.json` (library manifest)
6. Generates `checksums.json` (SHA-256 hashes of all packages)
7. Outputs everything to `dist/`

The full spec is documented in [typhon/spec/typhon-library-v1.md](https://github.com/h4ck0rman/typhon/blob/main/spec/typhon-library-v1.md).

## Output Structure

After running `npm run build`, the `dist/` directory contains:

```
dist/
  typhon-library.json       # Library manifest (entry point)
  index.json                # Lab catalog (public summaries)
  checksums.json            # SHA-256 hashes of packages
  labs/{lab-id}/
    lab.json                # Full lab metadata (includes flag)
    hints.json              # Tiered hints (levels 1-5)
    package.tar.gz          # Docker source (compose, Dockerfile, app code)
```

## Lab Directory Structure

Each lab lives in `labs/{lab-id}/` and contains:

```
labs/sqli-01-the-leak/
  lab.json                  # Lab metadata (validated against LabMetadataSchema)
  hints.json                # Hints file (validated against HintsFileSchema)
  src/
    docker-compose.yml      # Required -- uses TYPHON_* env vars
    Dockerfile              # Optional -- if building a custom image
    app/                    # Application source code
    db/                     # Database init scripts (optional)
```

The lab ID must match the regex `^[a-z]+-\d{2}-[a-z0-9-]+$` (e.g., `sqli-01-the-leak`).

See `labs/_template/` for example files with placeholder values.

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
git clone https://github.com/h4ck0rman/typhon-library.git
cd typhon-library
npm install
```

### Commands

```bash
npm run validate    # Validate all labs against Typhon schemas
npm run build       # Build dist/ from labs/
npm run serve       # Serve dist/ locally on port 3456
```

## Adding a Lab

1. Create a new directory in `labs/` following the ID format: `{category}-{number}-{slug}`
2. Copy the template files from `labs/_template/` (remove the `.example` extension)
3. Fill in `lab.json` with your lab metadata
4. Fill in `hints.json` with tiered hints (at least 1, up to 5 levels)
5. Build your lab's Docker setup in `src/`
   - `docker-compose.yml` must use the `TYPHON_*` environment variables
   - The app should serve on the port specified in `lab.json`'s `internalPort`
6. Run `npm run validate` to check everything
7. Run `npm run build && npm run serve` to test locally
8. Commit and push to main

### Static Flags

If your lab uses a static flag, it must match the format `TYPHON{...}`. The flag value goes in `lab.json` only -- it is injected into the container via the `TYPHON_FLAG` environment variable at runtime.

### Dynamic Flags

For labs that generate flags per session, set the flag type to `"dynamic"` with a derivation method (`container-env`, `file-read`, or `db-query`). The Typhon MCP server handles generation and injection.

## Testing Locally with Typhon

1. Build and serve the library:
   ```bash
   npm run build
   npm run serve
   ```

2. In the Typhon MCP server, add the local library:
   ```
   add_library http://localhost:3456
   ```

3. The Typhon MCP server will fetch from your local dev server instead of GitHub Pages.

## Forking for Your Own Library

1. Fork this repository
2. Update the `name`, `displayName`, `description`, and `url` fields in `scripts/build.ts` (in the manifest object)
3. Add your own labs to `labs/`
4. Enable GitHub Pages in your fork's settings (deploy from GitHub Actions)
5. Share your library URL with Typhon users

## License

MIT
