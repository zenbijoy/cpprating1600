/**
 * CLIMB 1600 - High Performance Syntax Tokenizer & Parser
 * Tokenizes C++, Python, and general competitive programming source code
 * into vibrant, semantic tokens for joyful syntax highlighting.
 */

export type TokenType =
  | 'directive'      // #include, #define, #pragma
  | 'header'         // <iostream>, "myheader.h"
  | 'comment'        // // line comment or /* block comment */
  | 'comment-meta'   // In-comment structured tags: Time Complexity, Strategy, etc.
  | 'keyword'        // int, long, using, namespace, return, if, else, for, etc.
  | 'type'           // vector, string, pair, map, set, ll, int64_t
  | 'function'       // main, solve, push_back, min, max, cin, cout, endl
  | 'number'         // 0, 1, 1e9, 1000000007, 0LL, 3.14
  | 'string'         // "hello"
  | 'char'           // 'a', '\n'
  | 'operator'       // +, -, *, /, ==, !=, <<, >>, ->, ::
  | 'punctuation'    // (, ), {, }, [, ], ;, ,
  | 'plain';         // variable names, whitespaces

export interface CodeToken {
  type: TokenType;
  text: string;
}

export interface CodeLine {
  lineNumber: number;
  tokens: CodeToken[];
  rawText: string;
}

export interface ParsedProblemMetadata {
  problemId?: string;
  problemName?: string;
  difficulty?: string;
  topicTags: string[];
  strategy?: string;
  strategyDetails: string[];
  invariants: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  standards?: string;
  license?: string;
  author?: string;
  link?: string;
}

const CPP_DIRECTIVES = new Set([
  '#include',
  '#define',
  '#undef',
  '#pragma',
  '#ifdef',
  '#ifndef',
  '#endif',
  '#if',
  '#else',
  '#elif',
]);

const CPP_KEYWORDS = new Set([
  'using',
  'namespace',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'break',
  'continue',
  'switch',
  'case',
  'default',
  'struct',
  'class',
  'template',
  'typename',
  'public',
  'private',
  'protected',
  'virtual',
  'override',
  'static',
  'const',
  'constexpr',
  'inline',
  'auto',
  'void',
  'int',
  'long',
  'short',
  'float',
  'double',
  'char',
  'bool',
  'unsigned',
  'signed',
  'true',
  'false',
  'nullptr',
  'NULL',
  'new',
  'delete',
  'sizeof',
  'typedef',
  'std',
  'friend',
  'operator',
  'explicit',
  'enum',
  'union',
  'goto',
  'try',
  'catch',
  'throw',
]);

const CPP_TYPES = new Set([
  'vector',
  'string',
  'pair',
  'tuple',
  'map',
  'set',
  'multiset',
  'multimap',
  'unordered_map',
  'unordered_set',
  'queue',
  'priority_queue',
  'stack',
  'deque',
  'bitset',
  'array',
  'list',
  'iterator',
  'const_iterator',
  'size_t',
  'int64_t',
  'uint64_t',
  'int32_t',
  'uint32_t',
  'int16_t',
  'uint16_t',
  'int8_t',
  'uint8_t',
  'll',
  'ull',
  'ld',
  'pii',
  'pll',
  'vi',
  'vll',
  'vvi',
  'vpii',
  'ios_base',
  'istream',
  'ostream',
]);

const CPP_FUNCTIONS = new Set([
  'main',
  'solve',
  'cin',
  'cout',
  'cerr',
  'endl',
  'push_back',
  'emplace_back',
  'pop_back',
  'push',
  'pop',
  'top',
  'front',
  'back',
  'insert',
  'erase',
  'find',
  'count',
  'size',
  'empty',
  'clear',
  'resize',
  'reserve',
  'begin',
  'end',
  'rbegin',
  'rend',
  'lower_bound',
  'upper_bound',
  'sort',
  'reverse',
  'min',
  'max',
  'swap',
  'gcd',
  'lcm',
  'accumulate',
  'memset',
  'fill',
  'iota',
  'abs',
  'sqrt',
  'pow',
  'tie',
  'make_pair',
  'make_tuple',
  'get',
  'printf',
  'scanf',
  'getline',
  'substr',
  'length',
]);

/**
 * Extracts structured CP metadata from comments (e.g. Algorithmic Strategy, Complexity, Invariant)
 */
