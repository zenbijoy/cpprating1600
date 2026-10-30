# Codeforces Solution Importer & Validation Engine

A reproducible, high-throughput, legally compliant competitive programming solution ingestion pipeline designed for CLIMB 1600.

---

## 1. Architecture & Pipeline Stages

```text
[Public GitHub Repositories]
            │
            ▼
    [1. Clone Engine] (Shallow git clone, commit SHA recording, caching)
            │
            ▼
    [2. Source Scanner] (Discovers .cpp/.cc/.cxx, excludes non-source/binaries)
            │
            ▼
    [3. Metadata Extractor] (Filename regex, directory patterns, comments, URLs)
            │
            ▼
    [4. Ground-Truth Matcher] (Cross-references against official CF problem catalog)
            │
            ▼
    [5. Deduplication Engine] (Level A: exact SHA-256; Level B: normalized SHA-256)
            │
            ▼
    [6. Validation Engine] (Syntax parsing, brace balancing, safe g++ -fsyntax-only)
            │
            ▼
    [7. Manifest Builder] (Outputs manifest.json, duplicate_report.json, summaries)
            │
            ▼
    [8. Resumable Supabase Importer] (Batched idempotent upserts, checkpoints)
```

---

## 2. Directory Structure

- `runner.ts`: Master orchestrator for running all or specific phases.
- `config.json`: Repository inventory with explicit license and redistribution rules.
- `clone_repositories.ts`: Clones approved open-source repositories to `.importer_cache/repos/`.
- `scan_sources.ts`: Finds candidate C++ files.
- `extract_metadata.ts`: Regex parser for contest IDs, problem indexes, and code normalizer.
- `match_problems.ts`: Matches solutions against 11,481 official Codeforces problems.
- `detect_duplicates.ts`: Multi-level deduplication preserving author provenance.
- `validate_solutions.ts`: Static and safe compiler syntax verification.
- `build_import_manifest.ts`: Generates production manifests and audit reports.
- `import_to_supabase.ts`: Batched, resumable upsert engine with checkpointing.
- `verify_import.ts`: 100% cryptographic and legal audit verification test.

---

## 3. Running the Pipeline

### Dry Run (Simulate import without modifying database)
```bash
npm run import:dry-run
# or
npx tsx tools/codeforces_importer/runner.ts --dry-run
```

### Full Production Import
```bash
npm run import:run
# or
npx tsx tools/codeforces_importer/runner.ts
```

### Verify Catalog Integrity
```bash
npx tsx tools/codeforces_importer/verify_import.ts
```

### Run Specific Phase
```bash
npx tsx tools/codeforces_importer/runner.ts --phase clone
npx tsx tools/codeforces_importer/runner.ts --phase manifest
npx tsx tools/codeforces_importer/runner.ts --phase import
```

---

## 4. Legal Compliance & Redistribution

- Only repositories with verified permissive open-source licenses (`MIT`, `Apache-2.0`, `BSD`) are approved for public redistribution.
- Repositories without explicit licenses are cataloged in `data/codeforces/license_exclusions.json` and excluded from the public catalog.
- Every solution record includes source repository, origin commit SHA, original file path, author attribution, and license identifier.
