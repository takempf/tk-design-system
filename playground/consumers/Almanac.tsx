import { useState } from 'react';
import { Eyebrow, Panel, SceneryWindow, Separator, Slider, Switch, Theme } from 'tk-design-system';

/** Paper: an almanac page — long-form reading with a living map and a few settings. */
export function Almanac() {
  const [size, setSize] = useState(1);
  const [map, setMap] = useState(true);
  return (
    <Theme name="paper" className="app app-almanac">
      <article className="app-almanac-article" style={{ fontSize: `${size}rem` }}>
        <Eyebrow>Almanac · October</Eyebrow>
        <h3>On reading contour lines by lamplight</h3>
        <p className="app-almanac-dek">
          Close lines are steep ground; wide ones, easy going. The rest is patience.
        </p>
        {map && (
          <Panel className="app-almanac-figure">
            <SceneryWindow scene="contour" attachment="local" />
          </Panel>
        )}
        <p>
          The survey sheet folds to the size of a hand. Unfolded on the table, it becomes the whole
          valley: the ridge you walked yesterday, the ford that was higher than the map admitted,
          the wood where the path gives out and you follow the stream instead.
        </p>
        <p>
          Every fifth line is heavier. Count them upward from the river and you will know how high
          you slept.
        </p>
      </article>
      <aside className="app-almanac-settings">
        <Eyebrow>Reading</Eyebrow>
        <Slider
          label="Type size"
          min={0.85}
          max={1.3}
          step={0.05}
          value={size}
          onValueChange={(value) => setSize(value as number)}
        />
        <Separator />
        <Switch checked={map} onCheckedChange={setMap}>
          Show the map
        </Switch>
        <Switch defaultChecked>Justify text</Switch>
      </aside>
    </Theme>
  );
}
