import type { ReactNode } from 'react';

// Just enough TSX/CSS highlighting for the specimens: one regex, one pass.
const pattern =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.]*|\/?>)|\b(import|from|export|default|const|let|function|return|if|else|type|interface|extends|new|as|typeof|true|false|null|undefined)\b|(\b\d+(?:\.\d+)?(?:px|rem|ms|deg|%)?\b)|(--[\w-]+)/g;

const kinds = ['comment', 'string', 'tag', 'keyword', 'number', 'token'] as const;

export function highlight(source: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) out.push(source.slice(last, index));
    const kind = kinds[match.slice(1).findIndex((group) => group !== undefined)] ?? 'plain';
    out.push(
      <span key={index} data-kind={kind}>
        {match[0]}
      </span>,
    );
    last = index + match[0].length;
  }
  if (last < source.length) out.push(source.slice(last));
  return out;
}
