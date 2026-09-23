import { Tabs } from 'tk-design-system';
import { Almanac } from '../consumers/Almanac';
import { Chat } from '../consumers/Chat';
import { Journal } from '../consumers/Journal';
import { Registry } from '../consumers/Registry';

const trips = [
  { id: 'journal', label: 'Journal', theme: 'Grove', App: Journal },
  { id: 'registry', label: 'Registry', theme: 'Bureau', App: Registry },
  { id: 'almanac', label: 'Almanac', theme: 'Paper', App: Almanac },
  { id: 'chat', label: 'Chat', theme: 'Base', App: Chat },
];

export function FieldTrips() {
  return (
    <div className="pg-trips">
      <p className="pg-lede">
        Each app below is built only from the system and pinned to its own theme with a scoped{' '}
        <code>&lt;Theme&gt;</code>, whatever the page theme is. Their sources live in{' '}
        <code>playground/consumers</code>.
      </p>
      <Tabs.Root defaultValue="journal">
        <Tabs.List>
          {trips.map((trip) => (
            <Tabs.Tab key={trip.id} value={trip.id}>
              {trip.label}
              <small className="pg-trip-theme">{trip.theme}</small>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {trips.map(({ id, App }) => (
          <Tabs.Panel key={id} value={id}>
            <App />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </div>
  );
}
