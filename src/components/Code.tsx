import { Field as BaseField } from '@base-ui/react/field';
import {
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  memo,
  type ReactNode,
  type Ref,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Grammar, type Token, tokenize } from '../code/tokenize';
import { Icon } from '../icons/Icon';
import { useLayoutMorph } from '../motion/layout';
import { cx } from '../utils';
import { Button } from './Button';
import { Tooltip } from './Popover';

function Tokens({ tokens }: { readonly tokens: readonly Token[] }) {
  return tokens.map((token, i) =>
    token.kind ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional and never reorder
      <span key={i} data-token={token.kind}>
        {token.text}
      </span>
    ) : (
      token.text
    ),
  );
}

const sameTokens = (a: readonly Token[], b: readonly Token[]) =>
  a.length === b.length &&
  a.every((token, i) => token.kind === b[i]!.kind && token.text === b[i]!.text);

interface EditorLine {
  readonly id: number;
  readonly tokens: readonly Token[];
}

let lineIds = 0;

/**
 * The editor's lines, tokenized on every edit. A line that comes out the same
 * keeps its identity (its id and tokens), matched from the top down to the edit
 * and from the bottom up to it, so a keystroke re-renders only the lines it
 * changed and Enter inserts one line rather than renumbering every line below.
 */
function useEditorLines(value: string, language: string | Grammar | undefined) {
  const previous = useRef<readonly EditorLine[]>([]);
  return useMemo(() => {
    const before = previous.current;
    const after = tokenize(value, language);
    let top = 0;
    while (
      top < after.length &&
      top < before.length &&
      sameTokens(before[top]!.tokens, after[top]!)
    ) {
      top++;
    }
    let bottom = 0;
    const room = Math.min(after.length, before.length) - top;
    while (
      bottom < room &&
      sameTokens(before[before.length - 1 - bottom]!.tokens, after[after.length - 1 - bottom]!)
    ) {
      bottom++;
    }
    const shift = before.length - after.length;
    const lines = after.map((tokens, i): EditorLine => {
      if (i < top) return before[i]!;
      if (i >= after.length - bottom) return before[i + shift]!;
      return { id: lineIds++, tokens };
    });
    previous.current = lines;
    return lines;
  }, [value, language]);
}

const EditorLineView = memo(function EditorLineView({
  tokens,
  active,
}: {
  readonly tokens: readonly Token[];
  readonly active: boolean;
}) {
  return (
    <span className="tk-code-line" data-active={active || undefined}>
      <Tokens tokens={tokens} />
    </span>
  );
});

/** "1,4-6" or [1, 4, 5, 6] → a set of line numbers. */
function lineSet(spec: readonly number[] | string | undefined): ReadonlySet<number> {
  if (typeof spec !== 'string') return new Set(spec);
  const lines = new Set<number>();
  for (const range of spec.split(',')) {
    const [from, to = from] = range.split('-').map((n) => Number.parseInt(n, 10));
    if (from === undefined || to === undefined || Number.isNaN(from) || Number.isNaN(to)) continue;
    for (let n = from; n <= to; n++) lines.add(n);
  }
  return lines;
}

/** Inline code, set in the theme's mono face on a faint chip. */
export function Code({ className, ...props }: ComponentProps<'code'>) {
  return <code {...props} className={cx('tk-code', className)} />;
}

