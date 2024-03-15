import React from 'react';

import { Grid } from '@material-ui/core';
import Moment from 'moment';

import type { PropsFromGenericComponent } from '..';

import { AltinnSummaryTable } from 'src/components/table/AltinnSummaryTable';
import { useAppReceiver } from 'src/core/texts/appTexts';
import { useLaxInstanceData } from 'src/features/instance/InstanceContext';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useLanguage } from 'src/features/language/useLanguage';
import { useParties } from 'src/features/party/PartiesProvider';
import { getDateFormat } from 'src/utils/dateHelpers';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { SummaryDataObject } from 'src/components/table/AltinnSummaryTable';
import type { IUseLanguage } from 'src/features/language/useLanguage';
import type { IParty } from 'src/types/shared';

export const returnInstanceMetaDataObject = (
  langTools: IUseLanguage,
  instanceDateSent?: string | boolean | null | undefined,
  instanceSender?: string | boolean | null | undefined,
  instanceReceiver?: string | boolean | null | undefined,
  instanceReferenceNumber?: string | boolean | null | undefined,
) => {
  const obj: SummaryDataObject = {};
  const { langAsString } = langTools;

  if (instanceDateSent) {
    obj[langAsString('receipt.date_sent')] = {
      value: instanceDateSent,
      hideFromVisualTesting: true,
    };
  }

  if (instanceSender) {
    obj[langAsString('receipt.sender')] = {
      value: instanceSender,
    };
  }

  if (instanceReceiver) {
    obj[langAsString('receipt.receiver')] = {
      value: instanceReceiver,
    };
  }

  if (instanceReferenceNumber) {
    obj[langAsString('receipt.ref_num')] = {
      value: instanceReferenceNumber,
      hideFromVisualTesting: true,
    };
  }

  return obj;
};

export function InstanceInformationComponent({ node }: PropsFromGenericComponent<'InstanceInformation'>) {
  const elements = useNodeItem(node).elements;
  const { dateSent, sender, receiver, referenceNumber } = elements || {};
  const langTools = useLanguage();
  const selectedLanguage = useCurrentLanguage();

  const instance = useLaxInstanceData();
  const parties = useParties();
  const appReceiver = useAppReceiver();

  const instanceOwnerParty =
    instance && parties?.find((party: IParty) => party.partyId.toString() === instance.instanceOwner.partyId);

  const instanceDateSent =
    dateSent !== false && Moment(instance?.lastChanged).format(getDateFormat(undefined, selectedLanguage));

  const instanceSender =
    sender !== false &&
    instanceOwnerParty &&
    `${instanceOwnerParty.ssn ? instanceOwnerParty.ssn : instanceOwnerParty.orgNumber}-${instanceOwnerParty.name}`;

  const instanceReceiver = receiver !== false ? appReceiver ?? 'Error: Receiver org not found' : undefined;

  const instanceReferenceNumber = referenceNumber !== false && instance && instance.id.split('/')[1].split('-')[4];

  const instanceMetaDataObject = returnInstanceMetaDataObject(
    langTools,
    instanceDateSent,
    instanceSender,
    instanceReceiver,
    instanceReferenceNumber,
  );

  if (!instanceMetaDataObject) {
    return null;
  }

  return (
    <Grid
      item={true}
      container={true}
      xs={12}
    >
      <AltinnSummaryTable summaryDataObject={instanceMetaDataObject} />
    </Grid>
  );
}
