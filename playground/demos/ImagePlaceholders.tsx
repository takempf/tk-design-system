import { type ReactNode, useState } from 'react';
import { Button, Icon, Image, Stack } from 'tk-design-system';
import { brokenPicture, paintingCount, useSlowPaintings } from '../pictures';

export const meta = {
  section: 'surfaces',
  title: 'Image placeholders',
  description:
    'What holds a picture’s place: the wash, after a beat; its own color or a blurred preview, at once; or the picture it replaces. One that can’t load keeps its place, marked.',
  order: 9,
  wide: true,
};

function Figure({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <figure style={{ margin: 0, display: 'grid', gap: 'var(--tk-space-2)' }}>
      {children}
      <figcaption className="tk-type-caption tk-ink-muted">{caption}</figcaption>
    </figure>
  );
}

const three = [1, 2, 4];
const slowly = () => 1800;

export default function ImagePlaceholders() {
  const [round, setRound] = useState(0);
  const [face, setFace] = useState(3);
  const [wash, color, preview] = useSlowPaintings(three, round, slowly);
  const [portrait] = useSlowPaintings([face], 0, () => 700);
  return (
    <Stack gap={5}>
      <Button
        size="sm"
        variant="ghost"
        style={{ alignSelf: 'start' }}
        onClick={() => setRound((n) => n + 1)}
      >
        <Icon name="refresh" /> Load again
      </Button>
      <div
        style={{
          display: 'grid',
          gap: 'var(--tk-space-4)',
          gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
        }}
      >
        {wash && (
          <Figure caption="The wash, after a beat">
            <Image key={round} src={wash.src} alt={wash.alt} ratio="3 / 2" />
          </Figure>
        )}
        {color && (
          <Figure caption="Its own color, at once">
            <Image key={round} src={color.src} alt={color.alt} color={color.color} ratio="3 / 2" />
          </Figure>
        )}
        {preview && (
          <Figure caption="A blurred preview, developing">
            <Image
              key={round}
              src={preview.src}
              alt={preview.alt}
              preview={preview.preview}
              ratio="3 / 2"
              reveal="dither"
            />
          </Figure>
        )}
      </div>
      <Stack direction="row" gap={4} wrap align="center">
        {portrait && (
          <Image
            src={portrait.src}
            alt={portrait.alt}
            shape="circle"
            reveal="dither"
            style={{ width: '4rem' }}
          />
        )}
        <Button size="sm" onClick={() => setFace((n) => (n + 1) % paintingCount)}>
          Next
        </Button>
        <span className="tk-type-caption tk-ink-muted" style={{ flex: '1 1 12rem' }}>
          A circle, for a face. The one before stays until the next is in.
        </span>
        <Image
          src={brokenPicture}
          alt="A picture that’s gone"
          shape="circle"
          style={{ width: '4rem' }}
        />
        <Image
          src={brokenPicture}
          alt="Ada Lovelace"
          shape="circle"
          fallback={<span className="tk-type-label">AL</span>}
          style={{ width: '4rem' }}
        />
      </Stack>
    </Stack>
  );
}
