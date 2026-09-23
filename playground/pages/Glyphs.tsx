import { Eyebrow, Icon, iconNames, markNames, Tooltip } from 'tk-design-system';

const icons = iconNames.filter((name) => !markNames.includes(name));

export function Glyphs() {
  return (
    <div className="pg-glyphs">
      <Eyebrow>Marks</Eyebrow>
      <ul className="pg-glyph-grid" data-marks="">
        {markNames.map((name) => (
          <li key={name}>
            <Tooltip content={name}>
              <span className="pg-mark">
                <Icon name={name} size={40} />
              </span>
            </Tooltip>
            <code>{name}</code>
          </li>
        ))}
      </ul>
      <Eyebrow>Icons</Eyebrow>
      <ul className="pg-glyph-grid">
        {icons.map((name) => (
          <li key={name}>
            <Icon name={name} size={28} />
            <code>{name}</code>
          </li>
        ))}
      </ul>
      <p className="pg-muted">
        One stroke for every outline, solids as fills, one optical size for every mark. Weight, caps
        and joins are tokens (<code>--tk-icon-stroke</code>, <code>--tk-icon-cap</code>,{' '}
        <code>--tk-icon-join</code>): mitred in Grove, rounded in Paper.
      </p>
    </div>
  );
}
