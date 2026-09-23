import { type CSSProperties, useState } from 'react';
import {
  Eyebrow,
  Field,
  Panel,
  SceneryWindow,
  Select,
  Slider,
  scenes,
  Toggle,
  ToggleGroup,
} from 'tk-design-system';
import { Code } from '../Specimen';

const sceneOptions = Object.entries(scenes).map(([value, scene]) => ({ value, label: scene.name }));

export function SceneryLab() {
  const [scene, setScene] = useState('theme');
  const [bayer, setBayer] = useState('8');
  const [pixel, setPixel] = useState(2);
  const [softness, setSoftness] = useState(9);
  const [tone, setTone] = useState<number[]>([]);

  const style = {
    '--tk-scenery-bayer': bayer,
    '--tk-scenery-pixel': pixel,
    '--tk-scenery-softness': softness,
    ...(tone.length === 2 && {
      '--tk-scenery-tone-low': tone[0],
      '--tk-scenery-tone-high': tone[1],
    }),
  } as CSSProperties;

  const snippet = `<Panel>
  <SceneryWindow${scene !== 'theme' ? ` scene="${scene}"` : ''}
    style={{
      '--tk-scenery-bayer': ${bayer},
      '--tk-scenery-pixel': ${pixel},
      '--tk-scenery-softness': ${softness},${
        tone.length === 2
          ? `
      '--tk-scenery-tone-low': ${tone[0]},
      '--tk-scenery-tone-high': ${tone[1]},`
          : ''
      }
    }}
  />
  …content…
</Panel>`;

  return (
    <div className="pg-lab">
      <p className="pg-lede">
        Each scene is ray-marched at low resolution, softened, then gradient-mapped onto the theme's
        five inks and Bayer-dithered on a grid fixed to the screen. Emissive spots — fireflies,
        carved marks, neon — dither into a sixth ink, ember. Every card below is a portal: its scene
        is painted at the full size of the viewport and pinned there, and the card shows only the
        part behind it. Scroll, and the cards slide across still scenery.
      </p>

      <div className="pg-gallery">
        {Object.entries(scenes).map(([id, info]) => (
          <Panel key={id} className="pg-gallery-item">
            <SceneryWindow scene={id} />
            <Eyebrow>{id}</Eyebrow>
            <p className="pg-gallery-title">{info.name}</p>
            <p className="pg-gallery-text">{info.description}</p>
          </Panel>
        ))}
      </div>

      <h2 className="pg-subhead">Lab</h2>
      <div className="pg-lab-grid">
        <Panel className="pg-lab-window">
          <SceneryWindow scene={scene === 'theme' ? undefined : scene} style={style} />
        </Panel>
        <Panel variant="outline" className="pg-lab-controls">
          <Field.Root>
            <Field.Label>Scene</Field.Label>
            <Select
              items={[{ value: 'theme', label: 'Theme default' }, ...sceneOptions]}
              value={scene}
              onValueChange={(value) => setScene(value ?? 'theme')}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Bayer matrix</Field.Label>
            <ToggleGroup
              value={[bayer]}
              onValueChange={(value) => value[0] && setBayer(value[0] as string)}
            >
              <Toggle value="2">2×2</Toggle>
              <Toggle value="4">4×4</Toggle>
              <Toggle value="8">8×8</Toggle>
            </ToggleGroup>
          </Field.Root>
          <Slider
            label="Pixel size"
            min={1}
            max={6}
            step={1}
            value={pixel}
            onValueChange={(value) => setPixel(value as number)}
          />
          <Slider
            label="Softness"
            min={0}
            max={30}
            step={1}
            value={softness}
            onValueChange={(value) => setSoftness(value as number)}
          />
          <Slider
            label="Tone range"
            min={0}
            max={1}
            step={0.01}
            value={tone.length === 2 ? tone : [0.1, 0.6]}
            onValueChange={(value) => setTone([...(value as number[])])}
          />
        </Panel>
      </div>
      <p className="pg-muted">
        This window is a portal too. To frame a whole scene inside one box instead, pass{' '}
        <code>attachment="local"</code> — the Almanac field trip does. Every knob is a CSS custom
        property, so themes set them all.
      </p>
      <Code source={snippet} />
    </div>
  );
}
