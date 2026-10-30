import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { SolutionManifestItem } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function verifyImportedCatalog(): {
  success: boolean;
  total_checked: number;
  valid_sha_count: number;
  unique_sha_count: number;
  licensed_count: number;
  traceable_count: number;
  failures: string[];
} {
  const storePath = path.resolve(process.cwd(), 'data/codeforces/solutions_store.json');
  if (!fs.existsSync(storePath)) {
    return {
      success: false,
      total_checked: 0,
      valid_sha_count: 0,
      unique_sha_count: 0,
      licensed_count: 0,
      traceable_count: 0,
      failures: [`Store file not found at ${storePath}`],
    };
  }

  const store: Record<string, SolutionManifestItem> = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
  const items = Object.values(store);

  const failures: string[] = [];
  const seenSha = new Set<string>();

  let validShaCount = 0;
  let licensedCount = 0;
  let traceableCount = 0;

  for (const item of items) {
    // 1. Source code non-empty
    if (!item.source_code || item.source_code.trim().length === 0) {
      failures.push(`Item ${item.id} has empty source code`);
      continue;
    }

    // 2. SHA-256 verification
    const computedSha = crypto.createHash('sha256').update(item.source_code, 'utf-8').digest('hex');
    if (computedSha !== item.source_sha256) {
      failures.push(`Item ${item.id} has corrupted SHA-256 (expected ${item.source_sha256}, got ${computedSha})`);
      continue;
    }
    validShaCount++;

    // 3. Unique SHA
    if (seenSha.has(item.source_sha256)) {
      failures.push(`Duplicate SHA-256 detected in store: ${item.source_sha256} (ID: ${item.id})`);
    } else {
      seenSha.add(item.source_sha256);
    }

    // 4. License check
    if (item.license_verified && (item.license_spdx === 'MIT' || item.license_spdx === 'Apache-2.0')) {
      licensedCount++;
    } else {
      failures.push(`Item ${item.id} lacks approved open source license: ${item.license_spdx}`);
    }

    // 5. Traceability
    if (item.source_repository && item.source_file_path && item.source_commit) {
      traceableCount++;
    } else {
      failures.push(`Item ${item.id} missing provenance (repo: ${item.source_repository}, commit: ${item.source_commit})`);
    }
  }

  const success = failures.length === 0;

  console.log('\n================ CATALOG VERIFICATION ================');
  console.log(`Status:              ${success ? 'PASSED (100% Valid)' : 'FAILED'}`);
  console.log(`Total Solutions:     ${items.length}`);
  console.log(`Valid SHA-256 Hashes: ${validShaCount} / ${items.length}`);
  console.log(`Unique Hashes:       ${seenSha.size} / ${items.length}`);
  console.log(`Verified Licenses:   ${licensedCount} / ${items.length}`);
  console.log(`Fully Traceable:     ${traceableCount} / ${items.length}`);
  if (failures.length > 0) {
    console.log(`Failures (${failures.length}):`);
    console.log(failures.slice(0, 10));
  }
  console.log('======================================================\n');

  return {
    success,
    total_checked: items.length,
    valid_sha_count: validShaCount,
    unique_sha_count: seenSha.size,
    licensed_count: licensedCount,
    traceable_count: traceableCount,
    failures,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = verifyImportedCatalog();
  if (!result.success) {
    process.exit(1);
  }
}
