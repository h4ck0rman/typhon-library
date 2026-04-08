/**
 * Build pipeline for the Typhon lab library.
 *
 * Scans labs/ for lab directories, validates them, and produces the
 * dist/ output that matches the Typhon Library API v1 spec.
 *
 * Output structure:
 *   dist/
 *     typhon-library.json
 *     index.json
 *     checksums.json
 *     labs/{lab-id}/
 *       lab.json
 *       hints.json
 *       package.tar.gz
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LabMetadataSchema, HintsFileSchema, LAB_ID_REGEX } from "../schemas.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LABS_DIR = path.join(ROOT, "labs");
const DIST_DIR = path.join(ROOT, "dist");

interface LabSummary {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  difficulty: string;
  description: string;
  tags: string[];
  dbEngine: string;
  author: string;
  version: string;
}

function isLabDirectory(dirName: string): boolean {
  // Skip hidden dirs, _template, and .gitkeep
  if (dirName.startsWith(".") || dirName.startsWith("_")) return false;
  return LAB_ID_REGEX.test(dirName);
}

function sha256(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function main(): void {
  console.log("Building Typhon library...\n");

  // Clean dist/
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(path.join(DIST_DIR, "labs"), { recursive: true });

  // Discover labs
  if (!fs.existsSync(LABS_DIR)) {
    console.log("No labs/ directory found. Creating empty library output.");
    writeEmptyOutput();
    return;
  }

  const entries = fs.readdirSync(LABS_DIR, { withFileTypes: true });
  const labDirs = entries
    .filter((e) => e.isDirectory() && isLabDirectory(e.name))
    .map((e) => e.name)
    .sort();

  if (labDirs.length === 0) {
    console.log("No labs found. Creating empty library output.");
    writeEmptyOutput();
    return;
  }

  console.log(`Found ${labDirs.length} lab(s): ${labDirs.join(", ")}\n`);

  const index: LabSummary[] = [];
  const checksums: Record<string, string> = {};
  const categories = new Set<string>();
  let errors = 0;

  for (const labId of labDirs) {
    const labDir = path.join(LABS_DIR, labId);
    const labJsonPath = path.join(labDir, "lab.json");
    const hintsJsonPath = path.join(labDir, "hints.json");
    const srcDir = path.join(labDir, "src");

    // Check required files exist
    if (!fs.existsSync(labJsonPath)) {
      console.error(`[SKIP] ${labId}: missing lab.json`);
      errors++;
      continue;
    }
    if (!fs.existsSync(hintsJsonPath)) {
      console.error(`[SKIP] ${labId}: missing hints.json`);
      errors++;
      continue;
    }
    if (!fs.existsSync(srcDir)) {
      console.error(`[SKIP] ${labId}: missing src/ directory`);
      errors++;
      continue;
    }
    if (!fs.existsSync(path.join(srcDir, "docker-compose.yml"))) {
      console.error(`[SKIP] ${labId}: missing src/docker-compose.yml`);
      errors++;
      continue;
    }

    // Parse and validate lab.json
    let labData;
    try {
      const raw = JSON.parse(fs.readFileSync(labJsonPath, "utf-8"));
      labData = LabMetadataSchema.parse(raw);
    } catch (err) {
      console.error(`[SKIP] ${labId}: invalid lab.json -- ${err}`);
      errors++;
      continue;
    }

    // Verify lab ID matches directory name
    if (labData.id !== labId) {
      console.error(
        `[SKIP] ${labId}: lab.json id "${labData.id}" does not match directory name`
      );
      errors++;
      continue;
    }

    // Parse and validate hints.json
    let hintsData;
    try {
      const raw = JSON.parse(fs.readFileSync(hintsJsonPath, "utf-8"));
      hintsData = HintsFileSchema.parse(raw);
    } catch (err) {
      console.error(`[SKIP] ${labId}: invalid hints.json -- ${err}`);
      errors++;
      continue;
    }

    // Verify hints labId matches
    if (hintsData.labId !== labId) {
      console.error(
        `[SKIP] ${labId}: hints.json labId "${hintsData.labId}" does not match directory name`
      );
      errors++;
      continue;
    }

    // Create dist output for this lab
    const distLabDir = path.join(DIST_DIR, "labs", labId);
    fs.mkdirSync(distLabDir, { recursive: true });

    // Copy lab.json and hints.json
    fs.copyFileSync(labJsonPath, path.join(distLabDir, "lab.json"));
    fs.copyFileSync(hintsJsonPath, path.join(distLabDir, "hints.json"));

    // Create package.tar.gz from src/
    const packagePath = path.join(distLabDir, "package.tar.gz");
    try {
      execSync(`tar czf "${packagePath}" -C "${srcDir}" .`, {
        stdio: "pipe",
      });
    } catch (err) {
      console.error(`[SKIP] ${labId}: failed to create package.tar.gz -- ${err}`);
      errors++;
      continue;
    }

    // Compute checksum
    checksums[`labs/${labId}/package.tar.gz`] = sha256(packagePath);

    // Build summary (strip flags, briefings, objectives)
    categories.add(labData.category);
    index.push({
      id: labData.id,
      name: labData.name,
      category: labData.category,
      subcategory: labData.subcategory,
      difficulty: labData.difficulty,
      description: labData.description,
      tags: labData.tags,
      dbEngine: labData.dbEngine,
      author: labData.author,
      version: labData.version,
    });

    console.log(`[OK] ${labId}`);
  }

  // Write index.json
  fs.writeFileSync(
    path.join(DIST_DIR, "index.json"),
    JSON.stringify(index, null, 2) + "\n"
  );

  // Write checksums.json
  fs.writeFileSync(
    path.join(DIST_DIR, "checksums.json"),
    JSON.stringify(checksums, null, 2) + "\n"
  );

  // Write typhon-library.json manifest
  const manifest = {
    typhonLibraryVersion: "1",
    name: "h4ck0rman",
    displayName: "h4ck0rman Lab Library",
    description: "The default Typhon CTF lab library",
    url: "https://h4ck0rman.github.io/typhon-library",
    categories: Array.from(categories).sort(),
    labCount: index.length,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(DIST_DIR, "typhon-library.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );

  console.log(`\nBuild complete.`);
  console.log(`  Labs: ${index.length}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Output: dist/`);

  if (errors > 0) {
    process.exit(1);
  }
}

function writeEmptyOutput(): void {
  const manifest = {
    typhonLibraryVersion: "1",
    name: "h4ck0rman",
    displayName: "h4ck0rman Lab Library",
    description: "The default Typhon CTF lab library",
    url: "https://h4ck0rman.github.io/typhon-library",
    categories: [],
    labCount: 0,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(DIST_DIR, "typhon-library.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  fs.writeFileSync(path.join(DIST_DIR, "index.json"), "[]\n");
  fs.writeFileSync(path.join(DIST_DIR, "checksums.json"), "{}\n");

  console.log("Empty library written to dist/");
}

main();
