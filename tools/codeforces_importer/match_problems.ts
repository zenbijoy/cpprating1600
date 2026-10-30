import fs from 'fs';
import path from 'path';
import { ExtractedMetadata } from './extract_metadata';

export interface OfficialProblem {
  contestId: number;
  index: string;
  name: string;
  type: string;
  rating?: number;
  tags: string[];
}

export interface MatchedResult extends ExtractedMetadata {
  official_problem: OfficialProblem | null;
  statement_url: string | null;
}

export class ProblemMatcher {
  private exactLookup: Map<string, OfficialProblem> = new Map();
  private nameIndexLookup: Map<string, OfficialProblem> = new Map();

  constructor(officialProblemsPath?: string) {
    const filePath =
      officialProblemsPath ||
      path.resolve(process.cwd(), 'data/codeforces/official_problems.json');

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const list: OfficialProblem[] = JSON.parse(raw);
        for (const p of list) {
          const key = `${p.contestId}_${p.index.toUpperCase()}`;
          this.exactLookup.set(key, p);

          const normName = this.normalizeName(p.name);
          const nameKey = `${normName}_${p.index.toUpperCase()}`;
          if (!this.nameIndexLookup.has(nameKey)) {
            this.nameIndexLookup.set(nameKey, p);
          }
        }
        console.log(`[ProblemMatcher] Indexed ${list.length} official Codeforces problems.`);
      } catch (err: any) {
        console.warn(`[ProblemMatcher] Failed to parse official problems: ${err.message}`);
      }
    } else {
      console.warn(`[ProblemMatcher] Official problems file not found at ${filePath}`);
    }
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  public match(meta: ExtractedMetadata): MatchedResult {
    let official: OfficialProblem | null = null;

    // 1. Exact match by Contest ID + Problem Index
    if (meta.contest_id && meta.problem_index) {
      const key = `${meta.contest_id}_${meta.problem_index.toUpperCase()}`;
      const found = this.exactLookup.get(key);
      if (found) {
        official = found;
        meta.problem_name = found.name;
        meta.problem_id = `${found.contestId}${found.index}`;
        meta.mapping_confidence = 'high';
      }
    }

    // 2. Fallback match by Problem Index + Name if contest_id is missing or unverified
    if (!official && meta.problem_name && meta.problem_index) {
      const normName = this.normalizeName(meta.problem_name);
      const nameKey = `${normName}_${meta.problem_index.toUpperCase()}`;
      const found = this.nameIndexLookup.get(nameKey);
      if (found) {
        official = found;
        meta.contest_id = found.contestId;
        meta.problem_id = `${found.contestId}${found.index}`;
        meta.problem_name = found.name;
        meta.mapping_confidence = 'medium';
      }
    }

    let statement_url: string | null = null;
    if (meta.contest_id && meta.problem_index) {
      statement_url = `https://codeforces.com/problemset/problem/${meta.contest_id}/${meta.problem_index}`;
    }

    return {
      ...meta,
      official_problem: official,
      statement_url,
    };
  }
}
