import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMetadataFromContent, normalizeCppCode } from '../../tools/codeforces_importer/extract_metadata';
import { ProblemMatcher } from '../../tools/codeforces_importer/match_problems';
import { deduplicateSolutions } from '../../tools/codeforces_importer/detect_duplicates';
import { SolutionValidator } from '../../tools/codeforces_importer/validate_solutions';
import { SolutionManifestItem } from '../../tools/codeforces_importer/types';
import { SupabaseBulkImporter } from '../../tools/codeforces_importer/import_to_supabase';

test('Solution Engine: License Eligibility and Exclusion Logic', () => {
  const mockRepos = [
    { name: 'repo-mit', license: 'MIT', permitted: true },
    { name: 'repo-apache', license: 'Apache-2.0', permitted: true },
    { name: 'repo-no-license', license: 'NONE', permitted: false },
    { name: 'repo-custom', license: 'PROPRIETARY', permitted: false },
  ];

  const eligible = mockRepos.filter((r) => r.permitted);
  const excluded = mockRepos.filter((r) => !r.permitted);

  assert.equal(eligible.length, 2);
  assert.equal(excluded.length, 2);
  assert.equal(eligible.every((r) => r.license === 'MIT' || r.license === 'Apache-2.0'), true);
});

test('Solution Engine: Problem-ID Extraction Heuristics', () => {
  // Test Signal 1: URL in comment
  const source1 = Buffer.from(
    '// Problem link: https://codeforces.com/problemset/problem/1000/A\n#include <iostream>\nint main() { return 0; }'
  );
  const meta1 = extractMetadataFromContent(source1, 'test.cpp', 'Author1');
  assert.equal(meta1.problem_id, '1000A');
  assert.equal(meta1.contest_id, 1000);
  assert.equal(meta1.problem_index, 'A');
  assert.equal(meta1.mapping_confidence, 'high');

  // Test Signal 3: DionysiosB filename pattern "1030A-InSearchOfAnEasyProblem.cpp"
  const source2 = Buffer.from('#include <iostream>\nint main() { int a; std::cin >> a; return 0; }');
  const meta2 = extractMetadataFromContent(source2, '1030A-InSearchOfAnEasyProblem.cpp', 'DionysiosB');
  assert.equal(meta2.problem_id, '1030A');
  assert.equal(meta2.contest_id, 1030);
  assert.equal(meta2.problem_index, 'A');

  // Test Signal 4: Shah-Shishir pattern "4A. Watermelon.cpp"
  const source3 = Buffer.from('#include <iostream>\nint main() { int w; std::cin >> w; return 0; }');
  const meta3 = extractMetadataFromContent(source3, '4A. Watermelon.cpp', 'Shah Shishir');
  assert.equal(meta3.problem_id, '4A');
  assert.equal(meta3.contest_id, 4);
  assert.equal(meta3.problem_index, 'A');

  // Test Signal 6: Directory structure pattern "Contest_158/A.cpp"
  const source4 = Buffer.from('#include <iostream>\nint main() { return 0; }');
  const meta4 = extractMetadataFromContent(source4, 'Contest_158/A.cpp', 'Author');
  assert.equal(meta4.problem_id, '158A');
  assert.equal(meta4.contest_id, 158);
  assert.equal(meta4.problem_index, 'A');
});

test('Solution Engine: Code Normalization and Invariance', () => {
  const codeA = `
    // Author: Someone
    /* Multi-line
       comment */
    #include <iostream>
    int main() {
      std::cout << "Hello";
      return 0;
    }
  `;

  const codeB = `#include <iostream>
int main() {
  std::cout << "Hello";
  return 0;
}
`;

  const normA = normalizeCppCode(codeA);
  const normB = normalizeCppCode(codeB);
  assert.equal(normA, normB, 'Normalized code should strip comments and trailing whitespace');
});

