import { ProgrammingLanguage } from '../types';
import {
  DEFAULT_CPP20_TEMPLATE,
  DEFAULT_CPP17_TEMPLATE,
  DEFAULT_C_TEMPLATE,
  DEFAULT_PYTHON_TEMPLATE,
  DEFAULT_JS_TEMPLATE,
  DEFAULT_JAVA_TEMPLATE,
} from './settingsDefaults';
import { storageService } from '../services/storage';

export function getDefaultTemplateForLanguage(language: ProgrammingLanguage): string {
  const customTemplates = storageService.getSettings()?.competitiveProgramming?.codeTemplates;
  if (customTemplates?.[language]) {
    return customTemplates[language];
  }

  switch (language) {
    case 'cpp20':
      return DEFAULT_CPP20_TEMPLATE;
    case 'cpp17':
      return DEFAULT_CPP17_TEMPLATE;
    case 'c':
      return DEFAULT_C_TEMPLATE;
    case 'python':
      return DEFAULT_PYTHON_TEMPLATE;
    case 'javascript':
      return DEFAULT_JS_TEMPLATE;
    case 'java':
      return DEFAULT_JAVA_TEMPLATE;
    default:
      return DEFAULT_CPP20_TEMPLATE;
  }
}

/**
 * Checks whether a given piece of code is one of the old default answers/solutions
 * that were previously pre-populated by mistake into the problem workspace.
 */
export function isOldDefaultSolution(problemId: string, code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.replace(/\s+/g, ' ').trim();
  const pid = (problemId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. Watermelon 4A
  if (pid.includes('4A')) {
    if (normalized.includes('w > 2 && w % 2 == 0') || normalized.includes('w > 2 and w % 2 == 0') || normalized.includes('w > 2 && w % 2 === 0')) {
      return true;
    }
  }

  // 2. Way Too Long Words 71A
  if (pid.includes('71A')) {
    if (normalized.includes('.length() > 10') || normalized.includes('len(s) > 10') || normalized.includes('.length > 10')) {
      return true;
    }
  }

  // 3. Team 231A
  if (pid.includes('231A')) {
    if (normalized.includes('a + b + c >= 2') || normalized.includes('p + v + t >= 2') || normalized.includes('sum(views) >= 2')) {
      return true;
    }
  }

  // 4. Next Round 158A
  if (pid.includes('158A')) {
    if (normalized.includes('a[k - 1]') || normalized.includes('score >= threshold')) {
      return true;
    }
  }

  // 5. Bit++ 282A
  if (pid.includes('282A')) {
    if (normalized.includes('s.find("++")') || normalized.includes('\'++\' in s') || normalized.includes('s.includes("++")')) {
      return true;
    }
  }

  // 6. String Task 118A
  if (pid.includes('118A')) {
    if (normalized.includes('aoyeui') || normalized.includes('vowels.count')) {
      return true;
    }
  }

  // 7. Petya and Strings 112A
  if (pid.includes('112A')) {
    if (normalized.includes('tolower') || normalized.includes('.lower()') || normalized.includes('.toLowerCase()')) {
      return true;
    }
  }

  // 8. Helpful Maths 339A
  if (pid.includes('339A')) {
    if (normalized.includes('nums.push_back') || (normalized.includes('digits') && normalized.includes('sort'))) {
      return true;
    }
  }

  // 9. Beautiful Matrix 263A
  if (pid.includes('263A')) {
    if (normalized.includes('abs(r - 3) + abs(c - 3)') || normalized.includes('abs(i - 2) + abs(j - 2)')) {
      return true;
    }
  }

  // 10. Theatre Square 1A
  if (pid.includes('1A')) {
    if (normalized.includes('(n + a - 1) / a') || normalized.includes('(m + a - 1) / a')) {
      return true;
    }
  }

  // 11. Domino piling 50A
  if (pid.includes('50A')) {
    if (normalized.includes('(m * n) / 2') || normalized.includes('(m * n) // 2')) {
      return true;
    }
  }

  // 12. Stones on the Table 266A
  if (pid.includes('266A')) {
    if (normalized.includes('s[i] == s[i - 1]') || normalized.includes('s[i] === s[i - 1]')) {
      return true;
    }
  }

  // 13. Word Capitalization 281A
  if (pid.includes('281A')) {
    if (normalized.includes('toupper(s[0])') || normalized.includes('s[0].upper()') || normalized.includes('s[0].toUpperCase()')) {
      return true;
    }
  }

  // 14. Boy or Girl 236A
  if (pid.includes('236A')) {
    if (normalized.includes('distinct.size() % 2') || normalized.includes('len(set(s)) % 2')) {
      return true;
    }
  }

  // 15. Soldier and Bananas 546A
  if (pid.includes('546A')) {
    if (normalized.includes('total_cost - n') || normalized.includes('total - n')) {
      return true;
    }
  }

  // 16. Bear and Big Brother 791A
  if (pid.includes('791A')) {
    if ((normalized.includes('a *= 3') || normalized.includes('a = a * 3')) && (normalized.includes('b *= 2') || normalized.includes('b = b * 2'))) {
      return true;
    }
  }

  return false;
}
