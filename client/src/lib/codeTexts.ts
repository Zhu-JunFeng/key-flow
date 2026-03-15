// Code syntax highlighting helpers

export type TokenType = 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'plain';

export interface CodeToken {
  readonly text: string;
  readonly type: TokenType;
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'class', 'new', 'this', 'try', 'catch', 'throw', 'async', 'await', 'import',
  'export', 'default', 'from', 'typeof', 'instanceof', 'in', 'of', 'true', 'false',
  'null', 'undefined', 'yield', 'switch', 'case', 'break', 'continue',
]);

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'else', 'elif', 'for', 'while', 'import',
  'from', 'as', 'try', 'except', 'raise', 'with', 'yield', 'lambda', 'pass',
  'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is',
  'async', 'await', 'self',
]);

const GO_KEYWORDS = new Set([
  'func', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default',
  'package', 'import', 'type', 'struct', 'interface', 'map', 'chan', 'go',
  'defer', 'var', 'const', 'true', 'false', 'nil', 'make', 'append', 'len',
  'string', 'int', 'bool', 'error', 'byte', 'rune', 'any',
]);

function getKeywordsForLanguage(language: string): Set<string> {
  switch (language) {
    case 'javascript': return JS_KEYWORDS;
    case 'python': return PY_KEYWORDS;
    case 'go': return GO_KEYWORDS;
    default: return JS_KEYWORDS;
  }
}

export function tokenizeCode(code: string, language: string): readonly CodeToken[] {
  const keywords = getKeywordsForLanguage(language);
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < code.length) {
    // Comments
    if (code[i] === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i);
      const commentEnd = end === -1 ? code.length : end;
      tokens.push({ text: code.slice(i, commentEnd), type: 'comment' });
      i = commentEnd;
      continue;
    }
    if (code[i] === '#' && language === 'python') {
      const end = code.indexOf('\n', i);
      const commentEnd = end === -1 ? code.length : end;
      tokens.push({ text: code.slice(i, commentEnd), type: 'comment' });
      i = commentEnd;
      continue;
    }

    // Strings
    if (code[i] === '"' || code[i] === "'" || code[i] === '`') {
      const quote = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === '\\') j++; // skip escaped
        j++;
      }
      tokens.push({ text: code.slice(i, j + 1), type: 'string' });
      i = j + 1;
      continue;
    }

    // Numbers
    if (code[i] >= '0' && code[i] <= '9') {
      let j = i;
      while (j < code.length && ((code[j] >= '0' && code[j] <= '9') || code[j] === '.')) j++;
      tokens.push({ text: code.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Words (keywords or identifiers)
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      tokens.push({ text: word, type: keywords.has(word) ? 'keyword' : 'plain' });
      i = j;
      continue;
    }

    // Operators
    if ('=+-*/<>!&|^%'.includes(code[i])) {
      tokens.push({ text: code[i], type: 'operator' });
      i++;
      continue;
    }

    // Everything else (whitespace, brackets, etc.)
    tokens.push({ text: code[i], type: 'plain' });
    i++;
  }

  return tokens;
}

export const TOKEN_COLORS: Record<string, Record<TokenType, string>> = {
  light: {
    keyword: '#8b5cf6',
    string: '#059669',
    comment: '#94a3b8',
    number: '#f59e0b',
    operator: '#ef4444',
    plain: '#1e293b',
  },
  dark: {
    keyword: '#c084fc',
    string: '#34d399',
    comment: '#64748b',
    number: '#fbbf24',
    operator: '#f87171',
    plain: '#e2e8f0',
  },
};