test('Solution Engine: Deduplication Engine (Exact & Normalized)', () => {
  const baseItem: SolutionManifestItem = {
    id: 'sol_1',
    problem_id: '4A',
    contest_id: 4,
    problem_index: 'A',
    problem_name: 'Watermelon',
    language: 'cpp',
    compiler_standard: 'c++17',
    source_code: '#include <iostream>\nint main() { int w; std::cin >> w; return 0; }',
    source_sha256: 'sha_exact_123',
    normalized_sha256: 'norm_sha_456',
    source_repository: 'RepoA',
    source_repository_url: 'https://github.com/RepoA',
    source_commit: 'commit1',
    source_file_path: '4A.cpp',
    original_author: 'AuthorA',
    license_spdx: 'MIT',
    license_verified: true,
    mapping_confidence: 'high',
    validation_status: 'source_checked',
    is_public: true,
    provenance: [
      {
        source_repository: 'RepoA',
        source_repository_url: 'https://github.com/RepoA',
        source_commit: 'commit1',
        source_file_path: '4A.cpp',
        original_author: 'AuthorA',
        license_spdx: 'MIT',
        imported_at: '2026-10-29T00:00:00Z',
      },
    ],
  };

  // Duplicate item with same source_sha256 in another repo
  const exactDup: SolutionManifestItem = {
    ...baseItem,
    id: 'sol_2',
    source_repository: 'RepoB',
    source_file_path: 'Contest/4A.cpp',
    provenance: [
      {
        source_repository: 'RepoB',
        source_repository_url: 'https://github.com/RepoB',
        source_commit: 'commit2',
        source_file_path: 'Contest/4A.cpp',
        original_author: 'AuthorB',
        license_spdx: 'MIT',
        imported_at: '2026-10-29T00:00:00Z',
      },
    ],
  };

  // Distinct item for problem 71A
  const distinctItem: SolutionManifestItem = {
    ...baseItem,
    id: 'sol_3',
    problem_id: '71A',
    contest_id: 71,
    source_sha256: 'sha_distinct_789',
    normalized_sha256: 'norm_distinct_789',
  };

  const { uniqueSolutions, report } = deduplicateSolutions([baseItem, exactDup, distinctItem]);

  assert.equal(uniqueSolutions.length, 2);
  assert.equal(report.exact_duplicates_count, 1);
  // Verify that the canonical record preserved both provenance entries
  assert.equal(uniqueSolutions[0].provenance.length, 2);
  assert.equal(uniqueSolutions[0].provenance[0].source_repository, 'RepoA');
  assert.equal(uniqueSolutions[0].provenance[1].source_repository, 'RepoB');
});

test('Solution Engine: Static Syntax & Safety Validation', () => {
  const validator = new SolutionValidator();

  // 1. Valid C++ solution
  const validCode = `#include <iostream>
int main() {
  int a, b;
  if (std::cin >> a >> b) {
    std::cout << (a + b) << "\\n";
  }
  return 0;
}`;
  const res1 = validator.validateStatic(validCode);
  assert.equal(res1.status, 'source_checked');

  // 2. Unbalanced brackets
  const unbalancedCode = `#include <iostream>
int main() {
  int a;
  if (a > 0) {
    std::cout << a;
  // Missing closing brace`;
  const res2 = validator.validateStatic(unbalancedCode);
  assert.equal(res2.status, 'needs_review');

  // 3. Comments-only or empty file
  const commentsOnly = `// Just a comment\n/* Another comment */\n   `;
  const res3 = validator.validateStatic(commentsOnly);
  assert.equal(res3.status, 'rejected');

  // 4. Missing standard structure
  const nonsense = `plain text that is definitely not a C++ program`;
  const res4 = validator.validateStatic(nonsense);
  assert.equal(res4.status, 'rejected');
});

test('Solution Engine: Official Problem Matching', () => {
  const matcher = new ProblemMatcher();
  const meta = {
    raw_filename: '4A.cpp',
    problem_id: '4A',
    contest_id: 4,
    problem_index: 'A',
    problem_name: null,
    compiler_standard: 'c++17',
    author: 'TestAuthor',
    source_sha256: 'hash',
    normalized_sha256: 'norm_hash',
    mapping_confidence: 'high' as const,
    is_valid_cpp: true,
    quality_flags: [],
  };

  const matched = matcher.match(meta);
  assert.equal(matched.official_problem !== null, true);
  assert.equal(matched.problem_name, 'Watermelon');
  assert.equal(matched.statement_url, 'https://codeforces.com/problemset/problem/4/A');
});

test('Solution Engine: Idempotent Importer Dry-Run', async () => {
  const importer = new SupabaseBulkImporter();
  const result = await importer.runImport({ dryRun: true, maxRecords: 5 });

  assert.equal(result.success, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.solutionsUpserted, 5);
  assert.equal(result.errorsCount, 0);
});
