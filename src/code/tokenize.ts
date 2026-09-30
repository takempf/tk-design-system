/*
  A small syntax highlighter: enough to color code the way the themes want it,
  with no runtime dependency and no async loading, so it can run on every
  keystroke of a <CodeEditor>.

  A grammar is an ordered list of [kind, pattern, inside?] rules, compiled into
  one alternation and matched in a single left-to-right pass; the first rule that
  matches at a position wins, and anything no rule matches stays plain text.
  Patterns run with the `m` flag (so ^ and $ are line anchors) and may use
  lookbehind. Unterminated strings and comments match to the end, so text being
  typed colors sensibly before it is closed.

  Each kind is styled by a --tk-code-<kind> token. Bring a heavier highlighter
  (Shiki, Prism, Lezer…) by mapping its scopes onto the same kinds.
*/

export type TokenKind =
  | 'comment'
  | 'keyword'
  | 'string'
  | 'number'
  | 'constant'
  | 'function'
  | 'type'
  | 'tag'
  | 'attribute'
  | 'property'
  | 'variable'
  | 'regex'
  | 'operator'
  | 'punctuation'
  | 'meta'
  | 'inserted'
  | 'deleted';

export const tokenKinds: readonly TokenKind[] = [
  'comment',
  'keyword',
  'string',
  'number',
  'constant',
  'function',
  'type',
  'tag',
  'attribute',
  'property',
  'variable',
  'regex',
  'operator',
  'punctuation',
  'meta',
  'inserted',
  'deleted',
];

export interface Token {
  /** Absent for plain text. */
  readonly kind?: TokenKind;
  readonly text: string;
}

/**
 * A rule colors what its pattern matches as `kind`. With an inner grammar, the
 * match is tokenized again by that grammar instead, and only the parts it leaves
 * plain take `kind` — how a whole HTML tag is matched once, then split up.
 */
export type Rule = readonly [kind: TokenKind, pattern: RegExp, inside?: Grammar];
export type Grammar = readonly Rule[];

// "…until the closer, or the end of the input" — for comments still being typed.
const end = '(?![\\s\\S])';
const words = (list: string) => new RegExp(`\\b(?:${list.trim().split(/\s+/).join('|')})\\b`);

const doubleQuoted = /"(?:\\.|[^"\\\n])*"?/;
const singleQuoted = /'(?:\\.|[^'\\\n])*'?/;