function CopyButton({
  code,
  onCopyCode,
}: {
  readonly code: string;
  readonly onCopyCode?: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <Tooltip content={copied ? 'Copied' : 'Copy'}>
      <Button
        variant="ghost"
        size="sm"
        square
        className="tk-code-copy"
        aria-label={copied ? 'Copied' : 'Copy code'}
        data-copied={copied || undefined}
        onClick={() => {
          navigator.clipboard?.writeText(code).then(
            () => {
              setCopied(true);
              onCopyCode?.(code);
            },
            () => {},
          );
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} />
      </Button>
    </Tooltip>
  );
}

export interface CodeBlockProps extends Omit<ComponentProps<'div'>, 'children' | 'title'> {
  /** The source. One trailing newline (as fenced Markdown has) is dropped. */
  readonly code: string;
  /** A registered language name (`tsx`, `css`, `json`, `bash`, `python`, `html`, `diff`…) or a grammar. */
  readonly language?: string | Grammar;
  /** A file name or caption. Shown in a header bar, with the language and the copy button. */
  readonly title?: ReactNode;
  readonly lineNumbers?: boolean;
  /** The number of the first line, for an excerpt. */
  readonly startLine?: number;
  /** Lines to mark, as `"2,5-7"` or `[2, 5, 6, 7]`, counted from `startLine`. */
  readonly highlightLines?: readonly number[] | string;
  /** Soft-wrap long lines instead of scrolling sideways. */
  readonly wrap?: boolean;
  /** Show a copy button (default true). */
  readonly copyable?: boolean;
  /** Called after the code lands on the clipboard. */
  readonly onCopyCode?: (code: string) => void;
}

/** Highlighted, read-only code: a snippet, a file, a diff. */
export function CodeBlock({
  code,
  language,
  title,
  lineNumbers = false,
  startLine = 1,
  highlightLines,
  wrap = false,
  copyable = true,
  onCopyCode,
  className,
  style,
  ...props
}: CodeBlockProps) {
  const source = code.replace(/\n$/, '');
  const lines = useMemo(() => tokenize(source, language), [source, language]);
  const marked = useMemo(() => lineSet(highlightLines), [highlightLines]);
  const digits = String(startLine + lines.length - 1).length;
  const languageName = typeof language === 'string' ? language : undefined;
  const copy = copyable && <CopyButton code={source} onCopyCode={onCopyCode} />;

  return (
    <div
      {...props}
      className={cx('tk-code-block', className)}
      data-line-numbers={lineNumbers || undefined}
      data-wrap={wrap || undefined}
      data-language={languageName}
      style={{ '--tk-code-digits': digits, ...style } as CSSProperties}
    >
      {title !== undefined ? (
        <div className="tk-code-block-header">
          <span className="tk-code-block-title">{title}</span>
          {languageName && <span className="tk-code-block-language">{languageName}</span>}
          {copy}
        </div>
      ) : (
        copy && <div className="tk-code-block-float">{copy}</div>
      )}
      <pre className="tk-code-block-pre">
        <code className="tk-code-block-code">
          {lines.map((tokens, i) => {
            const n = startLine + i;
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity is its number
                key={i}
                className="tk-code-line"
                data-line={n}
                data-highlighted={marked.has(n) || undefined}
              >
                <span className="tk-code-line-text">
                  <Tokens tokens={tokens} />
                </span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export interface CodeEditorProps
  extends Omit<ComponentProps<'textarea'>, 'value' | 'defaultValue' | 'wrap' | 'children' | 'ref'> {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly language?: string | Grammar;
  /** Show line numbers (default true). */
  readonly lineNumbers?: boolean;
  /** Spaces per indent step for Tab, Shift+Tab and Enter (default 2). */
  readonly tabSize?: number;
  /** Height to hold before there is that much code (default 3). */
  readonly minLines?: number;
  /** Height to grow to before scrolling (default: grow without limit). */
  readonly maxLines?: number;
  /** The textarea. */
  readonly ref?: Ref<HTMLTextAreaElement>;
  /** Classes for the frame; the textarea is `.tk-code-editor-input`. */
  readonly className?: string;
  readonly style?: CSSProperties;
}

const openers: Record<string, string> = { '{': '}', '[': ']', '(': ')' };

/**
 * Replace a range of the textarea as if typed, so undo still works and
 * React sees an ordinary input event. Then place the selection.
 */
function edit(
  textarea: HTMLTextAreaElement,
  from: number,
  to: number,
  text: string,
  caret: [number, number],
) {
  textarea.setSelectionRange(from, to);
  const typed = text !== '' && document.execCommand?.('insertText', false, text);
  if (!typed) {
    textarea.setRangeText(text, from, to, 'end');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  textarea.setSelectionRange(...caret);
}

/**
 * A code field: a plain textarea laid exactly over its own highlighted text.
 * Typing, selection, undo, spellcheck-off and IME all stay native. Tab indents
 * (Shift+Tab outdents) — press Escape first to Tab out of the field. Enter keeps
 * the line's indent. Inside a <Field.Root>, it is the field's control.
 */
export function CodeEditor({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  language,
  lineNumbers = true,
  tabSize = 2,
  minLines = 3,
  maxLines,
  disabled,
  readOnly,
  className,
  style,
  ref,
  onKeyDown,
  onSelect,
  onBlur,
  ...props
}: CodeEditorProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = valueProp ?? uncontrolled;
  const [activeLine, setActiveLine] = useState<number>();
  const escaped = useRef(false);
  const input = useRef<HTMLTextAreaElement | null>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLSpanElement>(null);

  const lines = useEditorLines(value, language);
  const digits = String(lines.length).length;
  // It grows a line at a time, up to `maxLines`, and shrinks back: smoothly,
  // the new line uncovered as the frame reaches it. The text stays live.
  const growth = useLayoutMorph(String(lines.length));
  const unit = ' '.repeat(tabSize);

  // The textarea is sized to its content and never scrolls itself; the frame does.
  // Browsers can still nudge it while revealing the caret, which would misalign
  // the text from its highlight, so snap it back.
  useLayoutEffect(() => {
    const node = input.current;
    if (node && (node.scrollTop || node.scrollLeft)) node.scrollTo(0, 0);
  });

  // The browser reveals the caret before the frame has grown to fit the new
  // text, so after an edit renders, bring the caret into view ourselves: park a
  // marker where the caret is drawn and scroll that into view.
  useLayoutEffect(() => {
    const node = input.current;
    const marker = reveal.current;
    const pre = highlight.current;
    if (!node || !marker || !pre || document.activeElement !== node) return;
    const at = node.selectionEnd;
    let row = 0;
    for (let i = 0; i < at; i++) if (node.value.charCodeAt(i) === 10) row++;
    const line = pre.children[row] as HTMLElement | undefined;
    if (!line) return;
    let column = at - (node.value.lastIndexOf('\n', at - 1) + 1);
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    let x =
      line.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(line).paddingLeft);
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const length = text.nodeValue?.length ?? 0;
      if (column <= length) {
        const range = document.createRange();
        range.setStart(text, column);
        x = range.getBoundingClientRect().left;
        break;
      }
      column -= length;
    }
    const origin = pre.getBoundingClientRect();
    marker.style.top = `${line.offsetTop}px`;
    marker.style.left = `${x - origin.left}px`;
    marker.style.height = `${line.offsetHeight}px`;
    marker.style.scrollMarginLeft = `calc(${gutter.current?.offsetWidth ?? 0}px + var(--tk-code-pad-x))`;
    marker.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  const setRef = (node: HTMLTextAreaElement | null) => {
    input.current = node;
    if (typeof ref === 'function') return ref(node);
    if (ref) ref.current = node;
  };

  const trackLine = (node: HTMLTextAreaElement) => {
    let line = 0;
    for (let i = 0; i < node.selectionStart; i++) if (node.value.charCodeAt(i) === 10) line++;
    setActiveLine(node.selectionStart === node.selectionEnd ? line : undefined);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || readOnly || event.nativeEvent.isComposing) return;
    const node = event.currentTarget;
    const { selectionStart: start, selectionEnd: end, value: text } = node;
    const modified = event.metaKey || event.ctrlKey || event.altKey;

    if (event.key === 'Escape') {
      escaped.current = true;
      return;
    }
    if (event.key === 'Tab' && !modified && !escaped.current) {
      event.preventDefault();
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      if (start === end && !event.shiftKey) {
        const column = start - lineStart;
        const pad = ' '.repeat(tabSize - (column % tabSize));
        edit(node, start, end, pad, [start + pad.length, start + pad.length]);
        return;
      }
      // Indent or outdent every line the selection touches.
      const blockEnd = end > start && text[end - 1] === '\n' ? end - 1 : end;
      const lineEnd =
        text.indexOf('\n', blockEnd) === -1 ? text.length : text.indexOf('\n', blockEnd);
      const block = text.slice(lineStart, lineEnd).split('\n');
      let firstShift = 0;
      const next = block.map((line, i) => {
        if (!event.shiftKey) {
          if (i === 0) firstShift = unit.length;
          return unit + line;
        }
        const strip = line.startsWith('\t') ? 1 : (/^ */.exec(line)?.[0].length ?? 0);
        const removed = Math.min(strip, tabSize);
        if (i === 0) firstShift = -removed;
        return line.slice(removed);
      });
      const replaced = next.join('\n');
      const selectionFrom = start === end ? Math.max(lineStart, start + firstShift) : lineStart;
      const selectionTo = start === end ? selectionFrom : lineStart + replaced.length;
      edit(node, lineStart, lineEnd, replaced, [selectionFrom, selectionTo]);
      return;
    }
    escaped.current = false;
    if (event.key === 'Enter' && !modified && !event.shiftKey) {
      event.preventDefault();
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const indent = /^[ \t]*/.exec(text.slice(lineStart, start))?.[0] ?? '';
      const before = text[start - 1] ?? '';
      const closer = openers[before];
      if (closer) {
        const inner = `\n${indent}${unit}`;
        // Between a pair: open a line inside and push the closer below it.
        const insert = text[end] === closer ? `${inner}\n${indent}` : inner;
        edit(node, start, end, insert, [start + inner.length, start + inner.length]);
      } else {
        const insert = `\n${indent}`;
        edit(node, start, end, insert, [start + insert.length, start + insert.length]);
      }
    }
  };

  return (
    <div
      ref={growth.frame}
      className={cx('tk-code-editor', className)}
      data-line-numbers={lineNumbers || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      style={
        {
          '--tk-code-digits': digits,
          '--tk-code-min-lines': minLines,
          '--tk-code-max-lines': maxLines,
          ...style,
        } as CSSProperties
      }
    >
      <div className="tk-code-editor-scroller">
        {lineNumbers && (
          <div ref={gutter} className="tk-code-editor-gutter" aria-hidden>
            {lines.map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a line's identity is its number
              <span key={i} className="tk-code-line" data-active={i === activeLine || undefined}>
                {i + 1}
              </span>
            ))}
          </div>
        )}
        <div className="tk-code-editor-stack">
          <span ref={reveal} className="tk-code-editor-reveal" aria-hidden />
          <pre ref={highlight} className="tk-code-editor-highlight" aria-hidden>
            {lines.map((line, i) => (
              <EditorLineView key={line.id} tokens={line.tokens} active={i === activeLine} />
            ))}
          </pre>
          <BaseField.Control
            ref={setRef}
            value={value}
            disabled={disabled}
            onValueChange={(next) => {
              if (valueProp === undefined) setUncontrolled(next);
              onValueChange?.(next);
            }}
            className="tk-code-editor-input"
            render={
              <textarea
                {...props}
                readOnly={readOnly}
                wrap="off"
                rows={1}
                cols={1}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                data-language={typeof language === 'string' ? language : undefined}
                onKeyDown={handleKeyDown}
                onSelect={(event) => {
                  onSelect?.(event);
                  trackLine(event.currentTarget);
                }}
                onBlur={(event) => {
                  onBlur?.(event);
                  escaped.current = false;
                  setActiveLine(undefined);
                }}
                onScroll={(event) => {
                  const node = event.currentTarget;
                  if (node.scrollTop || node.scrollLeft) node.scrollTo(0, 0);
                }}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
