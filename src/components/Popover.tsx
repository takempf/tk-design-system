import { Popover as BasePopover } from '@base-ui/react/popover';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { usePortalContainer } from '../theme/Theme';
import { part, withBase } from '../utils';

type PositionerProps = Pick<
  ComponentProps<typeof BasePopover.Positioner>,
  'side' | 'align' | 'sideOffset' | 'alignOffset'
>;

function PopoverPopup({
  side,
  align,
  sideOffset = 8,
  alignOffset,
  className,
  ...props
}: ComponentProps<typeof BasePopover.Popup> & PositionerProps) {
  const container = usePortalContainer();
  return (
    <BasePopover.Portal container={container}>
      <BasePopover.Positioner
        className="tk-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <BasePopover.Popup {...props} className={withBase('tk-popup tk-popover', className)} />
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

/** Rich, interactive content anchored to a trigger. */
export const Popover = {
  Root: BasePopover.Root,
  Trigger: BasePopover.Trigger,
  Popup: PopoverPopup,
  Title: part(BasePopover.Title, 'tk-popover-title'),
  Description: part(BasePopover.Description, 'tk-popover-description'),
  Close: BasePopover.Close,
};

export interface TooltipProps {
  /** The trigger. Must be a single element that can hold a ref. */
  readonly children: ReactElement;
  readonly content: ReactNode;
  readonly side?: 'top' | 'bottom' | 'left' | 'right';
  readonly delay?: number;
}

/** A short hint on hover or focus. Wrap an app (or section) in `TooltipProvider`. */
export function Tooltip({ children, content, side = 'top', delay }: TooltipProps) {
  const container = usePortalContainer();
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} delay={delay} />
      <BaseTooltip.Portal container={container}>
        <BaseTooltip.Positioner className="tk-positioner" side={side} sideOffset={8}>
          <BaseTooltip.Popup className="tk-popup tk-tooltip">{content}</BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

export const TooltipProvider = BaseTooltip.Provider;
