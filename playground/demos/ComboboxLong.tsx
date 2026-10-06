import { Combobox, Field, Stack } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Combobox, ten thousand rows',
  description:
    'virtualized renders only the rows in view, so a long list opens at once, and the arrow keys still reach every row: Up from the first lands on the ten-thousandth. Or limit shows just the first few matches.',
  order: 5.6,
};

const places =
  'Ash Oak Elm Thorn Bram Fern Holly Hazel Birch Alder Willow Rowan Yew Beech Moss Heather Reed Brook Mill Stone Chalk Flint Marsh Moor Fox Hare Wren Lark Rook Hawk Swan Heron Deer Hart Cold Long Broad Red Black White';
const endings =
  'ford ley ton wick by thorpe ham stead field combe den dale worth bury burn beck mere hurst holt wood shaw croft well gate stow';
const sides = 'Great Little Upper Lower Nether Old North South East West';

// 40 × 25 × 10: every name a parish might have.
const hamlets = places
  .split(' ')
  .flatMap((place) => endings.split(' ').map((ending) => place + ending))
  .sort()
  .flatMap((name) => sides.split(' ').map((side) => `${side} ${name}`))
  .map((label) => ({ value: label.toLowerCase().replace(' ', '-'), label }));

export default function ComboboxLong() {
  return (
    <Stack gap={5}>
      <Field.Root>
        <Field.Label>Hamlet</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          items={hamlets}
          virtualized
          minQueryLength={0}
          placeholder={`Search ${hamlets.length.toLocaleString()} hamlets…`}
          clearable
          browsable
        />
      </Field.Root>
      <Field.Root>
        <Field.Label>Parish</Field.Label>
        <Combobox items={hamlets} virtualized defaultValue="nether-thornwick" />
        <Field.Description>Opens on its row, thousands down.</Field.Description>
      </Field.Root>
      <Field.Root>
        <Field.Label>Nearest</Field.Label>
        <Combobox
          variant="input"
          multiple={false}
          items={hamlets}
          limit={6}
          placeholder="Type “ford”…"
        />
        <Field.Description>
          limit={'{6}'}: six matches at most, however many there are.
        </Field.Description>
      </Field.Root>
    </Stack>
  );
}
