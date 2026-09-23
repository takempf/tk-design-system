import { useState } from 'react';
import {
  Button,
  Eyebrow,
  Icon,
  morph,
  Reveal,
  SceneryWindow,
  Select,
  Textarea,
  Theme,
} from 'tk-design-system';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const models = [
  { value: 'local-small', label: 'Local · small' },
  { value: 'local-large', label: 'Local · large' },
];

/**
 * Base: tk-ai's chat, rebuilt from the system. User messages are windows onto the
 * trapper scenery, just as in tk-ai.
 */
export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'user', text: 'What makes a good campfire?' },
    {
      id: 2,
      role: 'assistant',
      text: 'Dry tinder, kindling no thicker than your thumb, and patience: build it small and feed it slowly. A fire you can sit close to beats one you have to back away from.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState<string | null>('local-small');

  const send = () => {
    if (!draft.trim()) return;
    morph(
      () => {
        setMessages([...messages, { id: messages.length + 1, role: 'user', text: draft.trim() }]);
        setDraft('');
      },
      { scope: 'chat' },
    );
  };

  return (
    <Theme name="base" className="app app-chat">
      <div className="app-chat-log">
        {messages.map((message) => (
          <Reveal key={message.id} scope="chat">
            <article className="app-chat-message" data-role={message.role}>
              {message.role === 'user' && <SceneryWindow scene="trapper" />}
              <Eyebrow>{message.role === 'user' ? 'You' : 'Assistant'}</Eyebrow>
              <p>{message.text}</p>
            </article>
          </Reveal>
        ))}
      </div>
      <form
        className="app-chat-composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <Textarea
          rows={2}
          value={draft}
          placeholder="Ask about the woods…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="app-actions">
          <Select
            items={models}
            value={model}
            onValueChange={setModel}
            size="sm"
            aria-label="Model"
          />
          <Button type="submit" variant="primary" square aria-label="Send">
            <Icon name="arrow-up" />
          </Button>
        </div>
      </form>
    </Theme>
  );
}
