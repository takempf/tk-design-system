import { Eyebrow, Panel, SceneryWindow } from 'tk-design-system';

export const meta = {
  section: 'surfaces',
  title: 'Panel',
  description: 'Surfaces. Put a SceneryWindow inside and the panel becomes a window.',
  order: 1,
  wide: true,
};

export default function Panels() {
  return (
    <div className="demo-grid">
      <Panel>
        <Eyebrow>Raised</Eyebrow>
        <p>The default surface.</p>
      </Panel>
      <Panel variant="outline">
        <Eyebrow>Outline</Eyebrow>
        <p>Border only.</p>
      </Panel>
      <Panel variant="sunken">
        <Eyebrow>Sunken</Eyebrow>
        <p>A well for controls.</p>
      </Panel>
      <Panel>
        <SceneryWindow />
        <Eyebrow>Window</Eyebrow>
        <p>A hole cut through to the scenery.</p>
      </Panel>
    </div>
  );
}
