import { Toast as BaseToast } from '@base-ui/react/toast';
import type { ReactNode } from 'react';
import { Icon } from '../icons/Icon';
import { usePortalContainer } from '../theme/Theme';

/** Add toasts from anywhere, including outside React: `toasts.add({ title })`. */
export const toasts = BaseToast.createToastManager();

export const useToasts = BaseToast.useToastManager;

function ToastList() {
  const { toasts: list } = BaseToast.useToastManager();
  return list.map((toast) => (
    <BaseToast.Root key={toast.id} toast={toast} className="tk-toast" data-tone={toast.type}>
      <BaseToast.Content className="tk-toast-content">
        <div className="tk-toast-text">
          <BaseToast.Title className="tk-toast-title" />
          <BaseToast.Description className="tk-toast-description" />
        </div>
        <BaseToast.Close className="tk-toast-close" aria-label="Dismiss">
          <Icon name="close" />
        </BaseToast.Close>
      </BaseToast.Content>
    </BaseToast.Root>
  ));
}

/**
 * Mount once near the root. Uses the shared `toasts` manager unless given another.
 * `type` on a toast ('success' | 'danger' | …) becomes its `data-tone`.
 */
export function Toaster({
  children,
  manager = toasts,
  limit = 3,
}: {
  readonly children?: ReactNode;
  readonly manager?: ReturnType<typeof BaseToast.createToastManager>;
  readonly limit?: number;
}) {
  const container = usePortalContainer();
  return (
    <BaseToast.Provider toastManager={manager} limit={limit}>
      {children}
      <BaseToast.Portal container={container}>
        <BaseToast.Viewport className="tk-toast-viewport">
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}
