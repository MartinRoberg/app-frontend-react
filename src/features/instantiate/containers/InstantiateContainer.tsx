import React from 'react';

import { isAxiosError } from 'axios';

import { Loader } from 'src/core/loading/Loader';
import { InstantiateValidationError } from 'src/features/instantiate/containers/InstantiateValidationError';
import { MissingRolesError } from 'src/features/instantiate/containers/MissingRolesError';
import { UnknownError } from 'src/features/instantiate/containers/UnknownError';
import { useInstantiation } from 'src/features/instantiate/InstantiationContext';
import { useAppSelector } from 'src/hooks/useAppSelector';
import { AltinnAppTheme } from 'src/theme/altinnAppTheme';
import { changeBodyBackground } from 'src/utils/bodyStyling';
import { HttpStatusCodes } from 'src/utils/network/networking';

export const InstantiateContainer = () => {
  changeBodyBackground(AltinnAppTheme.altinnPalette.primary.greyLight);
  const selectedParty = useAppSelector((state) => state.party.selectedParty);
  const instantiation = useInstantiation();

  React.useEffect(() => {
    const shouldCreateInstance = !!selectedParty && !instantiation.lastResult && !instantiation.isLoading;
    if (shouldCreateInstance) {
      instantiation.instantiate(undefined, selectedParty.partyId);
    }
  }, [selectedParty, instantiation]);

  if (isAxiosError(instantiation.error)) {
    const message = (instantiation.error.response?.data as any)?.message;
    if (instantiation.error.response?.status === HttpStatusCodes.Forbidden) {
      if (message) {
        return <InstantiateValidationError message={message} />;
      }
      return <MissingRolesError />;
    }

    return <UnknownError />;
  }

  return <Loader reason={'instantiating'} />;
};
