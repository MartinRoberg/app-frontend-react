import React from 'react';

import cn from 'classnames';
import { isValid, parseISO } from 'date-fns';

import classes from 'src/app-components/Date/Date.module.css';
import { DisplayDate } from 'src/app-components/Date/DisplayDate';
import { getLabelId } from 'src/components/label/Label';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { ComponentStructureWrapper } from 'src/layout/ComponentStructureWrapper';
import { formatDateLocale } from 'src/utils/formatDateLocale';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { PropsFromGenericComponent } from 'src/layout';

export const DateComponent = ({ node }: PropsFromGenericComponent<'Date'>) => {
  const { textResourceBindings, value, icon, direction, format } = useNodeItem(node);
  const language = useCurrentLanguage();
  const parsedValue = parseISO(value);

  let displayData: string | null = null;
  try {
    displayData = isValid(parsedValue) ? formatDateLocale(language, parsedValue, format) : null;
  } catch (err) {
    if (value?.trim()) {
      window.logErrorOnce(`Date component "${node.id}" failed to parse date "${value}":`, err);
    }
  }

  if (!textResourceBindings?.title) {
    return <DisplayDate value={displayData} />;
  }

  return (
    <ComponentStructureWrapper
      node={node}
      label={{
        node,
        renderLabelAs: 'span',
        className: cn(classes.dateComponent, direction === 'vertical' ? classes.vertical : classes.horizontal),
      }}
    >
      <DisplayDate
        value={displayData}
        iconUrl={icon}
        iconAltText={textResourceBindings.title}
        labelId={getLabelId(node.id)}
      />
    </ComponentStructureWrapper>
  );
};
