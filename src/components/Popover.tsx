import { Popover as BasePopover } from '@base-ui/react/popover';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { part, withBase } from '../utils';
import { SharedElement } from './popup';

function PopoverRoot<Payload>({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: BasePopover.Root.Props<Payload>) {
  const popup = usePopupMorph({
    open,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    prefix: 'popover',
  });
  return (
    <PopupMorph.Provider value={popup.state}>
      <BasePopover.Root
        {...props}
        open={popup.open}
        onOpenChange={popup.setOpen}
        onOpenChangeComplete={popup.onOpenChangeComplete}
      />
    </PopupMorph.Provider>
  );
}

function PopoverTrigger(props: ComponentProps<typeof BasePopover.Trigger>) {
  return (
    <PopupMorph.Trigger>
      <BasePopover.Trigger {...props} />
    </PopupMorph.Trigger>
  );
}

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
  ref,
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
        <PopupMorph.Popup>
          <BasePopover.Popup
            {...props}
            ref={ref}
            className={withBase('tk-popup tk-popover', className)}
          />
        </PopupMorph.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

/**
 * Rich, interactive content anchored to a trigger. The trigger is the popup's
 * container, closed: its frame moves and grows into the popup's, and back.
 * `Origin` makes a larger element the container (a card holding the trigger);
 * `SharedElement` carries one element across, above the container.
 */
export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Origin: PopupMorph.Trigger,
  SharedElement,
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
