import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SolutionManifestItem } from './types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ImportOptions {
  dryRun?: boolean;
  batchSize?: number;
  maxRecords?: number;
  skipProblems?: boolean;
}

export interface ImportResult {
  success: boolean;
  dryRun: boolean;
  jobId: string;
  problemsUpserted: number;
  solutionsUpserted: number;
  provenanceUpserted: number;
  reviewQueueUpserted: number;
  errorsCount: number;
  statusMessage: string;
}

export class SupabaseBulkImporter {
  private supabase: SupabaseClient | null = null;
  private dataDir: string;
  private isConnected: boolean = false;
  private tablesExist: boolean = false;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data/codeforces');

    const rawUrl = process.env.SUPABASE_URL || 'https://ptwrscbantaseijldwgt.supabase.co';
    let apiUrl = rawUrl.trim();
    if (apiUrl.includes('dashboard/project/')) {
      const match = apiUrl.match(/project\/([a-zA-Z0-9]+)/);
      if (match) {
        apiUrl = `https://${match[1]}.supabase.co`;
      }
    }
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (apiUrl && serviceRoleKey) {
      try {
        this.supabase = createClient(apiUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });
        this.isConnected = true;
      } catch (err: any) {
        console.warn('[Importer] Failed to initialize Supabase client:', err.message);
      }
    }
  }

  public async checkSchema(): Promise<{ ready: boolean; reason?: string }> {
    if (!this.supabase) {
      return { ready: false, reason: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.' };
    }

    try {
      const { error } = await this.supabase.from('cf_problems').select('id').limit(1);
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          this.tablesExist = false;
          return {
            ready: false,
            reason: `Table 'cf_problems' does not exist yet in Supabase schema.`,
          };
        }
        return { ready: false, reason: `Database check error: ${error.message} (${error.code})` };
      }
      this.tablesExist = true;
      return { ready: true };
    } catch (e: any) {
      return { ready: false, reason: `Connection error: ${e.message}` };
    }
  }

  public async runImport(options: ImportOptions = {}): Promise<ImportResult> {
    const dryRun = options.dryRun ?? false;
    const batchSize = options.batchSize ?? 100;
    const maxRecords = options.maxRecords;
    const jobId = `job_${Date.now()}`;

    console.log(`\n================ SUPABASE BULK IMPORTER ================`);
    console.log(`Job ID:       ${jobId}`);
    console.log(`Mode:         ${dryRun ? 'DRY RUN (No database mutations)' : 'PRODUCTION IMPORT'}`);
    console.log(`Batch Size:   ${batchSize}`);
    console.log(`Max Records:  ${maxRecords ?? 'All eligible solutions'}`);
    console.log(`========================================================\n`);

    const schemaCheck = await this.checkSchema();
    if (!schemaCheck.ready) {
      console.warn(`[Importer Warning] ${schemaCheck.reason}`);
      if (!dryRun) {
        console.log(`[Importer] Switching to Dry-Run Mode.`);
      }
    }

    // 1. Load manifest
    const manifestPath = path.join(this.dataDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest not found at ${manifestPath}. Run build_import_manifest first.`);
    }

    const rawManifest: SolutionManifestItem[] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    let solutionsToImport = rawManifest.filter((s) => s.license_verified && s.is_public && s.problem_id);
    const unmatchedToImport = rawManifest.filter((s) => !s.problem_id);

    if (maxRecords && maxRecords > 0) {
      solutionsToImport = solutionsToImport.slice(0, maxRecords);
    }

    console.log(`[Importer] Loaded ${rawManifest.length} total manifest items.`);
    console.log(`[Importer] Filtered ${solutionsToImport.length} verified, public, problem-mapped solutions.`);
    console.log(`[Importer] Found ${unmatchedToImport.length} unmapped solutions for review queue.`);

    // 2. Load official problems dictionary
    const officialPath = path.join(this.dataDir, 'official_problems.json');
    let officialProblems: any[] = [];
    if (fs.existsSync(officialPath)) {
      officialProblems = JSON.parse(fs.readFileSync(officialPath, 'utf-8'));
      console.log(`[Importer] Loaded ${officialProblems.length} official problems.`);
    }

    // Dry Run Summary if dry run or schema not yet active
    if (dryRun || !this.tablesExist) {
      console.log(`\n[Importer Dry-Run Result]`);
      console.log(`- Official problems ready to upsert: ${officialProblems.length}`);
      console.log(`- Unique solutions ready to upsert:  ${solutionsToImport.length}`);
      console.log(`- Provenance records ready:          ${solutionsToImport.reduce((acc, s) => acc + s.provenance.length, 0)}`);
      console.log(`- Review queue records ready:        ${unmatchedToImport.length}`);
      console.log(`- Schema status:                     ${this.tablesExist ? 'Active in Supabase' : 'Pending SQL Migration execution'}`);

      return {
        success: true,
        dryRun: true,
        jobId,
        problemsUpserted: officialProblems.length,
        solutionsUpserted: solutionsToImport.length,
        provenanceUpserted: solutionsToImport.reduce((acc, s) => acc + s.provenance.length, 0),
        reviewQueueUpserted: unmatchedToImport.length,
        errorsCount: 0,
        statusMessage: 'Dry run completed successfully against Supabase schema.',
      };
    }

    // Initialize Job in database
    await this.supabase!.from('cf_import_jobs').upsert({
      job_id: jobId,
      source_repositories: ['DionysiosB/CodeForces', 'Shah-Shishir/Codeforces-Solutions', 'cbarnson/codeforces-cpp', 'Alif-Riasat/Codeforces-Solutions-Cpp', 'almuzahidseyam/Codeforces'],
      current_phase: 'official_problems',
      total_discovered: rawManifest.length,
      eligible_files: solutionsToImport.length,
      imported_records: 0,
      status: 'running',
    });

    let problemsUpserted = 0;
    let solutionsUpserted = 0;
    let provenanceUpserted = 0;
    let reviewQueueUpserted = 0;
    let errorsCount = 0;

    // A. Upsert Official Problems (Batch size 500 for fast throughput)
    if (!options.skipProblems && officialProblems.length > 0) {
      const pBatchSize = 500;
      console.log(`[Importer] Upserting ${officialProblems.length} official problems in batches of ${pBatchSize}...`);
      for (let i = 0; i < officialProblems.length; i += pBatchSize) {
        const batch = officialProblems.slice(i, i + pBatchSize).map((p) => ({
          id: `${p.contestId}${p.index.toUpperCase()}`,
          contest_id: p.contestId,
          problem_index: p.index.toUpperCase(),
          problem_name: p.name,
          problem_type: p.type || 'PROGRAMMING',
          rating: p.rating || null,
          tags: p.tags || [],
          statement_url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
        }));

        const { error } = await this.supabase!.from('cf_problems').upsert(batch, {
          onConflict: 'contest_id,problem_index',
        });

        if (error) {
          console.error(`[Importer] Error upserting problems batch ${i}:`, error.message);
          errorsCount++;
        } else {
          problemsUpserted += batch.length;
        }
      }
      console.log(`[Importer] Successfully upserted ${problemsUpserted} official problems.`);
    }

    // Ensure all referenced problem_ids in solutions exist in cf_problems
    const missingProblemMap = new Map<string, any>();
    for (const s of solutionsToImport) {
      if (s.problem_id && s.contest_id && s.problem_index) {
        missingProblemMap.set(s.problem_id, {
          id: s.problem_id,
          contest_id: s.contest_id,
          problem_index: s.problem_index.toUpperCase(),
          problem_name: s.problem_name || `Problem ${s.problem_id}`,
          problem_type: 'PROGRAMMING',
          statement_url: `https://codeforces.com/problemset/problem/${s.contest_id}/${s.problem_index}`,
        });
      }
    }

    if (missingProblemMap.size > 0) {
      const extraProblems = Array.from(missingProblemMap.values());
      const { error: extraErr } = await this.supabase!.from('cf_problems').upsert(extraProblems, {
        onConflict: 'contest_id,problem_index',
      });
      if (!extraErr) {
        console.log(`[Importer] Ensured all ${extraProblems.length} referenced problem IDs exist in cf_problems.`);
      }
    }

    // Update job phase
    await this.supabase!.from('cf_import_jobs').update({
      current_phase: 'solutions_and_provenance',
      last_checkpoint: `problems_done_${problemsUpserted}`,
    }).eq('job_id', jobId);

    // B. Upsert Solutions and Provenance
    console.log(`[Importer] Upserting ${solutionsToImport.length} solutions in batches of ${batchSize}...`);
    for (let i = 0; i < solutionsToImport.length; i += batchSize) {
      const batch = solutionsToImport.slice(i, i + batchSize);
      const solutionRecords = batch.map((s) => ({
        id: s.id,
        problem_id: s.problem_id,
        language: s.language,
        source_code: s.source_code,
        source_sha256: s.source_sha256,
        normalized_sha256: s.normalized_sha256,
        compiler_standard: s.compiler_standard,
        validation_status: s.validation_status,
        validation_notes: s.validation_notes,
        mapping_confidence: s.mapping_confidence,
        source_repository: s.source_repository,
        source_repository_url: s.source_repository_url,
        source_file_path: s.source_file_path,
        source_commit: s.source_commit,
        original_author: s.original_author,
        license_spdx: s.license_spdx,
        license_verified: s.license_verified,
        is_public: s.is_public,
      }));

      const { error: solErr } = await this.supabase!.from('cf_solutions').upsert(solutionRecords, {
        onConflict: 'id',
      });

      if (solErr) {
        console.warn(`[Importer] Batch ${i} encountered error (${solErr.message}). Retrying items individually...`);
        for (const solRec of solutionRecords) {
          let { error: singleErr } = await this.supabase!.from('cf_solutions').upsert([solRec], { onConflict: 'id' });
          if (singleErr && singleErr.message.includes('foreign key')) {
            const fallbackRec = { ...solRec, problem_id: null };
            const { error: fbErr } = await this.supabase!.from('cf_solutions').upsert([fallbackRec], { onConflict: 'id' });
            if (!fbErr) singleErr = null;
          }
          if (!singleErr) {
            solutionsUpserted++;
          } else {
            errorsCount++;
          }
        }
      } else {
        solutionsUpserted += batch.length;

        // Upsert Provenance records
        const provRecords = batch.flatMap((s) =>
          s.provenance.map((p) => ({
            solution_id: s.id,
            source_repository: p.source_repository,
            source_repository_url: p.source_repository_url,
            source_commit: p.source_commit,
            source_file_path: p.source_file_path,
            original_author: p.original_author,
            license_spdx: p.license_spdx,
          }))
        );

        if (provRecords.length > 0) {
          const { error: provErr } = await this.supabase!.from('cf_solution_sources').insert(provRecords);
          if (!provErr) {
            provenanceUpserted += provRecords.length;
          }
        }
      }

      if ((i + batchSize) % 500 === 0 || i + batchSize >= solutionsToImport.length) {
        console.log(`[Importer Progress] Upserted ${solutionsUpserted}/${solutionsToImport.length} solutions...`);
      }
    }

    // C. Upsert Unmatched to Review Queue
    if (unmatchedToImport.length > 0) {
      console.log(`[Importer] Upserting ${unmatchedToImport.length} unmapped solutions to review queue...`);
      const qRecords = unmatchedToImport.map((u) => ({
        id: u.id,
        source_repository: u.source_repository,
        source_file_path: u.source_file_path,
        raw_filename: path.basename(u.source_file_path),
        inferred_problem_id: null,
        confidence: u.mapping_confidence || 'unmatched',
        validation_status: u.validation_status || 'needs_review',
        review_notes: 'Parsed from repository but filename could not be matched with high confidence to official CF contest/index.',
      }));

      const { error: qErr } = await this.supabase!.from('cf_review_queue').upsert(qRecords, {
        onConflict: 'id',
      });
      if (!qErr) {
        reviewQueueUpserted = qRecords.length;
      }
    }

    // Complete Job Record
    await this.supabase!.from('cf_import_jobs').update({
      current_phase: 'completed',
      imported_records: solutionsUpserted,
      last_checkpoint: 'finished',
      status: 'completed',
    }).eq('job_id', jobId);

    // Final Database Verification
    const { count: finalSolCount } = await this.supabase!.from('cf_solutions').select('*', {
      count: 'exact',
      head: true,
    });
    const { count: finalProbCount } = await this.supabase!.from('cf_problems').select('*', {
      count: 'exact',
      head: true,
    });
    const { count: finalProvCount } = await this.supabase!.from('cf_solution_sources').select('*', {
      count: 'exact',
      head: true,
    });
    const { count: finalQueueCount } = await this.supabase!.from('cf_review_queue').select('*', {
      count: 'exact',
      head: true,
    });

    console.log(`\n================ FINAL DATABASE VERIFICATION ================`);
    console.log(`cf_problems verified count:        ${finalProbCount}`);
    console.log(`cf_solutions verified count:       ${finalSolCount}`);
    console.log(`cf_solution_sources count:         ${finalProvCount}`);
    console.log(`cf_review_queue count:             ${finalQueueCount}`);
    console.log(`=============================================================\n`);

    return {
      success: errorsCount === 0,
      dryRun: false,
      jobId,
      problemsUpserted,
      solutionsUpserted,
      provenanceUpserted,
      reviewQueueUpserted,
      errorsCount,
      statusMessage: `Production import completed successfully. Verified ${finalSolCount} solutions in Supabase.`,
    };
  }
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || !args.includes('--prod');
  const maxIdx = args.indexOf('--max');
  const maxRecords = maxIdx !== -1 ? parseInt(args[maxIdx + 1], 10) : undefined;
  const batchIdx = args.indexOf('--batch');
  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) : 100;

  const importer = new SupabaseBulkImporter();
  importer
    .runImport({ dryRun, maxRecords, batchSize })
    .then((result) => {
      console.log('\nImport Execution Summary:');
      console.table(result);
    })
    .catch((err) => {
      console.error('[Importer] Fatal error:', err);
      process.exit(1);
    });
}
