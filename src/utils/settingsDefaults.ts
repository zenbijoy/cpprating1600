import {
  GlobalUserSettings,
  ThemeConfig,
  ProfileSettings,
  PrivacySettings,
  LocalizationPreferences,
  AccessibilitySettings,
  CompetitiveProgrammingPreferences,
  GuardianPreferences,
  ApplicationPreferences,
} from '../types/settings';
import { DEFAULT_THEME_CONFIG } from './themeEngine';

export const DEFAULT_CPP20_TEMPLATE = `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <numeric>
#include <map>
#include <set>
#include <queue>

using namespace std;

void solve() {
    // Fast independent logic
    int n;
    if (!(cin >> n)) return;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    long long ans = 0;
    cout << ans << "\\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t = 1;
    // cin >> t; // Uncomment if multiple test cases
    while (t--) {
        solve();
    }
    return 0;
}
`;

export const DEFAULT_CPP17_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

void solve() {
    // Solution code
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t = 1;
    // cin >> t;
    while (t--) solve();
    return 0;
}
`;

export const DEFAULT_C_TEMPLATE = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void solve() {
    int n;
    if (scanf("%d", &n) != 1) return;
    printf("%d\\n", n);
}

int main() {
    int t = 1;
    // scanf("%d", &t);
    while (t--) {
        solve();
    }
    return 0;
}
`;

export const DEFAULT_PYTHON_TEMPLATE = `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # Process logic
    pass

if __name__ == '__main__':
    solve()
`;

export const DEFAULT_JS_TEMPLATE = `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // Process input
    console.log(input.join(' '));
}

solve();
`;

export const DEFAULT_JAVA_TEMPLATE = `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        System.out.println(line);
    }
}
`;

export const DEFAULT_GLOBAL_SETTINGS: GlobalUserSettings = {
  theme: DEFAULT_THEME_CONFIG,
  profile: {
    displayName: 'Competitive Programmer',
    avatar: '',
    bio: 'Climbing to Codeforces Specialist (1600) with independent algorithmic reasoning.',
    country: '',
    preferredLanguage: 'cpp20',
    experienceLevel: 'some_experience',
    learningGoals: ['reach_1600_rating', 'master_dynamic_programming', 'two_pointers_fluency'],
    preferredTopics: ['greedy', 'dp', 'binary search', 'two pointers', 'data structures'],
    targetRating: 1600,
    weeklyGoalHours: 10,
  },
  privacy: {
    profileVisibility: 'public',
    showActivityStatus: true,
    shareAchievements: true,
    personalizedRecommendations: true,
    telemetryEnabled: false,
  },
  localization: {
    language: 'en',
    timeZone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '12h',
    weekStart: 'monday',
  },
  accessibility: {
    fontSize: 'standard',
    reducedMotion: false,
    highContrast: false,
    clearFocusIndicators: true,
    screenReaderLabels: true,
    density: 'comfortable',
    sidebarBehavior: 'expanded',
    tooltipsEnabled: true,
    confirmDestructiveActions: true,
  },
  competitiveProgramming: {
    defaultLanguage: 'cpp20',
    defaultDifficultyMin: 800,
    defaultDifficultyMax: 1600,
    preferredTags: ['implementation', 'math', 'greedy', 'dp', 'binary search'],
    dailyTargetMinutes: 45,
    weeklyTargetProblems: 15,
    targetRating: 1600,
    trainingIntensity: 'standard',
    recommendationBehavior: 'adaptive',
    defaultSort: 'rating_asc',
    defaultFilter: 'unsolved_only',
    editorTheme: 'vs-dark',
    editorFontSize: 14,
    editorTabSize: 4,
    lineNumbers: true,
    wordWrap: false,
    codeFontFamily: 'JetBrains Mono',
    codeTemplates: {
      javascript: DEFAULT_JS_TEMPLATE,
      python: DEFAULT_PYTHON_TEMPLATE,
      cpp20: DEFAULT_CPP20_TEMPLATE,
      cpp17: DEFAULT_CPP17_TEMPLATE,
      c: DEFAULT_C_TEMPLATE,
      java: DEFAULT_JAVA_TEMPLATE,
    },
  },
  guardian: {
    guardianEnabled: true,
    focusSessionDurationMinutes: 45,
    breakDurationMinutes: 10,
    dailyFocusMinutesGoal: 90,
    breathingDelaySeconds: 15,
    strictBlocking: false,
    scheduledStudyStart: '19:00',
    scheduledStudyEnd: '21:00',
    studyProtectionDays: [1, 2, 3, 4, 5],
    sessionCompletionSound: true,
    blockedPackages: [
      'com.instagram.android',
      'com.zhiliaoapp.musically',
      'com.facebook.katana',
      'com.twitter.android',
      'com.netflix.mediaclient',
    ],
    blockedDomains: [
      'instagram.com',
      'tiktok.com',
      'facebook.com',
      'twitter.com',
      'netflix.com',
      'reddit.com',
    ],
  },
  app: {
    defaultLandingTab: 'dashboard',
    rememberProblemFilters: true,
    autoRefreshData: true,
    confirmBeforeLeavingUnsaved: true,
    showOnboardingTips: true,
    enableKeyboardShortcuts: true,
    autoOpenProblemFromNotification: true,
    showSplashScreenOnLaunch: 'always',
  },
  lastUpdated: new Date().toISOString(),
};

export function mergeWithDefaultSettings(saved?: Partial<GlobalUserSettings> | null): GlobalUserSettings {
  if (!saved) return { ...DEFAULT_GLOBAL_SETTINGS, lastUpdated: new Date().toISOString() };

  return {
    theme: { ...DEFAULT_GLOBAL_SETTINGS.theme, ...(saved.theme || {}) },
    profile: { ...DEFAULT_GLOBAL_SETTINGS.profile, ...(saved.profile || {}) },
    privacy: { ...DEFAULT_GLOBAL_SETTINGS.privacy, ...(saved.privacy || {}) },
    localization: { ...DEFAULT_GLOBAL_SETTINGS.localization, ...(saved.localization || {}) },
    accessibility: { ...DEFAULT_GLOBAL_SETTINGS.accessibility, ...(saved.accessibility || {}) },
    competitiveProgramming: {
      ...DEFAULT_GLOBAL_SETTINGS.competitiveProgramming,
      ...(saved.competitiveProgramming || {}),
      codeTemplates: {
        ...DEFAULT_GLOBAL_SETTINGS.competitiveProgramming.codeTemplates,
        ...(saved.competitiveProgramming?.codeTemplates || {}),
      },
    },
    guardian: {
      ...DEFAULT_GLOBAL_SETTINGS.guardian,
      ...(saved.guardian || {}),
      blockedPackages: saved.guardian?.blockedPackages || DEFAULT_GLOBAL_SETTINGS.guardian.blockedPackages,
      blockedDomains: saved.guardian?.blockedDomains || DEFAULT_GLOBAL_SETTINGS.guardian.blockedDomains,
      studyProtectionDays: saved.guardian?.studyProtectionDays || DEFAULT_GLOBAL_SETTINGS.guardian.studyProtectionDays,
    },
    app: { ...DEFAULT_GLOBAL_SETTINGS.app, ...(saved.app || {}) },
    lastUpdated: saved.lastUpdated || new Date().toISOString(),
  };
}
