import { describe, it } from 'node:test';
import assert from 'node:assert';
import { tokenizeCode, parseProblemMetadata } from './codeTokenizer';

describe('Code Tokenizer & Metadata Parser', () => {
  it('correctly parses structured metadata from problem header comment', () => {
    const sample = `/**
 * ==================================================================
 * Codeforces Problem 2242B: Predominant Frequency Division
 * Link: https://codeforces.com/problemset/problem/2242/B
 * Difficulty: ★ 1000 | Topic Tags: data structures, greedy, implementation, math
 * ==================================================================
 * Algorithmic Strategy: Greedy Choice Property
 * - Sorting/prioritizing extreme values to guarantee optimal sub-decisions.
 * - Invariant: Local optimal selection does not restrict optimal global states.
 * - Time Complexity: O(N log N) dominated by sorting
 * - Space Complexity: O(1) auxiliary
 * Standards: Modern C++20 with Fast I/O
 * License: MIT Permissive Open Source
 * ==================================================================
 */`;

    const meta = parseProblemMetadata(sample);
    assert.strictEqual(meta.problemId, '2242B');
    assert.strictEqual(meta.problemName, 'Predominant Frequency Division');
    assert.strictEqual(meta.difficulty, '1000');
    assert.strictEqual(meta.strategy, 'Greedy Choice Property');
    assert.ok(meta.topicTags.includes('greedy'));
    assert.ok(meta.topicTags.includes('data structures'));
    assert.strictEqual(meta.timeComplexity, 'O(N log N) dominated by sorting');
    assert.strictEqual(meta.spaceComplexity, 'O(1) auxiliary');
    assert.strictEqual(meta.standards, 'Modern C++20 with Fast I/O');
    assert.strictEqual(meta.license, 'MIT Permissive Open Source');
  });

  it('correctly tokenizes C++ includes, keywords, types, and functions', () => {
    const code = `#include <iostream>
#include <vector>

using namespace std;
using ll = long long;

void solve() {
    int n;
    cin >> n;
    vector<ll> a(n);
    cout << "Answer: " << 1000000007 << "\\n";
}`;

    const lines = tokenizeCode(code);
    assert.strictEqual(lines.length, 12);

    // Line 1: #include <iostream>
    const line1 = lines[0];
    assert.ok(line1.tokens.some((t) => t.type === 'directive' && t.text === '#include'));
    assert.ok(line1.tokens.some((t) => t.type === 'header' && t.text === '<iostream>'));

    // Line 4: using namespace std;
    const line4 = lines[3];
    assert.ok(line4.tokens.some((t) => t.type === 'keyword' && t.text === 'using'));
    assert.ok(line4.tokens.some((t) => t.type === 'keyword' && t.text === 'namespace'));
    assert.ok(line4.tokens.some((t) => t.type === 'keyword' && t.text === 'std'));

    // Line 5: using ll = long long;
    const line5 = lines[4];
    assert.ok(line5.tokens.some((t) => t.type === 'type' && t.text === 'll'));
    assert.ok(line5.tokens.some((t) => t.type === 'keyword' && t.text === 'long'));

    // Line 7: void solve()
    const line7 = lines[6];
    assert.ok(line7.tokens.some((t) => t.type === 'keyword' && t.text === 'void'));
    assert.ok(line7.tokens.some((t) => t.type === 'function' && t.text === 'solve'));

    // Line 11: cout << "Answer: " << 1000000007 << "\n";
    const line11 = lines[10];
    assert.ok(line11.tokens.some((t) => t.type === 'function' && t.text === 'cout'));
    assert.ok(line11.tokens.some((t) => t.type === 'string' && t.text === '"Answer: "'));
    assert.ok(line11.tokens.some((t) => t.type === 'number' && t.text === '1000000007'));
  });

  it('correctly handles multi-line block comments with meta tags', () => {
    const code = `/**
 * Algorithmic Strategy: Greedy Choice Property
 * Time Complexity: O(N)
 */
int x = 42;`;

    const lines = tokenizeCode(code);
    assert.strictEqual(lines.length, 5);
    const line2 = lines[1];
    assert.ok(line2.tokens.some((t) => t.type === 'comment-meta' && t.text.includes('Algorithmic Strategy:')));

    const line5 = lines[4];
    assert.ok(line5.tokens.some((t) => t.type === 'keyword' && t.text === 'int'));
    assert.ok(line5.tokens.some((t) => t.type === 'number' && t.text === '42'));
  });
});
