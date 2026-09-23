import {
  AlertDialog,
  Badge,
  Button,
  Eyebrow,
  Icon,
  Meter,
  Panel,
  SceneryWindow,
  Separator,
  Tabs,
  Theme,
  toasts,
} from 'tk-design-system';

const cases = [
  { id: 'AR-0413', name: 'The Staircase', status: 'Contained', tone: 'accent' },
  { id: 'AR-0519', name: 'Refrigerator, Hum', status: 'Active', tone: 'label' },
  { id: 'AR-0077', name: 'Floor Nine Hallway', status: 'Under review', tone: 'warning' },
  { id: 'AR-1120', name: 'Rubber Duck', status: 'Contained', tone: 'accent' },
] as const;

/** Bureau: a case registry for a building that is larger on the inside. */
export function Registry() {
  const current = cases[1];
  return (
    <Theme name="bureau" className="app app-registry">
      <aside className="app-registry-cases">
        <Eyebrow>Registry</Eyebrow>
        {cases.map((each) => (
          <button
            key={each.id}
            type="button"
            className="app-registry-case"
            aria-current={each.id === current.id || undefined}
          >
            <code>{each.id}</code>
            <span>{each.name}</span>
          </button>
        ))}
      </aside>
      <main className="app-registry-file">
        <Panel className="app-registry-header">
          <SceneryWindow scene="monolith" />
          <Eyebrow>{current.id} · Altered item</Eyebrow>
          <h3>{current.name}</h3>
          <Badge tone={current.tone}>{current.status}</Badge>
        </Panel>
        <Tabs.Root defaultValue="summary">
          <Tabs.List>
            <Tabs.Tab value="summary">Summary</Tabs.Tab>
            <Tabs.Tab value="evidence">Evidence</Tabs.Tab>
            <Tabs.Tab value="log">Log</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="summary" className="app-registry-panel">
            <p>
              A domestic refrigerator whose hum, when unobserved, drifts downward in pitch. Staff
              report it is <strong>always slightly further away</strong> than it appears.
            </p>
            <Meter label="Resonance" value={72} />
            <Meter label="Clearance required" value={4} max={7} format={{ style: 'decimal' }} />
          </Tabs.Panel>
          <Tabs.Panel value="evidence" className="app-registry-panel">
            <p>Three recordings. One of them is silent. All three are 11 minutes long.</p>
          </Tabs.Panel>
          <Tabs.Panel value="log" className="app-registry-panel">
            <p>
              <code>03:14</code> Door opened by technician. <code>03:14</code> Door closed.
            </p>
          </Tabs.Panel>
        </Tabs.Root>
        <Separator />
        <div className="app-actions">
          <Button variant="ghost">
            <Icon name="copy" /> Duplicate file
          </Button>
          <AlertDialog.Root>
            <AlertDialog.Trigger render={<Button variant="danger" />}>Redact</AlertDialog.Trigger>
            <AlertDialog.Popup>
              <AlertDialog.Title>Redact {current.id}?</AlertDialog.Title>
              <AlertDialog.Description>
                The file will be removed from the registry. The item will not.
              </AlertDialog.Description>
              <div className="app-actions">
                <AlertDialog.Close render={<Button variant="ghost" />}>Cancel</AlertDialog.Close>
                <AlertDialog.Close
                  render={<Button variant="danger" />}
                  onClick={() => toasts.add({ title: 'Redacted', type: 'danger' })}
                >
                  Redact
                </AlertDialog.Close>
              </div>
            </AlertDialog.Popup>
          </AlertDialog.Root>
        </div>
      </main>
    </Theme>
  );
}
