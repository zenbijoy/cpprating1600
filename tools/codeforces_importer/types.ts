export interface RepositoryConfig {
  full_name: string;
  clone_url: string;
  default_branch: string;
  license_spdx: string;
  license_file: string;
  redistribution_permitted: boolean;
  author_attribution: string;
}

export type MappingConfidence = 'high' | 'medium' | 'low' | 'unmatched';
export type ValidationStatus =
  | 'source_checked'
  | 'compiled'
  | 'sample_passed'
  | 'sample_failed'
  | 'compilation_failed'
  | 'needs_review'
  | 'rejected';

export interface SourceProvenance {
  source_repository: string;
  source_repository_url: string;
  source_commit: string;
  source_file_path: string;
  original_author: string;
  license_spdx: string;
  imported_at: string;
}

export interface SolutionManifestItem {
  id: string; // Deterministic hash UUID based on normalized sha256 + problem_id
  problem_id: string | null; // e.g. "1000A"
  contest_id: number | null;
  problem_index: string | null;
  problem_name: string | null;
  language: string; // 'cpp'
  compiler_standard: string; // 'c++17' or 'c++20'
  source_code: string;
  source_sha256: string;
  normalized_sha256: string;
  source_repository: string;
  source_repository_url: string;
  source_commit: string;
  source_file_path: string;
  original_author: string;
  license_spdx: string;
  license_verified: boolean;
  mapping_confidence: MappingConfidence;
  validation_status: ValidationStatus;
  validation_notes?: string;
  is_public: boolean;
  provenance: SourceProvenance[];
}

export interface DuplicateReport {
  exact_duplicates_count: number;
  normalized_duplicates_count: number;
  duplicate_groups: Array<{
    hash: string;
    type: 'exact' | 'normalized';
    canonical_id: string;
    total_occurrences: number;
    locations: Array<{
      repo: string;
      file_path: string;
    }>;
  }>;
}

export interface IngestionSummary {
  timestamp: string;
  repositories_scanned: number;
  total_files_discovered: number;
  license_approved_files: number;
  license_excluded_files: number;
  valid_cpp_files: number;
  reliably_matched: number;
  unmatched_review_queue: number;
  unique_solutions: number;
  exact_duplicates: number;
  normalized_duplicates: number;
  validation_breakdown: Record<ValidationStatus, number>;
}
