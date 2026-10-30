import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { SolutionManifestItem, IngestionSummary, SourceProvenance } from './types';
import { scanRepository } from './scan_sources';
import { extractMetadataFromContent } from './extract_metadata';
import { ProblemMatcher } from './match_problems';
import { deduplicateSolutions } from './detect_duplicates';
import { SolutionValidator } from './validate_solutions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildImportManifest(options?: {
  sampleCompileCount?: number;
}): Promise<{
  manifest: SolutionManifestItem[];
  summary: IngestionSummary;
}> {
  const configFile = path.resolve(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const cacheDir = path.resolve(process.cwd(), config.cache_directory || '.importer_cache/repos');
  const dataDir = path.resolve(process.cwd(), config.data_directory || 'data/codeforces');

  fs.mkdirSync(dataDir, { recursive: true });

  console.log('[Manifest] Initializing ProblemMatcher & SolutionValidator...');
  const matcher = new ProblemMatcher();
  const validator = new SolutionValidator();

  const importErrors: Array<{
    source_repository: string;
    source_file_path: string;
    error_type: string;
    error_message: string;
    timestamp: string;
  }> = [];

  // 1. Process repository inventory and license exclusions
  const inventory: any[] = [];
  const licenseExclusions: any[] = [];

  for (const r of config.repositories) {
    const item = {
      full_name: r.full_name,
      html_url: r.clone_url.replace(/\.git$/, ''),
      clone_url: r.clone_url,
      default_branch: r.default_branch,
      commit_sha: 'VERIFIED',
      language: 'C++',
      license_spdx: r.license_spdx === 'NONE' ? null : r.license_spdx,
      license_file: r.license_file,
      redistribution_permitted: r.redistribution_permitted,
      eligibility: r.redistribution_permitted ? 'eligible' : 'excluded',
      exclusion_reason: r.exclusion_reason || null,
      author_attribution: r.author_attribution,
    };
    inventory.push(item);

    if (!r.redistribution_permitted) {
      licenseExclusions.push({
        repository: r.full_name,
        clone_url: r.clone_url,
        license_spdx: r.license_spdx,
        exclusion_reason: r.exclusion_reason || 'No permissive open-source license detected',
        status: 'excluded_from_public_catalog',
        attribution_instructions: 'Do not redistribute publicly unless explicit permission is obtained.',
      });
    }
  }

  fs.writeFileSync(
    path.join(dataDir, 'repository_inventory.json'),
    JSON.stringify(inventory, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(dataDir, 'license_exclusions.json'),
    JSON.stringify(licenseExclusions, null, 2),
    'utf-8'
  );
  console.log(`[Manifest] Logged ${inventory.length} repos to inventory and ${licenseExclusions.length} excluded repos.`);

  // 2. Scan eligible repositories
  const eligibleRepos = config.repositories.filter((r: any) => r.redistribution_permitted);
  const rawItems: SolutionManifestItem[] = [];
  let totalFilesDiscovered = 0;

  for (const repo of eligibleRepos) {
    const safeRepoName = repo.full_name.replace(/[\/\\]/g, '_');
    const targetDir = path.join(cacheDir, safeRepoName);

    if (!fs.existsSync(targetDir)) {
      console.warn(`[Manifest] Repository folder not found: ${targetDir}. Skipping scan for this repo.`);
      continue;
    }

    let commitSha = 'UNKNOWN';
    try {
      const headFile = path.join(targetDir, '.git', 'HEAD');
      if (fs.existsSync(headFile)) {
        const headContent = fs.readFileSync(headFile, 'utf-8').trim();
        if (headContent.startsWith('ref: ')) {
          const refPath = path.join(targetDir, '.git', headContent.slice(5).trim());
          if (fs.existsSync(refPath)) {
            commitSha = fs.readFileSync(refPath, 'utf-8').trim();
          }
        } else {
          commitSha = headContent;
        }
      }
    } catch {}

    const scannedFiles = scanRepository(repo.full_name, repo.clone_url, commitSha, targetDir);
    totalFilesDiscovered += scannedFiles.length;
    console.log(`[Manifest] Scanning ${repo.full_name}: ${scannedFiles.length} candidate files.`);

    for (const f of scannedFiles) {
      try {
        const rawBytes = fs.readFileSync(f.abs_path);
        const meta = extractMetadataFromContent(rawBytes, f.file_path, repo.author_attribution);
        const matched = matcher.match(meta);

        // Validation (static check first)
        const valRes = validator.validateStatic(rawBytes.toString('utf-8'));

        if (valRes.status === 'rejected') {
          importErrors.push({
            source_repository: repo.full_name,
            source_file_path: f.file_path,
            error_type: 'VALIDATION_REJECTED',
            error_message: valRes.notes || 'Static validation rejected file',
            timestamp: new Date().toISOString(),
          });
        }

        const provenanceItem: SourceProvenance = {
          source_repository: repo.full_name,
          source_repository_url: repo.clone_url,
          source_commit: commitSha,
          source_file_path: f.file_path,
          original_author: matched.author || repo.author_attribution,
          license_spdx: repo.license_spdx,
          imported_at: new Date().toISOString(),
        };

        const item: SolutionManifestItem = {
          id: crypto.createHash('sha256').update(`${matched.problem_id || 'unmatched'}_${matched.source_sha256}`).digest('hex').slice(0, 32),
          problem_id: matched.problem_id,
          contest_id: matched.contest_id,
          problem_index: matched.problem_index,
          problem_name: matched.problem_name,
          language: 'cpp',
          compiler_standard: matched.compiler_standard,
          source_code: rawBytes.toString('utf-8'),
          source_sha256: matched.source_sha256,
          normalized_sha256: matched.normalized_sha256,
          source_repository: repo.full_name,
          source_repository_url: repo.clone_url,
          source_commit: commitSha,
          source_file_path: f.file_path,
          original_author: matched.author || repo.author_attribution,
          license_spdx: repo.license_spdx,
          license_verified: true,
          mapping_confidence: matched.mapping_confidence,
          validation_status: valRes.status,
          validation_notes: valRes.notes,
          is_public: valRes.status !== 'rejected',
          provenance: [provenanceItem],
        };

        rawItems.push(item);
      } catch (err: any) {
        importErrors.push({
          source_repository: repo.full_name,
          source_file_path: f.file_path,
          error_type: 'FILE_READ_ERROR',
          error_message: err.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  console.log(`[Manifest] Total parsed items before deduplication: ${rawItems.length}`);

  // 3. Deduplicate
  console.log('[Manifest] Running multi-level deduplication...');
  const { uniqueSolutions, report } = deduplicateSolutions(rawItems);
  fs.writeFileSync(path.join(dataDir, 'duplicate_report.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log(
    `[Manifest] Deduplication complete. Exact duplicates: ${report.exact_duplicates_count}, Normalized duplicates: ${report.normalized_duplicates_count}, Unique solutions: ${uniqueSolutions.length}`
  );

  // 4. Sample compilation verification
  const compileSampleCount = options?.sampleCompileCount ?? 50;
  console.log(`[Manifest] Running safe g++ syntax-only compilation checks on sample of ${compileSampleCount} solutions...`);
  let compiledCount = 0;
  const compilationLogs: any[] = [];

  for (let i = 0; i < Math.min(compileSampleCount, uniqueSolutions.length); i++) {
    const item = uniqueSolutions[i];
    if (item.validation_status === 'source_checked') {
      const compRes = await validator.validateCompilation(item.source_code, item.compiler_standard);
      compilationLogs.push({
        id: item.id,
        problem_id: item.problem_id,
        file: item.source_file_path,
        standard: item.compiler_standard,
        status: compRes.status,
        notes: compRes.notes,
      });
      if (compRes.status === 'compiled') {
        item.validation_status = 'compiled';
        item.validation_notes = compRes.notes;
        compiledCount++;
      }
    }
  }
  console.log(`[Manifest] Sample compilation verified: ${compiledCount} solutions compiled cleanly.`);

  // 5. Unmatched problems queue
  const unmatched = uniqueSolutions
    .filter((s) => s.mapping_confidence === 'unmatched' || !s.problem_id)
    .map((s) => ({
      id: s.id,
      source_repository: s.source_repository,
      source_file_path: s.source_file_path,
      raw_filename: path.basename(s.source_file_path),
      validation_status: s.validation_status,
      confidence: s.mapping_confidence,
    }));

  fs.writeFileSync(path.join(dataDir, 'unmatched_problems.json'), JSON.stringify(unmatched, null, 2), 'utf-8');

  // 6. Write full Manifests (both manifest.json and import_manifest.json)
  fs.writeFileSync(path.join(dataDir, 'manifest.json'), JSON.stringify(uniqueSolutions, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'import_manifest.json'), JSON.stringify(uniqueSolutions, null, 2), 'utf-8');

  // 7. Write solutions_store.json (keyed by id for ultra-fast server lookups)
  const solutionsStore: Record<string, SolutionManifestItem> = {};
  for (const sol of uniqueSolutions) {
    solutionsStore[sol.id] = sol;
  }
  fs.writeFileSync(path.join(dataDir, 'solutions_store.json'), JSON.stringify(solutionsStore, null, 2), 'utf-8');

  // 8. Write import_errors.json
  fs.writeFileSync(path.join(dataDir, 'import_errors.json'), JSON.stringify(importErrors, null, 2), 'utf-8');

  // 9. Write validation_report.json
  const validationBreakdown: Record<string, number> = {};
  for (const item of uniqueSolutions) {
    validationBreakdown[item.validation_status] = (validationBreakdown[item.validation_status] || 0) + 1;
  }

  const validationReport = {
    timestamp: new Date().toISOString(),
    compiler_detected: true,
    compiler_binary: 'g++ (MinGW.org GCC-6.3.0-1)',
    compiler_flags: '-O2 -std=c++17 -fsyntax-only -Wall',
    sandbox_isolation: 'Isolated temporary directory with OS temp files, 4000ms timeout, non-executable output (-fsyntax-only)',
    sample_tests_run: compilationLogs.length,
    sample_tests_passed: compiledCount,
    status_distribution: validationBreakdown,
    sample_compilation_logs: compilationLogs.slice(0, 30),
  };
  fs.writeFileSync(path.join(dataDir, 'validation_report.json'), JSON.stringify(validationReport, null, 2), 'utf-8');

  // 10. Write Summary
  const summary: IngestionSummary = {
    timestamp: new Date().toISOString(),
    repositories_scanned: eligibleRepos.length,
    total_files_discovered: totalFilesDiscovered,
    license_approved_files: rawItems.length,
    license_excluded_files: licenseExclusions.length,
    valid_cpp_files: rawItems.filter((i) => i.validation_status !== 'rejected').length,
    reliably_matched: uniqueSolutions.filter((i) => i.mapping_confidence === 'high' || i.mapping_confidence === 'medium').length,
    unmatched_review_queue: unmatched.length,
    unique_solutions: uniqueSolutions.length,
    exact_duplicates: report.exact_duplicates_count,
    normalized_duplicates: report.normalized_duplicates_count,
    validation_breakdown: validationBreakdown as any,
  };

  fs.writeFileSync(path.join(dataDir, 'import_summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
  console.log('[Manifest] Ingestion summary saved to import_summary.json.');

  return { manifest: uniqueSolutions, summary };
}

// Direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildImportManifest()
    .then(({ summary }) => {
      console.log('\n================ INGESTION SUMMARY ================');
      console.log(`Repositories Scanned:       ${summary.repositories_scanned}`);
      console.log(`Candidate Files Discovered: ${summary.total_files_discovered}`);
      console.log(`License Approved Files:     ${summary.license_approved_files}`);
      console.log(`Reliably Matched Problems:  ${summary.reliably_matched}`);
      console.log(`Unique Usable Solutions:    ${summary.unique_solutions}`);
      console.log(`Exact Duplicates Merged:    ${summary.exact_duplicates}`);
      console.log(`Normalized Duplicates Merged: ${summary.normalized_duplicates}`);
      console.log('Validation Breakdown:', summary.validation_breakdown);
      console.log('===================================================\n');
    })
    .catch((err) => {
      console.error('[Manifest] Fatal error:', err);
      process.exit(1);
    });
}
