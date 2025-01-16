import React from 'react';

import { expect, jest } from '@jest/globals';
import { act, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getIncomingApplicationMetadataMock } from 'src/__mocks__/getApplicationMetadataMock';
import { getLogoMock } from 'src/__mocks__/getLogoMock';
import { LogoColor } from 'src/components/logo/AltinnLogo';
import { AltinnAppHeader } from 'src/components/organisms/AltinnAppHeader';
import { fetchApplicationMetadata } from 'src/queries/queries';
import { renderWithInstanceAndLayout } from 'src/test/renderWithProviders';
import { PartyType } from 'src/types/shared';
import type { ApplicationMetadata } from 'src/features/applicationMetadata/types';
import type { IRawTextResource } from 'src/features/language/textResources';
import type { IAppLanguage, IParty } from 'src/types/shared';

describe('organisms/AltinnAppHeader', () => {
  const partyPerson = {
    name: 'Test Testesen',
    ssn: '01010000000',
    partyId: 12345,
    partyTypeName: PartyType.Person,
  } as IParty;

  const partyOrg = {
    orgNumber: '12345678',
    partyId: 54321,
    name: 'Bedrift',
    partyTypeName: PartyType.Organisation,
  } as IParty;

  const headerBackgroundColor = 'blue';

  interface IRenderComponentProps {
    party: IParty;
    user?: IParty;
    logo?: ApplicationMetadata['logoOptions'];
    showLanguageSelector?: boolean;
    languageResponse?: IAppLanguage[];
    textResources?: IRawTextResource[];
  }
  const render = async ({
    party,
    user = partyPerson,
    logo,
    showLanguageSelector = false,
    languageResponse,
    textResources = [],
  }: IRenderComponentProps) => {
    jest.mocked(fetchApplicationMetadata).mockImplementation(async () => getIncomingApplicationMetadataMock({ logo }));

    return await renderWithInstanceAndLayout({
      renderer: () => (
        <AltinnAppHeader
          party={party}
          userParty={user}
          logoColor={LogoColor.blueDarker}
          headerBackgroundColor={headerBackgroundColor}
        />
      ),

      queries: {
        fetchAppLanguages: () =>
          languageResponse ? Promise.resolve(languageResponse) : Promise.reject(new Error('No languages mocked')),
        fetchTextResources: () => Promise.resolve({ language: 'nb', resources: textResources }),
        fetchLayoutSettings: () => Promise.resolve({ pages: { showLanguageSelector, order: ['1', '2', '3'] } }),
      },
    });
  };

  it('should render menu with logout option when clicking profile icon', async () => {
    await render({ party: partyOrg });
    expect(
      screen.queryByRole('menuitem', {
        name: /logg ut/i,
        hidden: true,
      }),
    ).toBeNull();

    await act(() =>
      userEvent.click(
        screen.getByRole('button', {
          name: /Profil ikon knapp/i,
        }),
      ),
    );
    expect(
      screen.getByRole('menuitem', {
        name: /logg ut/i,
        hidden: true,
      }),
    ).toBeInTheDocument();
  });

  it('Should render Altinn logo if logo options are not set', async () => {
    await render({ party: partyPerson });
    const mockLogo = getLogoMock().replace('black', LogoColor.blueDarker);
    expect(screen.getByRole('img')).toHaveAttribute('src', `data:image/svg+xml;utf8,${encodeURIComponent(mockLogo)}`);
  });

  it('Should render Organisation logo if logo options are set', async () => {
    await render({
      party: partyPerson,
      logo: { source: 'org', displayAppOwnerNameInHeader: false },
    });
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://altinncdn.no/orgs/mockOrg/mockOrg.png');
  });

  it('should render and change app language', async () => {
    await render({
      party: partyPerson,
      showLanguageSelector: true,
      languageResponse: [{ language: 'en' }, { language: 'nb' }],
    });

    await userEvent.click(screen.getByRole('button', { name: /Språkvalg/i }));
    const en = screen.getByRole('menuitemradio', { name: /engelsk/i });
    await userEvent.click(en);

    // Language now changed, so the value should be the language name in the selected language
    await userEvent.click(screen.getByRole('button', { name: /Language/i }));
    expect(screen.getByRole('menuitemradio', { name: /english/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('should render app language with custom labels', async () => {
    await render({
      party: partyPerson,
      showLanguageSelector: true,
      textResources: [
        { id: 'language.language_selection', value: 'Språkvalg test' },
        { id: 'language.full_name.nb', value: 'Norsk test' },
        { id: 'language.full_name.en', value: 'Engelsk test' },
      ],
      languageResponse: [{ language: 'en' }, { language: 'nb' }],
    });

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Språkvalg test/i }));
    screen.getByRole('menuitemradio', { name: /norsk test/i });
    screen.getByRole('menuitemradio', { name: /engelsk test/i });
  });
});
