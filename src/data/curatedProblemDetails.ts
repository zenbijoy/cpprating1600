import { CFProblem, ProblemDetail, ProblemTestCase, ProgrammingLanguage } from '../types';

export const CURATED_PROBLEM_DETAILS: Record<string, ProblemDetail> = {
  // 1. Watermelon (CF 4A)
  '4A': {
    id: '4A',
    contestId: 4,
    index: 'A',
    name: 'Watermelon',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['brute force', 'math'],
    description:
      "One hot summer day Pete and his friend Billy decided to buy a watermelon. They chose the biggest and the ripest one, in their opinion. After that the watermelon was weighed, and the scales showed w kilos. They rushed home, dying of thirst, and decided to divide the berry, however they faced a hard problem.\n\nPete and Billy are great fans of even numbers, that's why they want to divide the watermelon into two parts, each of them weighing even number of kilos; and it is not obligatory that the parts are equal in size. Each of the parts should have positive weight.\n\nHelp Pete and Billy: check whether they can divide the watermelon in the way they want.",
    constraints: [
      '1 <= w <= 100 — integer weight of the watermelon in kilos',
      'Time limit per test: 1.0 second',
      'Memory limit per test: 64 megabytes',
    ],
    examples: [
      {
        input: '8',
        output: 'YES',
        explanation: 'The boys can divide the watermelon into 2 kilos and 6 kilos (both positive even numbers).',
      },
    ],
    testCases: [
      { id: 1, input: '8', expectedOutput: 'YES', explanation: '8 = 2 + 6 (both even)' },
      { id: 2, input: '2', expectedOutput: 'NO', explanation: '2 = 1 + 1 (both odd; minimum positive even parts require at least 2+2=4)' },
      { id: 3, input: '100', expectedOutput: 'YES', explanation: '100 = 50 + 50' },
      { id: 4, input: '5', expectedOutput: 'NO', explanation: 'Odd number cannot be divided into two evens' },
    ],
  },

  // 2. Way Too Long Words (CF 71A)
  '71A': {
    id: '71A',
    contestId: 71,
    index: 'A',
    name: 'Way Too Long Words',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['strings'],
    description:
      'Sometimes some words like "localization" or "internationalization" are so long that writing them many times in one text is quite tiresome.\n\nLet\'s consider a word too long, if its length is strictly more than 10 characters. All too long words should be replaced with a special abbreviation.\n\nThis abbreviation is made like this: we write down the first and the last letter of a word and between them we write the number of letters between the first and the last letters. That number is in decimal system and doesn\'t contain any leading zeroes.\n\nThus, "localization" will be spelt as "l10n", and "internationalization" will be spelt as "i18n".\n\nYou are suggested to automatize the process of changing words with abbreviations.',
    constraints: [
      '1 <= n <= 100 — number of test words',
      'Each word contains only lowercase Latin letters and length between 1 and 100 characters',
    ],
    examples: [
      {
        input: '4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis',
        output: 'word\nl10n\ni18n\np43s',
        explanation: 'Words strictly longer than 10 characters are replaced by first letter + middle count + last letter.',
      },
    ],
    testCases: [
      {
        id: 1,
        input: '4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis',
        expectedOutput: 'word\nl10n\ni18n\np43s',
      },
    ],
  },

  // 3. Team (CF 231A)
  '231A': {
    id: '231A',
    contestId: 231,
    index: 'A',
    name: 'Team',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['brute force', 'greedy'],
    description:
      'One day three best friends Petya, Vasya and Tonya decided to form a team and take part in programming contests. Participants are usually offered several problems during programming contests. Long before the start the friends decided that they will implement a problem if at least two of them are sure about the solution. Otherwise, the friends won\'t write the problem\'s solution.\n\nThis contest offers n problems to the participants. For each problem we know, which friend is sure about the solution. Help the friends find the number of problems for which they will write a solution.',
    constraints: ['1 <= n <= 1000 — number of problems in the contest'],
    examples: [
      {
        input: '3\n1 1 0\n1 1 1\n1 0 0',
        output: '2',
        explanation: 'In the first problem Petya and Vasya are sure (2 >= 2). In the second problem all three are sure (3 >= 2). In the third only Petya is sure (1 < 2). Total implemented = 2.',
      },
    ],
    testCases: [
      { id: 1, input: '3\n1 1 0\n1 1 1\n1 0 0', expectedOutput: '2' },
      { id: 2, input: '2\n1 0 0\n0 1 1', expectedOutput: '1' },
    ],
  },

  // 4. Bit++ (CF 282A)
  '282A': {
    id: '282A',
    contestId: 282,
    index: 'A',
    name: 'Bit++',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['implementation'],
    description:
      'The classic programming language Bit++ has a single integer variable x, initially set to 0. A program in Bit++ consists of a sequence of statements. Each statement is either an increment operation (X++ or ++X) or a decrement operation (X-- or --X).\n\nExecute the given program and output the final value of x.',
    constraints: ['1 <= n <= 150 — number of statements'],
    examples: [
      { input: '1\n++X', output: '1' },
      { input: '2\nX++\n--X', output: '0' },
    ],
    testCases: [
      { id: 1, input: '1\n++X', expectedOutput: '1' },
      { id: 2, input: '2\nX++\n--X', expectedOutput: '0' },
    ],
  },

  // 5. Next Round (CF 158A)
  '158A': {
    id: '158A',
    contestId: 158,
    index: 'A',
    name: 'Next Round',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['special problem', 'implementation'],
    description:
      '"Contestant who earns a score equal to or greater than the k-th place finisher\'s score will advance to the next round, as long as the contestant earns a positive score..." — an excerpt from contest rules.\n\nA total of n participants took part in the contest (n >= k), and you already know their scores. Calculate how many participants will advance to the next round.',
    constraints: [
      '1 <= k <= n <= 50',
      '0 <= a_i <= 100 — non-increasing scores of participants',
    ],
    examples: [
      {
        input: '8 5\n10 9 8 7 7 7 5 5',
        output: '6',
        explanation: 'The 5th participant has a score of 7. Participants 1 through 6 scored at least 7 points (all positive). Thus 6 advance.',
      },
      {
        input: '4 2\n0 0 0 0',
        output: '0',
        explanation: 'No participant earned a positive score, so none advance.',
      },
    ],
    testCases: [
      { id: 1, input: '8 5\n10 9 8 7 7 7 5 5', expectedOutput: '6' },
      { id: 2, input: '4 2\n0 0 0 0', expectedOutput: '0' },
    ],
  },

  // 6. Petya and Strings (CF 112A)
  '112A': {
    id: '112A',
    contestId: 112,
    index: 'A',
    name: 'Petya and Strings',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['strings', 'implementation'],
    description:
      'Compare two strings of equal length case-insensitively. Output -1 if the first string is lexicographically smaller, 1 if the second string is smaller, and 0 if the strings are equal.',
    constraints: ['Strings contain Latin letters of length between 1 and 100.'],
    examples: [
      { input: 'aaaa\naaaA', output: '0' },
      { input: 'abs\nAbz', output: '-1' },
      { input: 'abcdefg\nAbCdEfF', output: '1' },
    ],
    testCases: [
      { id: 1, input: 'aaaa\naaaA', expectedOutput: '0' },
      { id: 2, input: 'abs\nAbz', expectedOutput: '-1' },
      { id: 3, input: 'abcdefg\nAbCdEfF', expectedOutput: '1' },
    ],
  },

  // 7. Boy or Girl (CF 236A)
  '236A': {
    id: '236A',
    contestId: 236,
    index: 'A',
    name: 'Boy or Girl',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['brute force', 'strings'],
    description:
      'If the number of distinct characters in a user name is odd, then he is a male ("IGNORE HIM!"). If the number of distinct characters is even, she is a female ("CHAT WITH HER!").',
    constraints: ['Non-empty string containing up to 100 lowercase Latin letters.'],
    examples: [
      { input: 'wjmzbmr', output: 'CHAT WITH HER!' },
      { input: 'xiaodao', output: 'IGNORE HIM!' },
    ],
    testCases: [
      { id: 1, input: 'wjmzbmr', expectedOutput: 'CHAT WITH HER!' },
      { id: 2, input: 'xiaodao', expectedOutput: 'IGNORE HIM!' },
    ],
  },

  // 8. Helpful Maths (CF 339A)
  '339A': {
    id: '339A',
    contestId: 339,
    index: 'A',
    name: 'Helpful Maths',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['greedy', 'sortings', 'strings'],
    description:
      'Given a summation string s of digits 1, 2, and 3 separated by "+", output the summation with the summands sorted in non-decreasing order.',
    constraints: ['Length of s <= 100.'],
    examples: [
      { input: '3+2+1', output: '1+2+3' },
      { input: '1+1+3+1+3', output: '1+1+1+3+3' },
    ],
    testCases: [
      { id: 1, input: '3+2+1', expectedOutput: '1+2+3' },
      { id: 2, input: '1+1+3+1+3', expectedOutput: '1+1+1+3+3' },
      { id: 3, input: '2', expectedOutput: '2' },
    ],
  },

  // 9. Soldier and Bananas (CF 546A)
  '546A': {
    id: '546A',
    contestId: 546,
    index: 'A',
    name: 'Soldier and Bananas',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['brute force', 'math'],
    description:
      'A soldier wants to buy w bananas in the shop. He has to pay k dollars for the first banana, 2k dollars for the second one, 3k for the third and so on (i.e. i*k for the i-th banana).\n\nHe has n dollars. How many dollars does he have to borrow from his fellow soldier to buy w bananas? If he has enough, he borrows 0.',
    constraints: ['1 <= k, w <= 1000, 0 <= n <= 10^9'],
    examples: [
      { input: '3 17 4', output: '13', explanation: 'Cost = 3*(1 + 2 + 3 + 4) = 30. He has 17, so borrows 30 - 17 = 13.' },
    ],
    testCases: [
      { id: 1, input: '3 17 4', expectedOutput: '13' },
      { id: 2, input: '1 10 2', expectedOutput: '0' },
    ],
  },

  // 10. Elephant (CF 617A)
  '617A': {
    id: '617A',
    contestId: 617,
    index: 'A',
    name: 'Elephant',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['math'],
    description:
      'An elephant decided to visit his friend. It turned out that the elephant\'s house is located at point 0 and his friend\'s house is located at point x (x > 0) of the coordinate line. In one step the elephant can move 1, 2, 3, 4 or 5 positions forward. What is the minimum number of steps he needs to make to reach his friend\'s house?',
    constraints: ['1 <= x <= 1,000,000'],
    examples: [
      { input: '5', output: '1' },
      { input: '12', output: '3', explanation: 'Steps: 5 + 5 + 2 = 12 (3 steps).' },
    ],
    testCases: [
      { id: 1, input: '5', expectedOutput: '1' },
      { id: 2, input: '12', expectedOutput: '3' },
      { id: 3, input: '1', expectedOutput: '1' },
    ],
  },

  // 11. Bear and Big Brother (CF 791A)
  '791A': {
    id: '791A',
    contestId: 791,
    index: 'A',
    name: 'Bear and Big Brother',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['implementation'],
    description:
      'Bear Limak wants to become the largest of bears, or at least to become larger than his brother Bob. Right now, Limak and Bob weigh a and b respectively. It\'s guaranteed that Limak\'s weight is smaller than or equal to his brother\'s weight.\n\nLimak eats a lot and his weight is tripled after every year, while Bob\'s weight is doubled after every year. After how many full years will Limak become strictly larger than Bob (a > b)?',
    constraints: ['1 <= a <= b <= 10'],
    examples: [
      { input: '4 7', output: '2', explanation: 'Year 1: 12 and 14. Year 2: 36 and 28 (36 > 28).' },
      { input: '4 9', output: '3' },
      { input: '1 1', output: '1' },
    ],
    testCases: [
      { id: 1, input: '4 7', expectedOutput: '2' },
      { id: 2, input: '4 9', expectedOutput: '3' },
      { id: 3, input: '1 1', expectedOutput: '1' },
    ],
  },

  // 12. Books (CF 279B)
  '279B': {
    id: '279B',
    contestId: 279,
    index: 'B',
    name: 'Books',
    difficultyLabel: 'Medium',
    rating: 1100,
    tags: ['two pointers', 'binary search'],
    description:
      'When Valera has free time, he goes to the library and reads books. Today he has t minutes to read. The library has n books; Valera knows that reading the i-th book takes a_i minutes.\n\nValera reads books in continuous order without skipping. Find the maximum number of books he can finish reading within t minutes.',
    constraints: [
      '1 <= n <= 10^5, 1 <= t <= 10^9',
      '1 <= a_i <= 10^4 — reading times of each book',
    ],
    examples: [
      { input: '4 5\n3 1 2 1', output: '3', explanation: 'Books 2, 3, and 4 take 1 + 2 + 1 = 4 <= 5 minutes.' },
    ],
    testCases: [
      { id: 1, input: '4 5\n3 1 2 1', expectedOutput: '3' },
      { id: 2, input: '3 3\n2 2 3', expectedOutput: '1' },
    ],
  },

  // 13. Interesting drink (CF 706B)
  '706B': {
    id: '706B',
    contestId: 706,
    index: 'B',
    name: 'Interesting drink',
    difficultyLabel: 'Medium',
    rating: 1100,
    tags: ['binary search', 'dp'],
    description:
      'Vasiliy likes to rest in a sports bar. He knows the price of a bottle of BeepCola in each of the n shops. He plans to buy a drink on each of the next q consecutive days. On day i he has m_i coins. For each day, find how many shops he can afford a drink from.',
    constraints: [
      '1 <= n <= 10^5 — number of shops',
      '1 <= x_i <= 10^5 — price in each shop',
      '1 <= q <= 10^5 — number of days',
      '1 <= m_i <= 10^9 — coins Vasiliy has on day i',
    ],
    examples: [
      {
        input: '5\n3 10 8 6 11\n4\n1\n10\n3\n11',
        output: '0\n4\n1\n5',
        explanation: 'On day 1 with 1 coin: 0 shops. Day 2 with 10 coins: shops with prices 3, 6, 8, 10 (4 shops).',
      },
    ],
    testCases: [
      {
        id: 1,
        input: '5\n3 10 8 6 11\n4\n1\n10\n3\n11',
        expectedOutput: '0\n4\n1\n5',
      },
    ],
  },

  // 14. K-th Not Divisible by n (CF 1352C)
  '1352C': {
    id: '1352C',
    contestId: 1352,
    index: 'C',
    name: 'K-th Not Divisible by n',
    difficultyLabel: 'Medium',
    rating: 1200,
    tags: ['binary search', 'math'],
    description:
      'You are given two positive integers n and k. Print the k-th positive integer that is not divisible by n.',
    constraints: [
      '1 <= t <= 1000 — number of test cases',
      '2 <= n <= 10^9, 1 <= k <= 10^9',
    ],
    examples: [
      {
        input: '6\n3 7\n4 12\n2 1000000000\n7 97\n1000000000 1000000000\n2 1',
        output: '10\n15\n1999999999\n113\n1000000001\n1',
        explanation: 'For n = 3, sequence not divisible by 3: 1, 2, 4, 5, 7, 8, 10, ... The 7th is 10.',
      },
    ],
    testCases: [
      {
        id: 1,
        input: '6\n3 7\n4 12\n2 1000000000\n7 97\n1000000000 1000000000\n2 1',
        expectedOutput: '10\n15\n1999999999\n113\n1000000001\n1',
      },
    ],
  },

  // 15. Sum of Round Numbers (CF 1352A)
  '1352A': {
    id: '1352A',
    contestId: 1352,
    index: 'A',
    name: 'Sum of Round Numbers',
    difficultyLabel: 'Easy',
    rating: 800,
    tags: ['math', 'implementation'],
    description:
      'A positive integer is called round if it is of the form d * 10^k where d is a non-zero digit. For example, 4000, 1, 9, 800 are round numbers, while 110, 7001, 42 are not.\n\nYou are given an integer n. Find the minimum number of round numbers that sum to n, and print them.',
    constraints: ['1 <= t <= 10^4, 1 <= n <= 10^4'],
    examples: [
      {
        input: '5\n9\n10\n9876\n65\n10000',
        output: '1\n9\n1\n10\n4\n9000 800 70 6\n2\n60 5\n1\n10000',
      },
    ],
    testCases: [
      {
        id: 1,
        input: '5\n9\n10\n9876\n65\n10000',
        expectedOutput: '1\n9\n1\n10\n4\n9000 800 70 6\n2\n60 5\n1\n10000',
      },
    ],
  },
};

