import { Tabs } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Tabs',
  description: 'The indicator slides with the theme’s morph easing.',
  order: 4,
};

export default function TabsDemo() {
  return (
    <Tabs.Root defaultValue="flora">
      <Tabs.List>
        <Tabs.Tab value="flora">Flora</Tabs.Tab>
        <Tabs.Tab value="fauna">Fauna</Tabs.Tab>
        <Tabs.Tab value="weather">Weather</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="flora">Bluebells under the beeches, wood sorrel on the banks.</Tabs.Panel>
      <Tabs.Panel value="fauna">A badger sett by the stream; tawny owls at dusk.</Tabs.Panel>
      <Tabs.Panel value="weather">Mist until mid-morning, then long low light.</Tabs.Panel>
    </Tabs.Root>
  );
}
