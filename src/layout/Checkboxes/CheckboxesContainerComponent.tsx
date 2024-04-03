import React from 'react';

import { Checkbox, HelpText } from '@digdir/design-system-react';
import cn from 'classnames';

import { AltinnSpinner } from 'src/components/AltinnSpinner';
import { OptionalIndicator } from 'src/components/form/OptionalIndicator';
import { RequiredIndicator } from 'src/components/form/RequiredIndicator';
import { Lang } from 'src/features/language/Lang';
import { useLanguage } from 'src/features/language/useLanguage';
import { useGetOptions } from 'src/features/options/useGetOptions';
import classes from 'src/layout/Checkboxes/CheckboxesContainerComponent.module.css';
import { WrappedCheckbox } from 'src/layout/Checkboxes/WrappedCheckbox';
import { shouldUseRowLayout } from 'src/utils/layout';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { PropsFromGenericComponent } from 'src/layout';

export type ICheckboxContainerProps = PropsFromGenericComponent<'Checkboxes'>;

export const CheckboxContainerComponent = ({ node, isValid, overrideDisplay }: ICheckboxContainerProps) => {
  const item = useNodeItem(node);
  const { id, layout, readOnly, textResourceBindings, required, labelSettings, alertOnChange } = item;
  const { langAsString } = useLanguage();

  const {
    options: calculatedOptions,
    isFetching,
    setData,
    current,
    currentStringy,
  } = useGetOptions({
    valueType: 'multi',
    ...item,
    node,
  });

  const labelTextGroup = (
    <span className={classes.checkboxLabelContainer}>
      <span className={classes.labelContent}>
        <Lang id={textResourceBindings?.title} />
        <RequiredIndicator required={required} />
        <OptionalIndicator
          labelSettings={labelSettings}
          required={required}
        />
      </span>
      {textResourceBindings?.help && (
        <HelpText title={langAsString(textResourceBindings?.help)}>
          <Lang id={textResourceBindings?.help} />
        </HelpText>
      )}
    </span>
  );

  const horizontal = shouldUseRowLayout({
    layout,
    optionsCount: calculatedOptions.length,
  });
  const hideLabel = overrideDisplay?.renderedInTable === true && calculatedOptions.length === 1;
  const ariaLabel = overrideDisplay?.renderedInTable ? langAsString(textResourceBindings?.title) : undefined;

  return isFetching ? (
    <AltinnSpinner />
  ) : (
    <div
      id={id}
      key={`checkboxes_group_${id}`}
    >
      <Checkbox.Group
        className={cn({ [classes.horizontal]: horizontal }, classes.checkboxGroup)}
        legend={labelTextGroup}
        description={<Lang id={textResourceBindings?.description} />}
        disabled={readOnly}
        hideLegend={overrideDisplay?.renderLegend === false}
        error={!isValid}
        aria-label={ariaLabel}
        value={currentStringy}
        data-testid='checkboxes-fieldset'
      >
        {calculatedOptions.map((option) => (
          <WrappedCheckbox
            key={option.value}
            id={id}
            option={option}
            hideLabel={hideLabel}
            alertOnChange={alertOnChange}
            checked={current.includes(option)}
            setChecked={(isChecked) => {
              const newData = isChecked ? [...current, option] : current.filter((o) => o !== option);
              setData(newData);
            }}
          />
        ))}
      </Checkbox.Group>
    </div>
  );
};
