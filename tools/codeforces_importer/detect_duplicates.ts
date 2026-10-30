import { SolutionManifestItem, DuplicateReport, SourceProvenance } from './types';

export interface DeduplicationResult {
  uniqueSolutions: SolutionManifestItem[];
  report: DuplicateReport;
}

export function deduplicateSolutions(items: SolutionManifestItem[]): DeduplicationResult {
  const exactMap = new Map<string, SolutionManifestItem>();
  const normalizedMap = new Map<string, SolutionManifestItem>();
  const duplicateGroups: DuplicateReport['duplicate_groups'] = [];

  let exactDupCount = 0;
  let normalizedDupCount = 0;

  for (const item of items) {
    // 1. Check Level A: Exact byte match
    const existingExact = exactMap.get(item.source_sha256);
    if (existingExact) {
      exactDupCount++;
      // Append provenance to canonical record
      existingExact.provenance.push(...item.provenance);

      // Track duplicate group
      let group = duplicateGroups.find((g) => g.hash === item.source_sha256 && g.type === 'exact');
      if (!group) {
        group = {
          hash: item.source_sha256,
          type: 'exact',
          canonical_id: existingExact.id,
          total_occurrences: 1,
          locations: [
            {
              repo: existingExact.source_repository,
              file_path: existingExact.source_file_path,
            },
          ],
        };
        duplicateGroups.push(group);
      }
      group.total_occurrences++;
      group.locations.push({
        repo: item.source_repository,
        file_path: item.source_file_path,
      });
      continue;
    }

    // 2. Check Level B: Normalized code match (same problem + same normalized hash)
    // Note: Deduplicate across the same problem ID to prevent false positives across trivial solutions (e.g. return 0)
    const normKey = `${item.problem_id || 'unmatched'}_${item.normalized_sha256}`;
    const existingNorm = normalizedMap.get(normKey);
    if (existingNorm) {
      normalizedDupCount++;
      existingNorm.provenance.push(...item.provenance);

      let group = duplicateGroups.find((g) => g.hash === normKey && g.type === 'normalized');
      if (!group) {
        group = {
          hash: normKey,
          type: 'normalized',
          canonical_id: existingNorm.id,
          total_occurrences: 1,
          locations: [
            {
              repo: existingNorm.source_repository,
              file_path: existingNorm.source_file_path,
            },
          ],
        };
        duplicateGroups.push(group);
      }
      group.total_occurrences++;
      group.locations.push({
        repo: item.source_repository,
        file_path: item.source_file_path,
      });
      continue;
    }

    // New unique solution
    exactMap.set(item.source_sha256, item);
    normalizedMap.set(normKey, item);
  }

  const uniqueSolutions = Array.from(exactMap.values());

  const report: DuplicateReport = {
    exact_duplicates_count: exactDupCount,
    normalized_duplicates_count: normalizedDupCount,
    duplicate_groups: duplicateGroups,
  };

  return { uniqueSolutions, report };
}
