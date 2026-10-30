export type ComplexityCategory =
  | 'O(1)'
  | 'O(log N)'
  | 'O(N)'
  | 'O(N log N)'
  | 'O(N^2)'
  | 'O(N^3)'
  | 'O(2^N)';

export interface ComplexityEstimate {
  estimatedOperations: number;
  willPassTimeLimit: boolean;
  timeLimitRecommendation: string;
  typicalMaxN: string;
}

export function estimateComplexity(
  n: number,
  complexity: ComplexityCategory,
  timeLimitSec: number = 1.0
): ComplexityEstimate {
  const safeOpsLimit = timeLimitSec * 1e8; // Codeforces ~ 10^8 operations per second
  let ops = 0;

  switch (complexity) {
    case 'O(1)':
      ops = 1;
      break;
    case 'O(log N)':
      ops = Math.max(1, Math.round(Math.log2(Math.max(1, n))));
      break;
    case 'O(N)':
      ops = n;
      break;
    case 'O(N log N)':
      ops = Math.max(1, Math.round(n * Math.log2(Math.max(1, n))));
      break;
    case 'O(N^2)':
      ops = Math.pow(n, 2);
      break;
    case 'O(N^3)':
      ops = Math.pow(n, 3);
      break;
    case 'O(2^N)':
      ops = Math.pow(2, Math.min(60, n));
      break;
  }

  const willPass = ops <= safeOpsLimit;
  let recommendation = '';
  if (willPass) {
    recommendation = `Safe for 1.0s limit (~${ops.toLocaleString()} operations <= 10^8).`;
  } else {
    recommendation = `High risk of Time Limit Exceeded (TLE)! Estimated ~${ops.toLocaleString()} operations exceeds 10^8 threshold.`;
  }

  let typicalMaxN = '';
  switch (complexity) {
    case 'O(1)':
    case 'O(log N)':
      typicalMaxN = 'N <= 10^18';
      break;
    case 'O(N)':
    case 'O(N log N)':
      typicalMaxN = 'N <= 10^5 to 5*10^5';
      break;
    case 'O(N^2)':
      typicalMaxN = 'N <= 2000';
      break;
    case 'O(N^3)':
      typicalMaxN = 'N <= 400';
      break;
    case 'O(2^N)':
      typicalMaxN = 'N <= 25';
      break;
  }

  return {
    estimatedOperations: ops,
    willPassTimeLimit: willPass,
    timeLimitRecommendation: recommendation,
    typicalMaxN,
  };
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  lineNumberA?: number;
  lineNumberB?: number;
}

/**
 * Line-by-line code diff generator for version comparison
 */
export function computeLineDiff(textA: string = '', textB: string = ''): DiffLine[] {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const result: DiffLine[] = [];

  let idxA = 0;
  let idxB = 0;

  while (idxA < linesA.length || idxB < linesB.length) {
    if (idxA < linesA.length && idxB < linesB.length) {
      if (linesA[idxA] === linesB[idxB]) {
        result.push({
          type: 'unchanged',
          text: linesA[idxA],
          lineNumberA: idxA + 1,
          lineNumberB: idxB + 1,
        });
        idxA++;
        idxB++;
      } else {
        // Simple forward lookahead
        if (linesB.includes(linesA[idxA])) {
          result.push({
            type: 'added',
            text: linesB[idxB],
            lineNumberB: idxB + 1,
          });
          idxB++;
        } else {
          result.push({
            type: 'removed',
            text: linesA[idxA],
            lineNumberA: idxA + 1,
          });
          idxA++;
        }
      }
    } else if (idxA < linesA.length) {
      result.push({
        type: 'removed',
        text: linesA[idxA],
        lineNumberA: idxA + 1,
      });
      idxA++;
    } else {
      result.push({
        type: 'added',
        text: linesB[idxB],
        lineNumberB: idxB + 1,
      });
      idxB++;
    }
  }

  return result;
}

export interface BoundaryChecklistState {
  nEqualsOne: boolean;
  emptyOrZero: boolean;
  allIdentical: boolean;
  overflowChecked: boolean;
  indexingChecked: boolean;
  fastIoPresent: boolean;
}

export const defaultBoundaryChecklist: BoundaryChecklistState = {
  nEqualsOne: false,
  emptyOrZero: false,
  allIdentical: false,
  overflowChecked: false,
  indexingChecked: false,
  fastIoPresent: false,
};
