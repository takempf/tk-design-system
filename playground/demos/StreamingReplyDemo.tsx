import { type ReactNode, useEffect, useState } from 'react';
import {
  Button,
  decipherChildren,
  Panel,
  Spinner,
  Stack,
  useSmoothText,
  useStreamDecipher,
  wholeWords,
} from 'tk-design-system';

export const meta = {
  section: 'motion',
  title: 'Streaming reply',
  description:
    'A model’s reply as it streams: tokens arrive in uneven bursts, useSmoothText evens them out, and each word glitches in once it’s whole. decipherChildren carries it into paragraphs, lists and emphasis.',
  order: 4,
};

const exchanges = [
  {
    ask: 'Which way to the old mill?',
    reply:
      'Follow the stream **downhill** from the split oak. The path is faint, but the water knows the way.\n\nThree things to watch for:\n\n- A stone bridge with *one* missing rail\n- Moss thick enough to hide your boots\n- The smell of wet flour, long before you see the wheel\n\nIf the lantern gutters, you’ve gone too far. Turn back to the bridge and listen for the wheel.',
  },
  {
    ask: 'Is it safe to camp here?',
    reply:
      'Mostly. The clearing is dry and the trees break the wind, but the *ground* tells a different story.\n\nDeer tracks run straight through it, and they’re fresh. Something walks this way at night, and it isn’t in a hurry.\n\n**Camp by the ridge instead.** You’ll lose the shelter, but you’ll see what’s coming.',
  },
];

/**
 * A model's stream, faked: a pause before the first token, then tokens of a few
 * characters at a time, quick but uneven, with the odd stall.
 */
function useModelStream() {
  const [reply, setReply] = useState<string | null>(null);
  const [arrived, setArrived] = useState('');
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    if (!streaming || reply === null) return;
    const tokens = reply.match(/\s*\S{1,5}/g) ?? [];
    let at = 0;
    let timer = window.setTimeout(function next() {
      at += 1;
      setArrived(tokens.slice(0, at).join(''));
      if (at >= tokens.length) return setStreaming(false);
      const stall = Math.random() < 0.06 ? 350 : 0;
      timer = window.setTimeout(next, 12 + Math.random() * 45 + stall);
    }, 700);
    return () => clearTimeout(timer);
  }, [streaming, reply]);

  return {
    arrived,
    streaming,
    waiting: streaming && !arrived,
    ask: (text: string) => {
      setReply(text);
      setArrived('');
      setStreaming(true);
    },
    stop: () => setStreaming(false),
  };
}

/** **Bold** and *emphasis*, for a line of markdown-ish text. A marker not yet closed is hidden. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, index) => {
    const [, marker, inner] = part.match(/^(\*\*|\*)(.+)\1$/) ?? [];
    const Tag = marker === '**' ? 'strong' : marker ? 'em' : null;
    return Tag ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: a streamed reply only grows at its end, so a part's place is its identity
      <Tag key={index}>{inner}</Tag>
    ) : (
      part.replace(/\*/g, '')
    );
  });
}

/** Paragraphs and lists, each deciphering its own words while `deciphering`. */
function Markdown({ text, deciphering }: { readonly text: string; readonly deciphering: boolean }) {
  return text
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((block, index) => {
      const list = block.startsWith('- ');
      const Tag = list ? 'ul' : 'p';
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: blocks only arrive at the end
        <Tag key={index}>
          {list
            ? block.split('\n').map((item, line) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: items only arrive at the end
                <li key={line}>{decipherChildren(inline(item.replace(/^- /, '')), deciphering)}</li>
              ))
            : decipherChildren(inline(block), deciphering)}
        </Tag>
      );
    });
}

export default function StreamingReplyDemo() {
  const [asked, setAsked] = useState<string | null>(null);
  const stream = useModelStream();
  const { text, done } = useSmoothText(stream.arrived, { cps: 90 });
  // Still arriving while tokens come in or the smoothing catches up to them.
  const typing = stream.streaming || !done;
  const deciphering = useStreamDecipher(typing);

  return (
    <Stack gap={4}>
      <Panel variant="sunken" className="demo-chat">
        {asked && <p className="demo-chat-ask">{asked}</p>}
        <div className="demo-chat-reply tk-serif" aria-busy={typing}>
          {!asked ? (
            <p className="pg-muted">Ask the guide something below.</p>
          ) : stream.waiting ? (
            <Spinner>Thinking</Spinner>
          ) : (
            <Markdown text={typing ? wholeWords(text) : text} deciphering={deciphering} />
          )}
        </div>
      </Panel>
      <Stack direction="row" gap={2} wrap>
        {exchanges.map((exchange) => (
          <Button
            key={exchange.ask}
            disabled={stream.streaming}
            onClick={() => {
              setAsked(exchange.ask);
              stream.ask(exchange.reply);
            }}
          >
            {exchange.ask}
          </Button>
        ))}
        {stream.streaming && (
          <Button variant="ghost" onClick={stream.stop}>
            Stop
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