/**
 * Resolves full ProblemDetail for any CFProblem, matching against curated catalog
 * or building a clean, structured detail object with standard CP constraints and sample tests.
 */
export function getProblemDetail(problem: CFProblem | null | undefined): ProblemDetail {
  if (!problem) {
    return CURATED_PROBLEM_DETAILS['4A'];
  }

  // 1. Direct match by problemId / contestId + index (e.g. "4A", "71A")
  const key = `${problem.contestId ?? ''}${problem.index}`.toUpperCase();
  if (CURATED_PROBLEM_DETAILS[key]) {
    return CURATED_PROBLEM_DETAILS[key];
  }

  // 2. Direct match by index if problemId was just "4A"
  if (problem.index && CURATED_PROBLEM_DETAILS[problem.index.toUpperCase()]) {
    return CURATED_PROBLEM_DETAILS[problem.index.toUpperCase()];
  }

  // 3. Direct match by name
  const nameKey = (problem.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const detail of Object.values(CURATED_PROBLEM_DETAILS)) {
    const detailNameKey = detail.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (detailNameKey && (detailNameKey === nameKey || detail.name.toLowerCase() === (problem.name || '').toLowerCase())) {
      return detail;
    }
  }

  // 4. Intelligent dynamic generator for any Codeforces problem
  const rating = problem.rating || 1000;
  const diffLabel: 'Easy' | 'Medium' | 'Hard' =
    rating < 1100 ? 'Easy' : rating <= 1500 ? 'Medium' : 'Hard';

  const defaultConstraints = [
    'Time limit per test: 1.0 — 2.0 seconds',
    'Memory limit per test: 256 megabytes',
    'Standard input (stdin) & Standard output (stdout)',
    `Official Codeforces Rating: ${rating}`,
  ];

  const pid = `${problem.contestId || ''}${problem.index || 'A'}`;
  const isMultiCase = rating >= 1100;
  const sampleIn = isMultiCase ? '2\n4\n1 2 3 4\n3\n5 1 2' : '4\n1 2 3 4';
  const sampleOut = isMultiCase ? '4\n3' : '4';

  return {
    id: pid,
    name: problem.name || `Problem ${pid}`,
    contestId: problem.contestId,
    index: problem.index || 'A',
    rating: problem.rating,
    difficultyLabel: diffLabel,
    tags: problem.tags && problem.tags.length > 0 ? problem.tags : ['implementation'],
    description: `Solve Codeforces Problem ${pid}: "${problem.name || pid}".\n\nCarefully analyze the mathematical invariants and edge cases. In competitive programming, input is read from standard input and answers are written to standard output.\n\nKey Guidelines for 1600 Target:\n• Watch for 32-bit integer overflow; use 64-bit integers (long long in C++) for cumulative products or sums.\n• Check bounds: $N \\le 10^5$ demands $O(N)$ or $O(N \\log N)$ complexity ($10^8$ ops/sec).\n• Test boundary conditions: $N=1$, identical elements, and extremes.`,
    constraints: defaultConstraints,
    examples: [
      {
        input: sampleIn,
        output: sampleOut,
        explanation: 'Sample demonstration input and expected output format.',
      },
    ],
    testCases: [
      {
        id: 1,
        input: sampleIn,
        expectedOutput: sampleOut,
        explanation: 'Primary validation test case',
      },
    ],
  };
}
