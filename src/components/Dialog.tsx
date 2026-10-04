import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { type ComponentProps, useMemo } from 'react';
import { usePortalContainer } from '../theme/Theme';
import { mergeRefs, part, withBase } from '../utils';
import { useGrowFrom } from './popup';

type Size = { readonly size?: 'sm' | 'md' | 'lg' };

function DialogPopup({
  className,
  size = 'md',
  ref,
  children,
  ...props
}: ComponentProps<typeof BaseDialog.Popup> & Size) {
  const container = usePortalContainer();
  const grow = useGrowFrom(undefined, { whenMorphing: false });
  const refs = useMemo(() => mergeRefs(ref, grow), [ref, grow]);
  return (
    <BaseDialog.Portal container={container}>
      <BaseDialog.Backdrop className="tk-backdrop" />
      <BaseDialog.Viewport className="tk-dialog-viewport">
        <BaseDialog.Popup
          {...props}
          ref={refs}
          data-size={size}
          className={withBase('tk-dialog', className)}
        >
          <div className="tk-dialog-body">{children}</div>
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

/**
 * A modal surface. `Dialog.Popup` bundles portal, backdrop and centring viewport.
 * It grows out of its trigger's frame, unless it opens inside a `morph()`, which
 * then carries it.
 */
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
  ref,
  children,
  ...props
}: ComponentProps<typeof BaseAlertDialog.Popup> & Size) {
  const container = usePortalContainer();
  const grow = useGrowFrom(undefined, { whenMorphing: false });
  const refs = useMemo(() => mergeRefs(ref, grow), [ref, grow]);
  return (
    <BaseAlertDialog.Portal container={container}>
      <BaseAlertDialog.Backdrop className="tk-backdrop" />
      <BaseAlertDialog.Viewport className="tk-dialog-viewport">
        <BaseAlertDialog.Popup
          {...props}
          ref={refs}
          data-size={size}
          className={withBase('tk-dialog', className)}
        >
          <div className="tk-dialog-body">{children}</div>
        </BaseAlertDialog.Popup>
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
