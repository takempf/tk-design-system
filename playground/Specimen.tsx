import type { ComponentType } from 'react';
import { CodeBlock, Collapsible, Icon, Panel, toasts } from 'tk-design-system';

export interface DemoMeta {
  readonly section: string;
  readonly title: string;
  readonly description?: string;
  readonly order?: number;
  /** Stretch the stage to the full width of the section. */
  readonly wide?: boolean;
}

export interface Demo {
  readonly id: string;
  readonly meta: DemoMeta;
  readonly Component: ComponentType;
  readonly source: string;
}

// Each file in ./demos is a specimen: a default-exported component plus `meta`.
// The same file, imported raw, is the code shown beneath it — they can't drift.
const modules = import.meta.glob<{ default: ComponentType; meta: DemoMeta }>('./demos/*.tsx', {
  eager: true,
});
const sources = import.meta.glob<string>('./demos/*.tsx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const tidy = (source: string) =>
  source.replace(/export const meta[\s\S]*?\n};\n\n?/, '').replace(/^\s+|\s+$/g, '');

export const demos: Demo[] = Object.entries(modules)
  .map(([path, module]) => ({
    id: path.replace(/^.*\/|\.tsx$/g, ''),
    meta: module.meta,
    Component: module.default,
    source: tidy(sources[path] ?? ''),
  }))
  .sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99));

export function Code({
  source,
  language = 'tsx',
}: {
  readonly source: string;
  readonly language?: string;
}) {
  return (
    <CodeBlock
      className="pg-code"
      code={source}
      language={language}
      onCopyCode={() =>
        toasts.add({ title: 'Copied', description: 'The snippet is on your clipboard.' })
      }
    />
  );
}

export function Specimen({ demo }: { readonly demo: Demo }) {
  const { meta, Component, source } = demo;
  return (
    <Panel
      as="article"
      variant="outline"
      className="pg-specimen"
      data-wide={meta.wide || undefined}
    >
      <header className="pg-specimen-header">
        <h3>{meta.title}</h3>
        {meta.description && <p>{meta.description}</p>}
      </header>
      <div className="pg-stage">
        <Component />
      </div>
      <Collapsible.Root className="pg-source">
        <Collapsible.Trigger className="pg-source-trigger">
          <Icon name="chevron-right" className="pg-source-chevron" />
          Source
        </Collapsible.Trigger>
        <Collapsible.Panel>
          <Code source={source} />
        </Collapsible.Panel>
      </Collapsible.Root>
    </Panel>
  );
}
