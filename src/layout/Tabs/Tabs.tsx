import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Tabs as DesignsystemetTabs } from '@digdir/designsystemet-react';

import { Lang } from 'src/features/language/Lang';
import { useLanguage } from 'src/features/language/useLanguage';
import { useNavigateToNodeFromSearchParams } from 'src/hooks/useNavigateToNodeFromSearchParams';
import { GenericComponent } from 'src/layout/GenericComponent';
import type { IdAndRef } from 'src/hooks/useNavigateToNodeFromSearchParams';
import type { PropsFromGenericComponent } from 'src/layout';

export enum TabSearchParams {
  ActiveTab = 'activeTab',
}

export const Tabs = ({ node }: PropsFromGenericComponent<'Tabs'>) => {
  const [activeTab, setActiveTab] = useState<string | undefined>(
    node.item.defaultTab ?? node.item.tabsInternal.at(0)?.id,
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const tabs = node.item.tabsInternal.map((tab) => ({
    ...tab,
    childNodes: tab.childNodes.map((node) => ({
      node,
      ref: React.createRef<HTMLDivElement>(),
    })),
  }));

  useEffect(() => {
    const activeTabFromSearchParams = searchParams.get(TabSearchParams.ActiveTab);
    if (activeTabFromSearchParams) {
      setActiveTab(activeTabFromSearchParams);
    }

    return () => {
      if (activeTabFromSearchParams) {
        searchParams.delete(TabSearchParams.ActiveTab);
        setSearchParams(searchParams);
      }
    };
  }, [searchParams, setSearchParams]);

  const mainIdsWithRefs: IdAndRef[] = tabs
    .map((tab) => tab.childNodes)
    .flat()
    .map(({ node, ref }) => ({ id: node.item.id, ref }));
  useNavigateToNodeFromSearchParams(mainIdsWithRefs);

  return (
    <DesignsystemetTabs
      defaultValue={activeTab}
      value={activeTab}
      onChange={(tabId) => setActiveTab(tabId)}
      size={node.item.size}
    >
      <DesignsystemetTabs.List>
        {tabs.map((tab) => (
          <TabHeader
            key={tab.id}
            id={tab.id}
            title={tab.title}
            icon={tab.icon}
            isActive={tab.id === activeTab}
          />
        ))}
      </DesignsystemetTabs.List>
      {tabs.map((tab) => (
        <DesignsystemetTabs.Content
          key={tab.id}
          value={tab.id}
          role='tabpanel'
          style={{
            backgroundColor: 'white',
          }}
        >
          {tab.childNodes.map(({ node, ref }) => (
            <GenericComponent
              key={node.item.id}
              node={node}
              ref={ref}
            />
          ))}
        </DesignsystemetTabs.Content>
      ))}
    </DesignsystemetTabs>
  );
};

function TabHeader({
  id,
  title,
  icon,
  isActive,
}: {
  id: string;
  title: string;
  icon: string | undefined;
  isActive?: boolean;
}) {
  const { langAsString } = useLanguage();
  const translatedTitle = langAsString(title);

  if (icon) {
    const imgType = icon.split('.').at(-1);

    if (!imgType) {
      throw new Error('Image source is missing file type. Are you sure the image source is correct?');
    }
    if (!['svg', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(imgType.toLowerCase())) {
      throw new Error('Only images of the types: .svg, .png, .jpg, .jpeg, .gif, .bmp, .tiff, are supported');
    }
  }

  return (
    <DesignsystemetTabs.Tab
      key={id}
      value={id}
      style={{
        backgroundColor: isActive ? 'white' : 'transparent',
      }}
      tabIndex={0}
    >
      {!!icon && (
        <img
          src={icon}
          alt=''
          style={{
            width: '24px',
          }}
        />
      )}
      <Lang id={translatedTitle} />
    </DesignsystemetTabs.Tab>
  );
}
