import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps } from 'react';
import { PopupMorph, usePopupMorph } from '../motion/popupMorph';
import { usePortalContainer } from '../theme/Theme';
import { cx, part, withBase } from '../utils';
import { SharedElement } from './popup';

type Size = { readonly size?: 'sm' | 'md' | 'lg' };

function DialogRoot<Payload>({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: BaseDialog.Root.Props<Payload>) {
  const popup = usePopupMorph({
    open,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    prefix: 'dialog',
  });
  return (
    <PopupMorph.Provider value={popup.state}>
      <BaseDialog.Root
        {...props}
        open={popup.open}
        onOpenChange={popup.setOpen}
        onOpenChangeComplete={popup.onOpenChangeComplete}
      />
    </PopupMorph.Provider>
  );
}

function DialogTrigger(props: ComponentProps<typeof BaseDialog.Trigger>) {
  return (
    <PopupMorph.Trigger>
      <BaseDialog.Trigger {...props} />
    </PopupMorph.Trigger>
  );
}

/** A layout group inside the popup. */
function DialogContent({ className, ...props }: ComponentProps<'div'>) {
  return <div {...props} className={cx('tk-dialog-content', className)} />;
}

function DialogPopup({
  className,
  size = 'md',
  ref,
  children,
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & Size) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop className="tk-backdrop" />
      <BaseDialog.Viewport className="tk-dialog-viewport">
        <PopupMorph.Popup>
          <BaseDialog.Popup
            {...props}
            ref={ref}
            data-size={size}
            className={withBase('tk-dialog', className)}
          >
            <div className="tk-dialog-body">{children}</div>
          </BaseDialog.Popup>
        </PopupMorph.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

/**
 * A modal surface. `Dialog.Popup` bundles portal, backdrop and centring viewport.
 *
 * The trigger is the dialog's container, closed: opening, its frame moves and
 * grows into the dialog's, and closing takes it home. `Origin` makes a larger
 * element the container (a card holding the trigger); `SharedElement` carries
 * one element across, above the container. A dialog with no trigger on the
 * page (opened from elsewhere) rises in on its own.
 */
export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Origin: PopupMorph.Trigger,
  SharedElement,
  Content: DialogContent,
  Popup: DialogPopup,
  Title: part(BaseDialog.Title, 'tk-dialog-title'),
  Description: part(BaseDialog.Description, 'tk-dialog-description'),
  Close: BaseDialog.Close,
};

function AlertDialogRoot<Payload>({
  open,
  defaultOpen,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: BaseAlertDialog.Root.Props<Payload>) {
  const popup = usePopupMorph({
    open,
    defaultOpen,
    onOpenChange,
    onOpenChangeComplete,
    prefix: 'alert',
  });
  return (
    <PopupMorph.Provider value={popup.state}>
      <BaseAlertDialog.Root
        {...props}
        open={popup.open}
        onOpenChange={popup.setOpen}
        onOpenChangeComplete={popup.onOpenChangeComplete}
      />
    </PopupMorph.Provider>
  );
}

function AlertDialogTrigger(props: ComponentProps<typeof BaseAlertDialog.Trigger>) {
  return (
    <PopupMorph.Trigger>
      <BaseAlertDialog.Trigger {...props} />
    </PopupMorph.Trigger>
  );
}

function AlertDialogPopup({
  className,
  size = 'sm',
  ref,
  children,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Popup> & Size) {
  const container = usePortalContainer();
  return (
    <BaseAlertDialog.Portal container={container}>
      <BaseAlertDialog.Backdrop className="tk-backdrop" />
      <BaseAlertDialog.Viewport className="tk-dialog-viewport">
        <PopupMorph.Popup>
          <BaseAlertDialog.Popup
            {...props}
            ref={ref}
            data-size={size}
            className={withBase('tk-dialog', className)}
          >
            <div className="tk-dialog-body">{children}</div>
          </BaseAlertDialog.Popup>
        </PopupMorph.Popup>
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

/** A dialog that demands a decision. Outside clicks don't dismiss it. */
export const AlertDialog = {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Origin: PopupMorph.Trigger,
  SharedElement,
  Popup: AlertDialogPopup,
  Title: part(BaseAlertDialog.Title, 'tk-dialog-title'),
  Description: part(BaseAlertDialog.Description, 'tk-dialog-description'),
  Close: BaseAlertDialog.Close,
};
