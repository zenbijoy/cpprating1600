import { fileURLToPath } from 'url';
import { cloneRepositories } from './clone_repositories';
import { buildImportManifest } from './build_import_manifest';
import { SupabaseBulkImporter } from './import_to_supabase';
import { verifyImportedCatalog } from './verify_import';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const phaseArg = args.indexOf('--phase');
  const targetPhase = phaseArg !== -1 ? args[phaseArg + 1] : 'all';

  console.log(`[MasterRunner] Initializing Codeforces Solution Engine Pipeline (Phase: ${targetPhase}, DryRun: ${isDryRun})...`);

  if (targetPhase === 'all' || targetPhase === 'clone') {
    console.log('\n--- PHASE 2: CLONE REPOSITORIES ---');
    await cloneRepositories();
  }

  if (targetPhase === 'all' || targetPhase === 'manifest') {
    console.log('\n--- PHASES 3 - 5: EXTRACTION, MATCHING, DEDUPLICATION & VALIDATION ---');
    await buildImportManifest();
  }

  if (targetPhase === 'all' || targetPhase === 'import') {
    console.log('\n--- PHASE 7: SUPABASE BULK IMPORT ---');
    const importer = new SupabaseBulkImporter();
    await importer.runImport({ dryRun: isDryRun });
  }

  if (targetPhase === 'all' || targetPhase === 'verify') {
    console.log('\n--- VERIFY CATALOG ---');
    const verification = verifyImportedCatalog();
    if (!verification.success) {
      console.error('[MasterRunner] Verification checks reported failures.');
      process.exit(1);
    }
  }

  console.log('\n[MasterRunner] Codeforces Solution Engine execution completed successfully.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error('[MasterRunner] Unhandled error:', err);
    process.exit(1);
  });
}