export function parseProblemMetadata(sourceCode: string): ParsedProblemMetadata {
  const meta: ParsedProblemMetadata = {
    topicTags: [],
    strategyDetails: [],
    invariants: [],
  };

  const lines = sourceCode.split('\n');
  for (const line of lines) {
    const trimmed = line.trim().replace(/^\/\*+\s*|\*+\/\s*|^\*\s*|^\/\/\s*/, '');

    // Problem ID & Name
    const probMatch = trimmed.match(/Codeforces Problem ([0-9]+[A-Z0-9]*):?\s*(.+)/i);
    if (probMatch) {
      meta.problemId = probMatch[1].trim();
      meta.problemName = probMatch[2].trim();
    }

    // Link
    const linkMatch = trimmed.match(/Link:\s*(https?:\/\/[^\s]+)/i);
    if (linkMatch) {
      meta.link = linkMatch[1].trim();
    }

    // Difficulty & Topic Tags
    const diffMatch = trimmed.match(/Difficulty:\s*(?:★\s*)?([0-9]+)/i);
    if (diffMatch) {
      meta.difficulty = diffMatch[1].trim();
    }
    const tagsMatch = trimmed.match(/Topic Tags:\s*(.+)/i);
    if (tagsMatch) {
      meta.topicTags = tagsMatch[1]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Strategy
    const stratMatch = trimmed.match(/Algorithmic Strategy:\s*(.+)/i);
    if (stratMatch) {
      meta.strategy = stratMatch[1].trim();
    }

    // Invariant
    const invMatch = trimmed.match(/Invariant:\s*(.+)/i);
    if (invMatch) {
      meta.invariants.push(invMatch[1].trim());
    } else if (trimmed.startsWith('- ') && trimmed.includes('Invariant:')) {
      meta.invariants.push(trimmed.replace(/^-\s*Invariant:\s*/i, '').trim());
    } else if (trimmed.startsWith('- ') && !trimmed.includes('Complexity')) {
      meta.strategyDetails.push(trimmed.replace(/^-\s*/, '').trim());
    }

    // Complexity
    const timeMatch = trimmed.match(/Time Complexity:\s*(.+)/i);
    if (timeMatch) {
      meta.timeComplexity = timeMatch[1].trim();
    }
    const spaceMatch = trimmed.match(/Space Complexity:\s*(.+)/i);
    if (spaceMatch) {
      meta.spaceComplexity = spaceMatch[1].trim();
    }

    // Standards & License & Author
    const stdMatch = trimmed.match(/Standards?:\s*(.+)/i);
    if (stdMatch) {
      meta.standards = stdMatch[1].trim();
    }
    const licMatch = trimmed.match(/License:\s*(.+)/i);
    if (licMatch) {
      meta.license = licMatch[1].trim();
    }
    const authMatch = trimmed.match(/Author:\s*(.+)/i);
    if (authMatch) {
      meta.author = authMatch[1].trim();
    }
  }

  return meta;
}

/**
 * Tokenize source code into lines of semantic tokens
 */
export function tokenizeCode(sourceCode: string): CodeLine[] {
  if (!sourceCode) return [];

  const rawLines = sourceCode.split('\n');
  const codeLines: CodeLine[] = [];
  let inMultiLineComment = false;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const tokens: CodeToken[] = [];
    let pos = 0;
    const len = rawLine.length;

    while (pos < len) {
      // 1. Inside multi-line comment from previous lines
      if (inMultiLineComment) {
        const endCommentIdx = rawLine.indexOf('*/', pos);
        if (endCommentIdx === -1) {
          // Entire remaining line is part of multi-line comment
          const commentText = rawLine.slice(pos);
          tokenizeCommentText(commentText, tokens);
          pos = len;
        } else {
          const commentPart = rawLine.slice(pos, endCommentIdx + 2);
          tokenizeCommentText(commentPart, tokens);
          pos = endCommentIdx + 2;
          inMultiLineComment = false;
        }
        continue;
      }

      // Check start of multi-line comment /*
      if (rawLine.startsWith('/*', pos)) {
        inMultiLineComment = true;
        const endCommentIdx = rawLine.indexOf('*/', pos + 2);
        if (endCommentIdx === -1) {
          const commentText = rawLine.slice(pos);
          tokenizeCommentText(commentText, tokens);
          pos = len;
        } else {
          const commentPart = rawLine.slice(pos, endCommentIdx + 2);
          tokenizeCommentText(commentPart, tokens);
          pos = endCommentIdx + 2;
          inMultiLineComment = false;
        }
        continue;
      }

      // Check single-line comment //
      if (rawLine.startsWith('//', pos)) {
        const commentText = rawLine.slice(pos);
        tokenizeCommentText(commentText, tokens);
        pos = len;
        break;
      }

      // Check whitespace
      const wsMatch = rawLine.slice(pos).match(/^[ \t]+/);
      if (wsMatch) {
        tokens.push({ type: 'plain', text: wsMatch[0] });
        pos += wsMatch[0].length;
        continue;
      }

      // Preprocessor directive (at start of line after whitespace)
      if (rawLine[pos] === '#') {
        const dirMatch = rawLine.slice(pos).match(/^#[a-zA-Z_]+/);
        if (dirMatch) {
          tokens.push({ type: 'directive', text: dirMatch[0] });
          pos += dirMatch[0].length;

          // If it was #include, check for next <header> or "header.h"
          if (dirMatch[0] === '#include') {
            const rest = rawLine.slice(pos);
            const headerMatch = rest.match(/^(\s*)(<[^>]+>|"[^"]+")/);
            if (headerMatch) {
              if (headerMatch[1]) {
                tokens.push({ type: 'plain', text: headerMatch[1] });
              }
              tokens.push({ type: 'header', text: headerMatch[2] });
              pos += headerMatch[0].length;
            }
          }
          continue;
        }
      }

      // String literal "..."
      if (rawLine[pos] === '"') {
        let strEnd = pos + 1;
        while (strEnd < len) {
          if (rawLine[strEnd] === '\\') {
            strEnd += 2; // skip escape
          } else if (rawLine[strEnd] === '"') {
            strEnd++;
            break;
          } else {
            strEnd++;
          }
        }
        tokens.push({ type: 'string', text: rawLine.slice(pos, strEnd) });
        pos = strEnd;
        continue;
      }

      // Character literal '.'
      if (rawLine[pos] === "'") {
        let charEnd = pos + 1;
        while (charEnd < len) {
          if (rawLine[charEnd] === '\\') {
            charEnd += 2;
          } else if (rawLine[charEnd] === "'") {
            charEnd++;
            break;
          } else {
            charEnd++;
          }
        }
        tokens.push({ type: 'char', text: rawLine.slice(pos, charEnd) });
        pos = charEnd;
        continue;
      }

      // Numbers: decimal, hex (0x), binary (0b), floats (1e9+7, 3.14)
      const numMatch = rawLine.slice(pos).match(/^(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:ULL|ull|LL|ll|L|l|U|u)?)/);
      if (numMatch && numMatch[0].length > 0) {
        tokens.push({ type: 'number', text: numMatch[0] });
        pos += numMatch[0].length;
        continue;
      }

      // Operators and compound symbols
      const opMatch = rawLine.slice(pos).match(/^(?:==|!=|<=|>=|&&|\|\||<<=|>>=|\+\+|--|<<|>>|\+=|-=|\*=|(?!\/\*|\/\/)\/=|%=|&=|\|=|\^=|->|::|\+|-|\*|\/|%|=|!|<|>|&|\||\^|~|\?|:)/);
      if (opMatch) {
        tokens.push({ type: 'operator', text: opMatch[0] });
        pos += opMatch[0].length;
        continue;
      }

      // Punctuation & Brackets
      const puncMatch = rawLine.slice(pos).match(/^[{}()[\];,]/);
      if (puncMatch) {
        tokens.push({ type: 'punctuation', text: puncMatch[0] });
        pos += puncMatch[0].length;
        continue;
      }

      // Identifiers / Words
      const idMatch = rawLine.slice(pos).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (idMatch) {
        const word = idMatch[0];
        // Peek ahead to see if followed by ( to check function call
        const remainder = rawLine.slice(pos + word.length);
        const isFollowedByParen = /^\s*\(/.test(remainder);

        if (CPP_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword', text: word });
        } else if (CPP_TYPES.has(word)) {
          tokens.push({ type: 'type', text: word });
        } else if (CPP_FUNCTIONS.has(word) || isFollowedByParen) {
          tokens.push({ type: 'function', text: word });
        } else {
          tokens.push({ type: 'plain', text: word });
        }
        pos += word.length;
        continue;
      }

      // Fallback single character
      tokens.push({ type: 'plain', text: rawLine[pos] });
      pos++;
    }

    codeLines.push({
      lineNumber: i + 1,
      tokens,
      rawText: rawLine,
    });
  }

  return codeLines;
}

/**
 * Highlights special metadata tags within comment text (e.g. "Time Complexity:", "Algorithmic Strategy:")
 */
function tokenizeCommentText(commentText: string, tokens: CodeToken[]) {
  // Regex to detect structured tags inside comments
  const metaRegex = /(Codeforces Problem [0-9]+[A-Z0-9]*:|Algorithmic Strategy:|Time Complexity:|Space Complexity:|Difficulty:|Topic Tags:|Standards:|License:|Invariant:|Author:|Link:)/gi;

  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(commentText)) !== null) {
    if (match.index > lastIdx) {
      tokens.push({
        type: 'comment',
        text: commentText.slice(lastIdx, match.index),
      });
    }
    tokens.push({
      type: 'comment-meta',
      text: match[0],
    });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < commentText.length) {
    tokens.push({
      type: 'comment',
      text: commentText.slice(lastIdx),
    });
  }
}
