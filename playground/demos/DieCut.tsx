import { Panel, SceneryWindow } from 'tk-design-system';

export const meta = {
  section: 'scenery',
  title: 'Die-cut windows',
  description:
    'Fixed attachment: one illustration behind the page, many holes. Scroll and watch it hold still while the holes pass over it.',
  order: 1,
  wide: true,
};

const holes = Array.from({ length: 12 }, (_, i) => i);

export default function DieCut() {
  return (
    <div className="demo-diecut">
      {holes.map((hole) => (
        <Panel key={hole} variant="plain" className="demo-hole">
          <SceneryWindow />
        </Panel>
      ))}
    </div>
  );
}
