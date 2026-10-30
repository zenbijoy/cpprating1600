import crypto from 'crypto';
import path from 'path';
import { MappingConfidence } from './types';

export interface ExtractedMetadata {
  raw_filename: string;
  problem_id: string | null;
  contest_id: number | null;
  problem_index: string | null;
  problem_name: string | null;
  compiler_standard: string;
  author: string | null;
  source_sha256: string;
  normalized_sha256: string;
  mapping_confidence: MappingConfidence;
  is_valid_cpp: boolean;
  quality_flags: string[];
}

export function normalizeCppCode(source: string): string {
  // 1. Normalize line endings to \n
  let normalized = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove block comments /* ... */
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. Remove single-line comments // ...
  normalized = normalized.replace(/\/\/[^\n]*/g, '');

  // 4. Collapse consecutive whitespace & trim lines
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.join('\n');
}

export function extractMetadataFromContent(
  rawBytes: Buffer,
  relPath: string,
  defaultAuthor: string
): ExtractedMetadata {
  const sourceCode = rawBytes.toString('utf-8');
  const baseName = path.basename(relPath);
  const qualityFlags: string[] = [];

  // SHA-256 calculation
  const source_sha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
  const normalizedCode = normalizeCppCode(sourceCode);
  const normalized_sha256 = crypto.createHash('sha256').update(normalizedCode, 'utf-8').digest('hex');

  // Basic C++ validity checks
  let is_valid_cpp = true;
  if (sourceCode.length < 25) {
    is_valid_cpp = false;
    qualityFlags.push('file_too_small');
  }

  const hasInclude = /#include\s*[<"][a-zA-Z0-9_\.\/]+[>"]/.test(sourceCode);
  const hasMain = /(?:int|void|signed)\s+main\s*\(/.test(sourceCode);

  if (!hasInclude && !hasMain) {
    is_valid_cpp = false;
    qualityFlags.push('missing_cpp_structure');
  }

  // Compiler standard detection
  let compiler_standard = 'c++17';
  if (/std::ranges|std::views|concept\s+[a-zA-Z0-9_]+\s*=|#include\s*<ranges>|#include\s*<concepts>/.test(sourceCode)) {
    compiler_standard = 'c++20';
  }

  // Author detection from source comments
  let author = defaultAuthor;
  const authorMatch = sourceCode.match(/(?:Author|Created by|By|Written by)\s*[:\-]?\s*([a-zA-Z0-9_\-\s]{3,30})/i);
  if (authorMatch && authorMatch[1].trim().length > 2) {
    const candidate = authorMatch[1].trim();
    if (!/^(unknown|none|admin|problem|solution)$/i.test(candidate)) {
      author = candidate;
    }
  }

  // Problem extraction heuristics
  let contest_id: number | null = null;
  let problem_index: string | null = null;
  let problem_name: string | null = null;
  let problem_id: string | null = null;
  let mapping_confidence: MappingConfidence = 'unmatched';

  // Signal 1: Explicit Codeforces URL in comment
  // e.g. https://codeforces.com/problemset/problem/1000/A or https://codeforces.com/contest/1000/problem/A
  const urlMatch = sourceCode.match(/codeforces\.com\/(?:problemset\/problem|contest)\/(\d+)\/(?:problem\/)?([A-Za-z0-9]+)/i);
  if (urlMatch) {
    contest_id = parseInt(urlMatch[1], 10);
    problem_index = urlMatch[2].toUpperCase();
    problem_id = `${contest_id}${problem_index}`;
    mapping_confidence = 'high';
  }

  // Signal 2: Comment with Problem # (e.g. cbarnson "// Problem #  : 1030A")
  if (!problem_id) {
    const commentMatch = sourceCode.match(/\/\/\s*Problem\s*#?\s*:\s*(\d{1,5})([A-Za-z]\d?)/i);
    if (commentMatch) {
      contest_id = parseInt(commentMatch[1], 10);
      problem_index = commentMatch[2].toUpperCase();
      problem_id = `${contest_id}${problem_index}`;
      mapping_confidence = 'high';
    }
  }

  // Signal 3: DionysiosB filename pattern e.g. "1000A-CodehorsesTshirts.cpp"
  if (!problem_id) {
    const matchDionysios = baseName.match(/^(\d{1,5})([A-Za-z]\d?)-(.*)\.(?:cpp|cc|cxx)$/i);
    if (matchDionysios) {
      contest_id = parseInt(matchDionysios[1], 10);
      problem_index = matchDionysios[2].toUpperCase();
      problem_name = matchDionysios[3].replace(/([a-z])([A-Z])/g, '$1 $2');
      problem_id = `${contest_id}${problem_index}`;
      mapping_confidence = 'high';
    }
  }

  // Signal 4: Shah-Shishir filename pattern e.g. "1000A. Codehorses T-shirts.cpp"
  if (!problem_id) {
    const matchShishir = baseName.match(/^(\d{1,5})([A-Za-z]\d?)\.\s*(.*)\.(?:cpp|cc|cxx)$/i);
    if (matchShishir) {
      contest_id = parseInt(matchShishir[1], 10);
      problem_index = matchShishir[2].toUpperCase();
      problem_name = matchShishir[3].trim();
      problem_id = `${contest_id}${problem_index}`;
      mapping_confidence = 'high';
    }
  }

  // Signal 5: Direct pattern "1030A.cc" or "4A.cpp"
  if (!problem_id) {
    const matchDirect = baseName.match(/^(\d{1,5})([A-Za-z]\d?)\.(?:cpp|cc|cxx)$/i);
    if (matchDirect) {
      contest_id = parseInt(matchDirect[1], 10);
      problem_index = matchDirect[2].toUpperCase();
      problem_id = `${contest_id}${problem_index}`;
      mapping_confidence = 'high';
    }
  }

  // Signal 6: Path pattern e.g. "1030/A.cpp" or "Contest_1030/A.cpp"
  if (!problem_id) {
    const matchPath = relPath.match(/(?:^|[\/\\])(?:contest[_\s]*)?(\d{1,5})[\/\\]([A-Za-z]\d?)\.(?:cpp|cc|cxx)$/i);
    if (matchPath) {
      contest_id = parseInt(matchPath[1], 10);
      problem_index = matchPath[2].toUpperCase();
      problem_id = `${contest_id}${problem_index}`;
      mapping_confidence = 'high';
    }
  }

  // Signal 7: Problem index + title e.g. "A_Again_Twenty_Five.cpp"
  if (!problem_id) {
    const matchIndexTitle = baseName.match(/^([A-Za-z]\d?)_(.+)\.(?:cpp|cc|cxx)$/i);
    if (matchIndexTitle) {
      problem_index = matchIndexTitle[1].toUpperCase();
      problem_name = matchIndexTitle[2].replace(/_/g, ' ').trim();
      mapping_confidence = 'medium'; // Needs dictionary validation
    }
  }

  return {
    raw_filename: baseName,
    problem_id,
    contest_id,
    problem_index,
    problem_name,
    compiler_standard,
    author,
    source_sha256,
    normalized_sha256,
    mapping_confidence,
    is_valid_cpp,
    quality_flags: qualityFlags,
  };
}
