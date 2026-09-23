import { Meter as BaseMeter } from '@base-ui/react/meter';
import { Progress as BaseProgress } from '@base-ui/react/progress';
import { Slider as BaseSlider } from '@base-ui/react/slider';
import type { ComponentProps, ReactNode } from 'react';
import { withBase } from '../utils';

export type SliderProps = ComponentProps<typeof BaseSlider.Root> & {
  readonly label?: ReactNode;
  /** Show the current value beside the label. */
  readonly showValue?: boolean;
};

/** One or more thumbs along a track. Pass an array value for a range. */
export function Slider({ label, showValue = Boolean(label), className, ...props }: SliderProps) {
  const initial = props.value ?? props.defaultValue;
  const thumbs = Array.isArray(initial) ? initial.length : 1;
  return (
    <BaseSlider.Root {...props} className={withBase('tk-slider', className)}>
      {(label || showValue) && (
        <div className="tk-range-header">
          {label && <BaseSlider.Label className="tk-range-label">{label}</BaseSlider.Label>}
          {showValue && <BaseSlider.Value className="tk-range-value" />}
        </div>
      )}
      <BaseSlider.Control className="tk-slider-control">
        <BaseSlider.Track className="tk-slider-track">
          <BaseSlider.Indicator className="tk-slider-indicator" />
          {Array.from({ length: thumbs }, (_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: thumbs are positional
            <BaseSlider.Thumb key={index} index={index} className="tk-slider-thumb" />
          ))}
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}

export type ProgressProps = ComponentProps<typeof BaseProgress.Root> & {
  readonly label?: ReactNode;
  readonly showValue?: boolean;
};

/** Task completion. `value={null}` for indeterminate. */
export function Progress({ label, showValue = true, className, ...props }: ProgressProps) {
  return (
    <BaseProgress.Root {...props} className={withBase('tk-meter', className)}>
      {(label || showValue) && (
        <div className="tk-range-header">
          {label && <BaseProgress.Label className="tk-range-label">{label}</BaseProgress.Label>}
          {showValue && <BaseProgress.Value className="tk-range-value" />}
        </div>
      )}
      <BaseProgress.Track className="tk-meter-track">
        <BaseProgress.Indicator className="tk-meter-indicator" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export type MeterProps = ComponentProps<typeof BaseMeter.Root> & {
  readonly label?: ReactNode;
  readonly showValue?: boolean;
};

/** A measurement within a known range, like storage or battery. */
export function Meter({ label, showValue = true, className, ...props }: MeterProps) {
  return (
    <BaseMeter.Root {...props} className={withBase('tk-meter', className)}>
      {(label || showValue) && (
        <div className="tk-range-header">
          {label && <BaseMeter.Label className="tk-range-label">{label}</BaseMeter.Label>}
          {showValue && <BaseMeter.Value className="tk-range-value" />}
        </div>
      )}
      <BaseMeter.Track className="tk-meter-track">
        <BaseMeter.Indicator className="tk-meter-indicator" />
      </BaseMeter.Track>
    </BaseMeter.Root>
  );
}
