import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { ComponentProps } from 'react';
import { usePortalContainer } from '../theme/Theme';
import { part, withBase } from '../utils';

type Size = { readonly size?: 'sm' | 'md' | 'lg' };

function DialogPopup({
  className,
  size = 'md',
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & Size) {
  const container = usePortalContainer();
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop className="tk-backdrop" />
      <BaseDialog.Viewport className="tk-dialog-viewport">
        <BaseDialog.Popup
          {...props}
          data-size={size}
          className={withBase('tk-dialog', className)}
        />
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

/** A modal surface. `Dialog.Popup` bundles portal, backdrop and centring viewport. */
export const Dialog = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Popup: DialogPopup,
  Title: part(BaseDialog.Title, 'tk-dialog-title'),
  Description: part(BaseDialog.Description, 'tk-dialog-description'),
  Close: BaseDialog.Close,
};

function AlertDialogPopup({
  className,
  size = 'sm',
  ...props
}: ComponentProps<typeof BaseAlertDialog.Popup> & Size) {
  const container = usePortalContainer();
  return (
    <BaseAlertDialog.Portal container={container}>
      <BaseAlertDialog.Backdrop className="tk-backdrop" />
      <BaseAlertDialog.Viewport className="tk-dialog-viewport">
        <BaseAlertDialog.Popup
          {...props}
          data-size={size}
          className={withBase('tk-dialog', className)}
        />
      </BaseAlertDialog.Viewport>
    </BaseAlertDialog.Portal>
  );
}

/** A dialog that demands a decision. Outside clicks don't dismiss it. */
export const AlertDialog = {
  Root: BaseAlertDialog.Root,
  Trigger: BaseAlertDialog.Trigger,
  Popup: AlertDialogPopup,
  Title: part(BaseAlertDialog.Title, 'tk-dialog-title'),
  Description: part(BaseAlertDialog.Description, 'tk-dialog-description'),
  Close: BaseAlertDialog.Close,
};
