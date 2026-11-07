import {
  animalNames,
  Eyebrow,
  Icon,
  type IconName,
  iconNames,
  Logo,
  markNames,
  Panel,
  Tooltip,
} from 'tk-design-system';

const animals = new Set<IconName>(animalNames);
const icons = iconNames.filter((name) => !markNames.includes(name) && !animals.has(name));

function AnimalGrid({ names }: { names: readonly IconName[] }) {
  return (
    <ul className="pg-glyph-grid pg-animal-grid">
      {names.map((name) => (
        <li key={name}>
          <Icon name={name} size={40} />
          <code>{name}</code>
        </li>
      ))}
    </ul>
  );
}

export function Glyphs() {
  return (
    <div className="pg-glyphs">
      <Eyebrow>Logo</Eyebrow>
      <Panel variant="outline" className="pg-logo">
        <Logo size={96} />
        <Logo size={40} />
        <Logo size={16} />
        <p>
          <Logo label="" /> design system
        </p>
      </Panel>
      <Eyebrow>Animal marks</Eyebrow>
      <p className="pg-muted">
        Horn, wing, ear, coil. Forty-six suggestions built from open lines and simple masses.
      </p>
      <AnimalGrid names={animalNames} />
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
        <code>--tk-icon-join</code>): mitred in Grove, rounded in Paper. The logo is solid and takes
        its colour from the text around it; <code>tk-design-system/logo.svg</code> is the same mark
        as a file.
      </p>
    </div>
  );
}
