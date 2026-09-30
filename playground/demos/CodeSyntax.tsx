import { tokenKinds } from 'tk-design-system';

export const meta = {
  section: 'code',
  title: 'Syntax tokens',
  description:
    'Each token kind is a --tk-code-* token drawn from the palette: keywords in the second accent, tags in the first, the rest from the standard hues. Switch themes to see them move together.',
  order: 4,
  wide: true,
};

export default function CodeSyntax() {
  return (
    <ul className="pg-syntax">
      {tokenKinds.map((kind) => (
        <li key={kind}>
          <span data-token={kind}>{kind}</span>
          <code>--tk-code-{kind}</code>
        </li>
      ))}
    </ul>
  );
}
