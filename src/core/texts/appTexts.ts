import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { useOrgs } from 'src/features/orgs/OrgsProvider';
import { useLanguage } from 'src/hooks/useLanguage';

function useTextResourceOr<T extends string | undefined>(resource: string, fallback: T): string | T {
  const { langAsString } = useLanguage();

  const fromResources = langAsString(resource);
  if (fromResources !== resource) {
    return fromResources;
  }

  return fallback;
}

export function useAppName() {
  const application = useApplicationMetadata();
  const langTools = useLanguage();

  const appName = useTextResourceOr('appName', undefined);
  const oldAppName = useTextResourceOr('ServiceName', undefined);
  const appNameFromMetadata = application.title[langTools.selectedLanguage] || application.title.nb;

  return appName || oldAppName || appNameFromMetadata;
}

export function useAppOwner() {
  const application = useApplicationMetadata();
  const fromMetaData = useOrgName(application.org);
  return useTextResourceOr('appOwner', fromMetaData);
}

export function useAppReceiver() {
  const application = useApplicationMetadata();
  const fromMetaData = useOrgName(application.org);
  return useTextResourceOr('appReceiver', fromMetaData);
}

export function useAppLogoAltText() {
  const application = useApplicationMetadata();
  const fromMetaData = useOrgName(application.org);
  return useTextResourceOr('appLogo.altText', fromMetaData);
}

function useOrgName(org: string | undefined) {
  const orgs = useOrgs();
  const langTools = useLanguage();

  if (orgs && typeof org === 'string' && orgs[org]) {
    return orgs[org].name[langTools.selectedLanguage] || orgs[org].name.nb;
  }

  return undefined;
}
