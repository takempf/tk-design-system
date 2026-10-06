import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import {
  Children,
  type ComponentProps,
  type CSSProperties,
  cloneElement,
  createContext,
  type ReactElement,
  type RefObject,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Morph, morph, useMorphName } from '../motion/morph';
import { usePortalContainer } from '../theme/Theme';
import { cx, mergeRefs, part, withBase } from '../utils';
import { useGrowFrom } from './popup';

type Size = { readonly size?: 'sm' | 'md' | 'lg' };

interface DialogOpener {
  readonly shared: boolean;
  readonly expanded: boolean;
  readonly name: string;
  readonly trigger: RefObject<HTMLElement | null>;
}

const DialogOpenerContext = createContext<DialogOpener | null>(null);

function DialogRoot<Payload>({
  transition,
  open,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  ...props
}: BaseDialog.Root.Props<Payload> & {
  /** Morph the actual trigger container into the popup, including its contents. */
  readonly transition?: 'shared';
}) {
  const [inner, setInner] = useState(defaultOpen);
  const expanded = open ?? inner;
  const name = useMorphName('dialog');
  const flight = useRef<ViewTransition | null>(null);
  const turn = useRef(0);
  const trigger = useRef<HTMLElement>(null);
  const opener = useMemo(
    () => ({ shared: transition === 'shared', expanded, trigger, name }),
    [transition, expanded, name],
  );
  return (
    <DialogOpenerContext value={opener}>
      <BaseDialog.Root
        {...props}
        open={expanded}
        defaultOpen={defaultOpen}
        onOpenChange={(next, details) => {
          const update = () => {
            onOpenChange?.(next, details);
            if (!details.isCanceled) setInner(next);
          };
          turn.current++;
          if (opener.shared) {
            flight.current = morph(update, {
              type: next ? 'shared-open' : 'shared-close',
              scope: name,
              captureBackground: true,
            });
          } else update();
        }}
        onOpenChangeComplete={(next) => {
          const current = turn.current;
          const complete = () => {
            if (current === turn.current) onOpenChangeComplete?.(next);
          };
          if (flight.current) flight.current.finished.then(complete);
          else complete();
        }}
      />
    </DialogOpenerContext>
  );
}

function DialogTrigger({ ref, className, ...props }: ComponentProps<typeof BaseDialog.Trigger>) {
  const opener = useContext(DialogOpenerContext);
  const trigger = opener?.trigger;
  const refs = useMemo(() => mergeRefs(ref, trigger), [ref, trigger]);
  const button = (
    <BaseDialog.Trigger
      {...props}
      ref={refs}
      className={withBase(opener?.shared ? 'tk-shared-trigger tk-shared-container' : '', className)}
      data-tk-expanded={opener?.shared && opener.expanded ? '' : undefined}
    />
  );
  return opener?.shared ? (
    <Morph name={opener.name} scope={opener.name} active={!opener.expanded}>
      {button}
    </Morph>
  ) : (
    button
  );
}

/** Match a named element in the trigger with its counterpart in the popup. */
function SharedElement({
  name,
  side,
  children,
}: {
  readonly name: string;
  readonly side: 'trigger' | 'popup';
  readonly children: ReactElement<{ className?: string; style?: CSSProperties }>;
}) {
  const opener = useContext(DialogOpenerContext);
  const child = Children.only(children);
  const part = cloneElement(child, {
    'data-tk-shared-part': name,
    'data-tk-shared-side': side,
    className: cx(child.props.className, 'tk-shared-part'),
  } as Partial<typeof child.props>);
  return opener?.shared ? (
    <Morph
      name={`${opener.name}-${name}`}
      scope={opener.name}
      active={side === 'popup' ? opener.expanded : !opener.expanded}
    >
      {part}
    </Morph>
  ) : (
    part
  );
}

/** A layout group inside the popup's shared container. */
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
  const opener = useContext(DialogOpenerContext);
  const grow = useGrowFrom(opener?.trigger, { whenMorphing: false });
  const refs = useMemo(
    () => mergeRefs(ref, opener?.shared ? undefined : grow),
    [ref, grow, opener?.shared],
  );
  const popup = (
    <BaseDialog.Popup
      {...props}
      ref={refs}
      data-size={size}
      data-tk-shared={opener?.shared ? '' : undefined}
      className={withBase(
        opener?.shared ? 'tk-dialog tk-shared-container' : 'tk-dialog',
        className,
      )}
    >
      <div className="tk-dialog-body">{children}</div>
    </BaseDialog.Popup>
  );
  const backdrop = (
    <BaseDialog.Backdrop
      className={opener?.shared ? 'tk-backdrop tk-shared-backdrop' : 'tk-backdrop'}
    />
  );
  return (
    <BaseDialog.Portal container={container}>
      {opener?.shared ? (
        <Morph name={`${opener.name}-backdrop`} scope={opener.name} active={opener.expanded}>
          {backdrop}
        </Morph>
      ) : (
        backdrop
      )}
      <BaseDialog.Viewport className="tk-dialog-viewport">
        {opener?.shared ? (
          <Morph name={opener.name} scope={opener.name} active={opener.expanded}>
            {popup}
          </Morph>
        ) : (
          popup
        )}
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
  Root: DialogRoot,
  Trigger: DialogTrigger,
  SharedElement,
  Content: DialogContent,
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
