import { Accordion } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Accordion',
  description: 'Sections that open in place; panels animate their height.',
  order: 5,
};

const entries = [
  [
    'What should I bring?',
    'Water, a warm layer, and something to sit on. The ground is always damp.',
  ],
  ['Can I light a fire?', 'Only in the stone ring, and only if the wind is from the west.'],
  ['Is it far?', 'Far enough that you will be glad of the bench halfway.'],
];

export default function AccordionDemo() {
  return (
    <Accordion.Root defaultValue={['What should I bring?']}>
      {entries.map(([question, answer]) => (
        <Accordion.Item key={question} value={question}>
          <Accordion.Trigger>{question}</Accordion.Trigger>
          <Accordion.Panel>{answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
