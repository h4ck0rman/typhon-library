/**
 * Validation script for Typhon lab library.
 *
 * Validates every lab in labs/ against the Typhon Zod schemas and
 * checks structural requirements. Exits with code 1 on any failure.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { LabMetadataSchema, HintsFileSchema, LAB_ID_REGEX } from "../schemas.js";
import type { ZodError } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LABS_DIR = path.join(ROOT, "labs");

const STATIC_FLAG_REGEX = /^TYPHON\{.+\}$/;

function isLabDirectory(dirName: string): boolean {
  if (dirName.startsWith(".") || dirName.startsWith("_")) return false;
  return LAB_ID_REGEX.test(dirName);
}

function formatZodError(err: ZodError): string {
  return err.issues
    .map((issue) => `    ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

function main(): void {
  console.log("Validating Typhon lab library...\n");

  if (!fs.existsSync(LABS_DIR)) {
    console.log("No labs/ directory found. Nothing to validate.");
    process.exit(0);
  }

  const entries = fs.readdirSync(LABS_DIR, { withFileTypes: true });
  const labDirs = entries
    .filter((e) => e.isDirectory() && isLabDirectory(e.name))
    .map((e) => e.name)
    .sort();

  if (labDirs.length === 0) {
    console.log("No labs found. Nothing to validate.");
    process.exit(0);
  }

  console.log(`Found ${labDirs.length} lab(s) to validate.\n`);

  let passed = 0;
  let failed = 0;

  for (const labId of labDirs) {
    const labDir = path.join(LABS_DIR, labId);
    const errors: string[] = [];

    // Check lab ID format
    if (!LAB_ID_REGEX.test(labId)) {
      errors.push(`Directory name "${labId}" does not match required format`);
    }

    // Validate lab.json
    const labJsonPath = path.join(labDir, "lab.json");
    if (!fs.existsSync(labJsonPath)) {
      errors.push("Missing lab.json");
    } else {
      try {
        const raw = JSON.parse(fs.readFileSync(labJsonPath, "utf-8"));
        const result = LabMetadataSchema.safeParse(raw);
        if (!result.success) {
          errors.push(`lab.json schema errors:\n${formatZodError(result.error)}`);
        } else {
          // Check ID matches directory
          if (result.data.id !== labId) {
            errors.push(
              `lab.json id "${result.data.id}" does not match directory name "${labId}"`
            );
          }

          // Check static flag format
          if (result.data.flag.type === "static") {
            if (!STATIC_FLAG_REGEX.test(result.data.flag.value)) {
              errors.push(
                `Static flag "${result.data.flag.value}" does not match TYPHON{...} format`
              );
            }
          }
        }
      } catch (err) {
        errors.push(`lab.json is not valid JSON: ${err}`);
      }
    }

    // Validate hints.json
    const hintsJsonPath = path.join(labDir, "hints.json");
    if (!fs.existsSync(hintsJsonPath)) {
      errors.push("Missing hints.json");
    } else {
      try {
        const raw = JSON.parse(fs.readFileSync(hintsJsonPath, "utf-8"));
        const result = HintsFileSchema.safeParse(raw);
        if (!result.success) {
          errors.push(
            `hints.json schema errors:\n${formatZodError(result.error)}`
          );
        } else {
          // Check labId matches directory
          if (result.data.labId !== labId) {
            errors.push(
              `hints.json labId "${result.data.labId}" does not match directory name "${labId}"`
            );
          }
        }
      } catch (err) {
        errors.push(`hints.json is not valid JSON: ${err}`);
      }
    }

    // Check src/ directory structure
    const srcDir = path.join(labDir, "src");
    if (!fs.existsSync(srcDir)) {
      errors.push("Missing src/ directory");
    } else {
      if (!fs.existsSync(path.join(srcDir, "docker-compose.yml"))) {
        errors.push("Missing src/docker-compose.yml");
      }
    }

    // Report results
    if (errors.length === 0) {
      console.log(`[PASS] ${labId}`);
      passed++;
    } else {
      console.log(`[FAIL] ${labId}`);
      for (const err of errors) {
        console.log(`  - ${err}`);
      }
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${labDirs.length} lab(s)`);

  if (failed > 0) {
    process.exit(1);
  }
}

main();
