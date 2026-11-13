import type { ReactElement } from 'react';
import { Separator } from 'tk-design-system';
import { DecipherLab } from './DecipherLab';
import { TimingsLab } from './TimingsLab';

export function MotionPage(): ReactElement {
  return (
    <div className="pg-lab">
      <TimingsLab />
      <Separator />
      <DecipherLab />
    </div>
  );
}

