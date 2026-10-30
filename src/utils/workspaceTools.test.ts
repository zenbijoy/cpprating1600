import { describe, it } from 'node:test';
import assert from 'node:assert';
import { estimateComplexity, computeLineDiff } from './workspaceTools';

describe('Feature 2: Debugging Workspace Tools', () => {
  it('correctly predicts TLE for O(N^2) on N=100,000', () => {
    const est = estimateComplexity(100000, 'O(N^2)');
    assert.strictEqual(est.willPassTimeLimit, false);
    assert.strictEqual(est.estimatedOperations, 10000000000); // 10^10 > 10^8
    assert.ok(est.timeLimitRecommendation.includes('High risk of Time Limit Exceeded'));
  });

  it('correctly passes O(N log N) for N=100,000 within 1.0s limit', () => {
    const est = estimateComplexity(100000, 'O(N log N)');
    assert.strictEqual(est.willPassTimeLimit, true);
    assert.ok(est.estimatedOperations < 1e8);
    assert.ok(est.timeLimitRecommendation.includes('Safe for 1.0s limit'));
  });

  it('computes line-by-line code diffs accurately for version comparison', () => {
    const codeA = `int main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b;\n}`;
    const codeB = `int main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b;\n}`;

    const diff = computeLineDiff(codeA, codeB);
    assert.ok(diff.some((d) => d.type === 'removed' && d.text.includes('int a, b;')));
    assert.ok(diff.some((d) => d.type === 'added' && d.text.includes('long long a, b;')));
    assert.ok(diff.some((d) => d.type === 'unchanged' && d.text.includes('cin >> a >> b;')));
  });
});