const script: Grammar = [
  ['comment', new RegExp(`\\/\\/.*|\\/\\*[\\s\\S]*?(?:\\*\\/|${end})`)],
  ['string', /`(?:\\[\s\S]|[^\\`])*`?|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/],
  // A slash starts a regex only where a value is expected.
  [
    'regex',
    /(?<=(?:^|[=(,:;!&|?{}[\]]|\breturn)\s*)\/(?![*/>])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\/[dgimsuyv]*/,
  ],
  // JSX tags, only where an expression can start — `Array<string>` stays a type.
  ['tag', /(?<=(?:^|[\s(){}[\],=:?>&|]|\breturn))<\/?(?:[A-Za-z][\w.:-]*|(?=>))|\/>/],
  ['attribute', /\b[A-Za-z_][\w-]*(?==[{"'])/],
  ['meta', /@[\w$.]+/],
  [
    'keyword',
    words(`
      abstract as async await break case catch class const continue debugger declare default
      delete do else enum export extends finally for from function get if implements import in
      infer instanceof interface is keyof let namespace new of override private protected public
      readonly return satisfies set static super switch this throw try type typeof var void
      while with yield`),
  ],
  ['constant', words('true false null undefined NaN Infinity')],
  [
    'number',
    /\b(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?)n?\b|\B\.\d+\b/,
  ],
  ['type', /\b(?:[A-Z][\w$]*|string|number|boolean|bigint|symbol|object|unknown|never|any)\b/],
  ['function', /(?<![\w$])[A-Za-z_$][\w$]*(?=\s*\(|<[^<>()\n]*>\s*\()/],
  ['property', /(?<=[{,]\s*)[A-Za-z_$][\w$]*(?=\??:(?!:))/],
  ['operator', /=>|\.\.\.|[-+*/%=!<>&|^~?:]+/],
  ['punctuation', /[{}[\]();,.]/],
];

const css: Grammar = [
  ['comment', new RegExp(`\\/\\*[\\s\\S]*?(?:\\*\\/|${end})`)],
  ['string', new RegExp(`${doubleQuoted.source}|${singleQuoted.source}`)],
  ['keyword', /@[\w-]+|!important\b/],
  ['variable', /--[\w-]+/],
  ['function', /[\w-]+(?=\()/],
  ['number', /#[\da-fA-F]{3,8}\b|(?<![\w-])-?(?:\d+\.?\d*|\.\d+)(?:%|[a-zA-Z]+)?/],
  // A name before a colon is a property only if the declaration ends before a block opens.
  ['property', /(?<![\w-])[a-zA-Z-][\w-]*(?=\s*:[^{};]*[;}])/],
  ['attribute', /::?[\w-]+(?=[^;{}]*\{)/],
  ['type', /[.#][A-Za-z_-][\w-]*/],
  ['operator', /[>+~*&=|^$]/],
  ['punctuation', /[{}();,:[\]]/],
];

const tagInside: Grammar = [
  ['tag', /^<\/?[\w:.-]+|\/?>$/],
  ['string', /"[^"]*"|'[^']*'|(?<==\s*)[^\s"'<>=`]+/],
  ['punctuation', /=/],
  ['attribute', /[^\s"'<>/=]+/],
];

const markup: Grammar = [
  ['comment', new RegExp(`<!--[\\s\\S]*?(?:-->|${end})`)],
  ['meta', /<![A-Za-z][^>]*>|<\?[\s\S]*?\?>/],
  // A whole tag at once, attributes and all; a tag still being typed colors its name.
  [
    'tag',
    /<\/?[A-Za-z][\w:.-]*(?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>=`]+))?)*\s*\/?>/,
    tagInside,
  ],
  ['tag', /<\/?[A-Za-z][\w:.-]*/],
  ['constant', /&#?\w+;/],
];

const json: Grammar = [
  ['comment', new RegExp(`\\/\\/.*|\\/\\*[\\s\\S]*?(?:\\*\\/|${end})`)],
  ['property', /"(?:\\.|[^"\\\n])*"(?=\s*:)/],
  ['string', doubleQuoted],
  ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/],
  ['constant', words('true false null')],
  ['punctuation', /[{}[\],:]/],
];

const shell: Grammar = [
  ['comment', /(?<=^|\s)#.*/],
  ['string', /"(?:\\[\s\S]|[^"\\])*"?|'[^']*'?/],
  ['variable', /\$(?:\{[^}\n]*\}?|[\w@#?*!$-]+)/],
  [
    'keyword',
    words(`
      if then else elif fi for in do done case esac while until function select return export
      local readonly declare source alias unset set shift exit break continue time`),
  ],
  // A command: first word on a line, after a prompt, a pipe, a separator or sudo.
  ['function', /(?<=^[ \t]*(?:\$\s+)?|[|;&(]\s*|\b(?:then|do|else|sudo)\s+)[\w./-]+/],
  ['attribute', /(?<=\s)--?[\w-]+=?/],
  ['number', /(?<![\w-])\d+(?![\w-])/],
  ['operator', /&&|\|\||[|&;<>]+|=/],
];

const python: Grammar = [
  ['comment', /#.*/],
  [
    'string',
    new RegExp(
      `(?:\\b[rRbBuUfF]{1,2})?(?:"""[\\s\\S]*?(?:"""|${end})|'''[\\s\\S]*?(?:'''|${end})|${doubleQuoted.source}|${singleQuoted.source})`,
    ),
  ],
  ['attribute', /@[\w.]+/],
  [
    'keyword',
    words(`
      and as assert async await break case class continue def del elif else except finally for
      from global if import in is lambda match nonlocal not or pass raise return try while with
      yield`),
  ],
  ['constant', words('True False None self cls')],
  ['function', /(?<=\bdef\s+)\w+|\b[a-z_]\w*(?=\s*\()/],
  ['type', /(?<=\bclass\s+)\w+|\b[A-Z]\w*\b/],
  ['number', /\b(?:0[xXoObB][\da-fA-F_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?j?)\b|\B\.\d+\b/],
  ['operator', /[-+*/%=!<>&|^~@:]+/],
  ['punctuation', /[{}[\]();,.]/],
];

const diff: Grammar = [
  ['comment', /^(?:diff|index|---|\+\+\+)\b.*/],
  ['meta', /^@@.*/],
  ['inserted', /^[+>].*/],
  ['deleted', /^[-<].*/],
];

interface Compiled {
  readonly pattern: RegExp;
  /** Per capture group of the combined pattern: the rule it opens, or undefined for a rule's own groups. */
  readonly rules: readonly (Rule | undefined)[];
}

const grammars = new Map<string, Grammar>();
const compiled = new WeakMap<Grammar, Compiled>();

/** Make a grammar available under one or more language names (case-insensitive). */
export function registerLanguage(names: string | readonly string[], grammar: Grammar): void {
  for (const name of typeof names === 'string' ? [names] : names) {
    grammars.set(name.toLowerCase(), grammar);
  }
}

registerLanguage(
  ['js', 'jsx', 'javascript', 'mjs', 'cjs', 'ts', 'tsx', 'typescript', 'mts', 'cts'],
  script,
);
registerLanguage(['css', 'scss', 'less', 'postcss'], css);
registerLanguage(['html', 'xml', 'svg', 'vue', 'svelte', 'markup'], markup);
registerLanguage(['json', 'jsonc', 'json5'], json);
registerLanguage(['sh', 'bash', 'zsh', 'shell', 'console', 'shellsession'], shell);
registerLanguage(['py', 'python'], python);
registerLanguage(['diff', 'patch'], diff);

/** The grammar registered for a language name, if any. */
export function getLanguage(name: string | undefined): Grammar | undefined {
  return name ? grammars.get(name.toLowerCase()) : undefined;
}

/** Every registered language name. */
export function languageNames(): string[] {
  return [...grammars.keys()];
}

function compile(grammar: Grammar): Compiled {
  let found = compiled.get(grammar);
  if (found) return found;
  const rules: (Rule | undefined)[] = [];
  const sources = grammar.map((rule) => {
    // Patterns may contain their own capture groups; only the outer one names the rule.
    const inner = (new RegExp(`${rule[1].source}|`).exec('')?.length ?? 1) - 1;
    rules.push(rule, ...Array<undefined>(inner).fill(undefined));
    return `(${rule[1].source})`;
  });
  found = { pattern: new RegExp(sources.join('|'), 'gm'), rules };
  compiled.set(grammar, found);
  return found;
}

type Emit = (text: string, kind?: TokenKind) => void;

function scan(code: string, grammar: Grammar, emit: Emit, plain?: TokenKind): void {
  const { pattern: shared, rules } = compile(grammar);
  // A fresh copy: an inner grammar may be scanning while this one is mid-pass.
  const pattern = new RegExp(shared);
  let last = 0;
  for (let match = pattern.exec(code); match; match = pattern.exec(code)) {
    if (match[0] === '') {
      pattern.lastIndex++;
      continue;
    }
    if (match.index > last)
      emit(code.slice(last, match.index), plainKind(code.slice(last, match.index), plain));
    const group = match.findIndex((value, i) => i > 0 && value !== undefined && rules[i - 1]);
    const [kind, , inside] = rules[group - 1]!;
    if (inside) scan(match[0], inside, emit, kind);
    else emit(match[0], kind);
    last = match.index + match[0].length;
  }
  if (last < code.length) emit(code.slice(last), plainKind(code.slice(last), plain));
}

// What an inner grammar leaves takes the outer kind, but whitespace stays plain.
const plainKind = (text: string, kind?: TokenKind) => (kind && /\S/.test(text) ? kind : undefined);

/**
 * Split code into lines of tokens. Tokens never cross a line break, so each
 * line renders on its own; an unknown or missing language gives plain lines.
 */
export function tokenize(code: string, language?: string | Grammar): Token[][] {
  const grammar = typeof language === 'string' || !language ? getLanguage(language) : language;
  const lines: Token[][] = [[]];
  const emit: Emit = (text, kind) => {
    text.split('\n').forEach((part, i) => {
      if (i > 0) lines.push([]);
      if (part) lines[lines.length - 1]!.push(kind ? { kind, text: part } : { text: part });
    });
  };
  if (grammar) scan(code, grammar, emit);
  else emit(code);
  return lines;
}
