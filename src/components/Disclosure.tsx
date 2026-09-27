import { Accordion as BaseAccordion } from '@base-ui/react/accordion';
import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type { ComponentProps } from 'react';
import { Icon } from '../icons/Icon';
import { part, withBase } from '../utils';

function TabsList({ children, className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List {...props} className={withBase('tk-tabs-list', className)}>
      {children}
      <BaseTabs.Indicator className="tk-tabs-indicator" />
    </BaseTabs.List>
  );
}

/** Tabs whose indicator slides between them. The list includes the indicator. */
export const Tabs = {
  Root: part(BaseTabs.Root, 'tk-tabs'),
  List: TabsList,
  Tab: part(BaseTabs.Tab, 'tk-tab'),
  Panel: part(BaseTabs.Panel, 'tk-tabs-panel'),
};

function AccordionTrigger({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Trigger>) {
  return (
    <BaseAccordion.Header className="tk-accordion-header">
      <BaseAccordion.Trigger {...props} className={withBase('tk-accordion-trigger', className)}>
        <span>{children}</span>
        <Icon name="chevron-down" className="tk-accordion-icon" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

function AccordionPanel({
  children,
  className,
  ...props
}: ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel {...props} className={withBase('tk-accordion-panel', className)}>
      <div className="tk-accordion-content">{children}</div>
    </BaseAccordion.Panel>
  );
}

/** Stacked sections that open in place; panels animate their height. */
export const Accordion = {
  Root: part(BaseAccordion.Root, 'tk-accordion'),
  Item: part(BaseAccordion.Item, 'tk-accordion-item'),
  Trigger: AccordionTrigger,
  Panel: AccordionPanel,
};

export const Collapsible = {
  Root: part(BaseCollapsible.Root, 'tk-collapsible'),
  Trigger: part(BaseCollapsible.Trigger, 'tk-collapsible-trigger'),
  Panel: part(BaseCollapsible.Panel, 'tk-collapsible-panel'),
};
