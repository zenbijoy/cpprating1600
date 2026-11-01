import test from 'node:test';
import assert from 'node:assert/strict';
import { isOldDefaultSolution, getDefaultTemplateForLanguage } from './codeTemplateUtils';

test('codeTemplateUtils: identifies old default solution snippets', () => {
  // 4A Watermelon full solution
  const watermelonSolCpp = `#include <iostream>
using namespace std;
int main() {
    int w;
    if (cin >> w) {
        if (w > 2 && w % 2 == 0) cout << "YES\\n";
        else cout << "NO\\n";
    }
    return 0;
}`;
  assert.equal(isOldDefaultSolution('4A', watermelonSolCpp), true);
  assert.equal(isOldDefaultSolution('CF4A', watermelonSolCpp), true);

  // 71A Way Too Long Words
  const wayTooLongSol = `if (s.length() > 10) cout << s[0] << s.length() - 2 << s[s.length() - 1];`;
  assert.equal(isOldDefaultSolution('71A', wayTooLongSol), true);

  // 231A Team
  const teamSol = `if (a + b + c >= 2) ans++;`;
  assert.equal(isOldDefaultSolution('231A', teamSol), true);
});

test('codeTemplateUtils: does NOT misidentify clean starter templates as solutions', () => {
  const cleanCpp20 = getDefaultTemplateForLanguage('cpp20');
  assert.equal(isOldDefaultSolution('4A', cleanCpp20), false);
  assert.equal(isOldDefaultSolution('71A', cleanCpp20), false);
  assert.ok(cleanCpp20.includes('// Write your solution here'));
  assert.ok(!cleanCpp20.includes('w % 2 == 0'));

  const cleanPython = getDefaultTemplateForLanguage('python');
  assert.equal(isOldDefaultSolution('4A', cleanPython), false);
  assert.ok(cleanPython.includes('# Write your solution here'));
  assert.ok(!cleanPython.includes('w % 2 == 0'));
});

test('codeTemplateUtils: provides templates for all supported languages', () => {
  const languages = ['cpp20', 'cpp17', 'c', 'python', 'javascript', 'java'] as const;
  for (const lang of languages) {
    const template = getDefaultTemplateForLanguage(lang);
    assert.ok(template && template.length > 20, `Template for ${lang} must exist`);
    assert.ok(template.toLowerCase().includes('solution'), `Template for ${lang} should include placeholder`);
  }
});
