import { useEffect } from 'react';

import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { NodesInternal } from 'src/utils/layout/NodesContext';
import type { NodeValidationProps } from 'src/layout/layout';

export function SubFormValidator(props: NodeValidationProps<'SubForm'>) {
  const { node, externalItem } = props;

  const applicationMetadata = useApplicationMetadata();
  const dataType = applicationMetadata.dataTypes.find((x) => x.id === externalItem.dataType);

  const addError = NodesInternal.useAddError();

  useEffect(() => {
    if (dataType === undefined) {
      addError('Finner ikke datatypen i applicationmetadata', node);
      window.logErrorOnce(`SubFormValidator for node med id ${node.id}: Klarer ikke finne datatype for noden.`);
    } else if (dataType.appLogic?.allowInSubform != true) {
      addError('Datatypen er ikke tillatt for bruk i underskjema', node);
      window.logErrorOnce(
        `SubFormValidator for node med id ${node.id}: Datatypen er ikke tillatt for bruk i underskjema.`,
      );
    }
  }, [addError, dataType, node]);

  return null;
}
