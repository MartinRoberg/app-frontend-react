import React from 'react';

import { useDataModelBindings } from 'src/features/formData/useDataModelBindings';
import { Lang } from 'src/features/language/Lang';
import { ComponentValidations } from 'src/features/validation/ComponentValidations';
import { useBindingValidationsForNode } from 'src/features/validation/selectors/bindingValidationsForNode';
import classes from 'src/layout/Address/AddressSummary/AddressSummary.module.css';
import { SingleValueSummary } from 'src/layout/Summary2/CommonSummaryComponents/SingleValueSummary';
import type { AddressSummaryOverrideProps } from 'src/layout/Summary2/config.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

interface AddressSummaryProps {
  componentNode: LayoutNode<'Address'>;
  summaryOverrides?: AddressSummaryOverrideProps;
}

export function AddressSummary({ componentNode, summaryOverrides }: AddressSummaryProps) {
  const textResourceBindings = componentNode.item.textResourceBindings;
  const { title, careOfTitle, zipCodeTitle, postPlaceTitle, houseNumberTitle } = textResourceBindings ?? {};
  const { formData } = useDataModelBindings(componentNode.item.dataModelBindings);
  const { address, postPlace, zipCode, careOf, houseNumber } = formData;

  const bindingValidations = useBindingValidationsForNode(componentNode);
  return (
    <div className={classes.addressSummaryComponent}>
      <div>
        <SingleValueSummary
          title={<Lang id={title || 'address_component.address'} />}
          displayData={address}
          componentNode={componentNode}
          emptyFieldText={summaryOverrides?.emptyFieldTextAddress}
        />
        <ComponentValidations
          validations={bindingValidations?.address}
          node={componentNode}
        />
      </div>

      {!componentNode.item.simplified && (
        <div>
          <SingleValueSummary
            title={<Lang id={careOfTitle || 'address_component.care_of'} />}
            displayData={careOf}
            componentNode={componentNode}
            hideEditButton={true}
            emptyFieldText={summaryOverrides?.emptyFieldTextCO}
          />
          <ComponentValidations
            validations={bindingValidations?.careOf}
            node={componentNode}
          />
        </div>
      )}

      <div className={classes.addressSummaryComponentZipCode}>
        <div className={classes.addressComponentZipCode}>
          <SingleValueSummary
            title={<Lang id={zipCodeTitle || 'address_component.zip_code'} />}
            displayData={zipCode}
            componentNode={componentNode}
            hideEditButton={true}
            emptyFieldText={summaryOverrides?.emptyFieldTextZipCode}
          />
          <ComponentValidations
            validations={bindingValidations?.zipCode}
            node={componentNode}
          />
        </div>

        <div className={classes.addressSummaryComponentPostplace}>
          <SingleValueSummary
            title={<Lang id={postPlaceTitle || 'address_component.post_place'} />}
            displayData={postPlace}
            componentNode={componentNode}
            hideEditButton={true}
            emptyFieldText={summaryOverrides?.emptyFieldTextPostPlace}
          />
          <ComponentValidations
            validations={bindingValidations?.postPlace}
            node={componentNode}
          />
        </div>
        {!componentNode.item.simplified && (
          <div>
            <SingleValueSummary
              title={<Lang id={houseNumberTitle || 'address_component.house_number'} />}
              displayData={houseNumber}
              componentNode={componentNode}
              hideEditButton={true}
              emptyFieldText={summaryOverrides?.emptyFieldTextHouseNumber}
            />
            <ComponentValidations
              validations={bindingValidations?.houseNumber}
              node={componentNode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
