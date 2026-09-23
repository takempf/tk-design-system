import { Checkbox, Fieldset, Radio, RadioGroup, Stack, Switch } from 'tk-design-system';

export const meta = {
  section: 'inputs',
  title: 'Checkbox, switch & radio',
  description: 'Children become a clickable label. Grove draws radios as diamonds.',
  order: 2,
};

export default function Choices() {
  return (
    <Stack direction="row" gap={10} wrap>
      <Fieldset.Root>
        <Fieldset.Legend>Pack</Fieldset.Legend>
        <Checkbox defaultChecked>Tinderbox</Checkbox>
        <Checkbox>Spare socks</Checkbox>
        <Checkbox indeterminate>Maps (some)</Checkbox>
        <Switch defaultChecked>Lantern lit</Switch>
      </Fieldset.Root>
      <Fieldset.Root render={<RadioGroup defaultValue="dusk" />}>
        <Fieldset.Legend>Set out at</Fieldset.Legend>
        <Radio value="dawn">Dawn</Radio>
        <Radio value="noon">Noon</Radio>
        <Radio value="dusk">Dusk</Radio>
      </Fieldset.Root>
    </Stack>
  );
}
