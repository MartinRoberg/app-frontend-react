import React from 'react';

import { ErrorMessage } from '@digdir/designsystemet-react';

import { Lang } from 'src/features/language/Lang';
import { useLanguage } from 'src/features/language/useLanguage';
import { useUnifiedValidationsForNode } from 'src/features/validation/selectors/unifiedValidationsForNode';
import { validationsOfSeverity } from 'src/features/validation/utils';
import { AlertBaseComponent } from 'src/layout/Alert/AlertBaseComponent';
import { useCurrentNode } from 'src/layout/FormComponentContext';
import { useGetUniqueKeyFromObject } from 'src/utils/useGetKeyFromObject';
import type { BaseValidation, NodeValidation } from 'src/features/validation';
import type { AlertSeverity } from 'src/layout/Alert/config.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

interface Props {
  validations: NodeValidation[] | undefined;
}

export function AllComponentValidations() {
  const node = useCurrentNode();
  const validations = useUnifiedValidationsForNode(node);
  return <ComponentValidations validations={validations} />;
}

export function ComponentValidations({ validations }: Props) {
  const node = useCurrentNode();
  if (!validations || validations.length === 0 || !node) {
    return null;
  }

  const errors = validationsOfSeverity(validations, 'error');
  const warnings = validationsOfSeverity(validations, 'warning');
  const info = validationsOfSeverity(validations, 'info');
  const success = validationsOfSeverity(validations, 'success');

  return (
    <div data-validation={node.getId()}>
      {errors.length > 0 && (
        <ErrorValidations
          validations={errors}
          node={node}
        />
      )}
      {warnings.length > 0 && (
        <SoftValidations
          validations={warnings}
          variant='warning'
          node={node}
        />
      )}
      {info.length > 0 && (
        <SoftValidations
          validations={info}
          variant='info'
          node={node}
        />
      )}
      {success.length > 0 && (
        <SoftValidations
          validations={success}
          variant='success'
          node={node}
        />
      )}
    </div>
  );
}

function ErrorValidations({ validations, node }: { validations: BaseValidation<'error'>[]; node: LayoutNode }) {
  const getUniqueKeyFromObject = useGetUniqueKeyFromObject();

  return (
    <ol style={{ padding: 0, margin: 0, listStyleType: 'none' }}>
      {validations.map((validation) => (
        <li key={getUniqueKeyFromObject(validation)}>
          <ErrorMessage
            role='alert'
            size='small'
          >
            <Lang
              id={validation.message.key}
              params={validation.message.params}
              node={node}
            />
          </ErrorMessage>
        </li>
      ))}
    </ol>
  );
}

function SoftValidations({
  validations,
  variant,
  node,
}: {
  validations: BaseValidation<'warning' | 'info' | 'success'>[];
  variant: AlertSeverity;
  node: LayoutNode;
}) {
  const getUniqueKeyFromObject = useGetUniqueKeyFromObject();
  const { langAsString } = useLanguage();

  /**
   * Rendering the error messages as an ordered
   * list with each error message as a list item.
   */
  const ariaLabel = validations.map((v) => langAsString(v.message.key, v.message.params)).join();

  return (
    <div style={{ paddingTop: 'var(--fds-spacing-2)' }}>
      <AlertBaseComponent
        severity={variant}
        useAsAlert={true}
        ariaLabel={ariaLabel}
      >
        <ol style={{ paddingLeft: 0, listStyleType: 'none' }}>
          {validations.map((validation) => (
            <li
              role='alert'
              key={getUniqueKeyFromObject(validation)}
            >
              <Lang
                id={validation.message.key}
                params={validation.message.params}
                node={node}
              />
            </li>
          ))}
        </ol>
      </AlertBaseComponent>
    </div>
  );
}
