import test from 'node:test';
import assert from 'node:assert/strict';

// Helper simulating guardian classification logic
const CURATED_CP_PROBLEMS = [
  { id: '4A', name: 'Watermelon', rating: 800, tags: ['brute force', 'math'] },
  { id: '71A', name: 'Way Too Long Words', rating: 800, tags: ['strings'] },
  { id: '1352C', name: 'K-th Not Divisible by n', rating: 1200, tags: ['binary search', 'math'] },
  { id: '455A', name: 'Boredom', rating: 1500, tags: ['dp'] },
];

function classifyActivityLogic(payload: {
  packageName?: string;
  appName?: string;
  screenTitle?: string;
  isStudySessionActive?: boolean;
  userRating?: number;
  hardLockEnabled?: boolean;
}) {
  const pkg = (payload.packageName || '').toLowerCase();
  const title = (payload.screenTitle || '').toLowerCase();
  const hardLockEnabled = payload.hardLockEnabled !== false;

  let primaryCategory = 'unknown';
  let confidence = 0.80;

  if (
    pkg === 'com.termux' ||
    pkg === 'com.spck.cide' ||
    pkg.includes('codeforces') ||
    title.includes('codeforces')
  ) {
    primaryCategory = 'competitive_programming';
    confidence = 0.98;
  } else if (
    title.includes('pornhub') ||
    title.includes('xvideos') ||
    pkg.includes('adult')
  ) {
    primaryCategory = 'potentially_explicit_content';
    confidence = 0.95;
  } else if (
    pkg.includes('instagram') ||
    pkg.includes('tiktok') ||
    pkg.includes('facebook')
  ) {
    primaryCategory = 'social_media';
    confidence = 0.95;
  } else if (pkg.includes('youtube')) {
    const isEducational = title.includes('codeforces') || title.includes('algorithm') || title.includes('lecture');
    primaryCategory = isEducational ? 'programming_learning' : 'entertainment';
    confidence = 0.88;
  }

  let recommendedAction = 'allow';
  if (primaryCategory === 'potentially_explicit_content') {
    recommendedAction = (confidence >= 0.70 && hardLockEnabled) ? 'hard_lock' : 'warn_distraction';
  } else if (primaryCategory === 'entertainment' || primaryCategory === 'social_media') {
    recommendedAction = 'warn_distraction';
  }

  return {
    primary_category: primaryCategory,
    confidence,
    recommended_action: recommendedAction,
    problem_recommendation: CURATED_CP_PROBLEMS[0],
    screenshot_used: false,
    raw_text_redacted: true,
  };
}

test('Guardian Classifier: classifies competitive programming platforms and allows activity', () => {
  const res = classifyActivityLogic({
    packageName: 'com.termux',
    screenTitle: 'vim solution.cpp',
    isStudySessionActive: true,
  });

  assert.equal(res.primary_category, 'competitive_programming');
  assert.equal(res.recommended_action, 'allow');
  assert.ok(res.confidence >= 0.95);
  assert.equal(res.screenshot_used, false);
});

test('Guardian Classifier: flags social media as distraction warning', () => {
  const res = classifyActivityLogic({
    packageName: 'com.instagram.android',
    isStudySessionActive: true,
  });

  assert.equal(res.primary_category, 'social_media');
  assert.equal(res.recommended_action, 'warn_distraction');
  assert.ok(res.confidence >= 0.90);
});

test('Guardian Classifier: triggers hard_lock when potentially_explicit_content is detected with high confidence', () => {
  const res = classifyActivityLogic({
    packageName: 'com.android.chrome',
    screenTitle: 'pornhub - browser tab',
    hardLockEnabled: true,
  });

  assert.equal(res.primary_category, 'potentially_explicit_content');
  assert.equal(res.recommended_action, 'hard_lock');
  assert.ok(res.confidence >= 0.70);
});

test('Guardian Classifier: falls back to warn_distraction when hardLockEnabled is false', () => {
  const res = classifyActivityLogic({
    packageName: 'com.android.chrome',
    screenTitle: 'pornhub - browser tab',
    hardLockEnabled: false,
  });

  assert.equal(res.primary_category, 'potentially_explicit_content');
  assert.equal(res.recommended_action, 'warn_distraction');
});

test('Guardian Classifier: recognizes YouTube algorithm lectures as programming_learning', () => {
  const res = classifyActivityLogic({
    packageName: 'com.google.android.youtube',
    screenTitle: 'Errichto - Dynamic Programming Algorithm Lecture',
    isStudySessionActive: true,
  });

  assert.equal(res.primary_category, 'programming_learning');
  assert.equal(res.recommended_action, 'allow');
});
