import { useTranslation } from 'react-i18next';

import horizontalLogoUrl from '@allenai/design-system/er-legacy/assets/EarthRanger-Logo-2026_Ai2-H-short.svg?url';
import horizontalWhiteLogoUrl
  from '@allenai/design-system/er-legacy/assets/EarthRanger-Logo-2026_Ai2-white-H-short.svg?url';
import verticalLogoUrl from '@allenai/design-system/er-legacy/assets/EarthRanger-Logo-2026_Ai2.svg?url';

const LOGO_URLS_BY_TYPE = {
  horizontal: horizontalLogoUrl,
  horizontalWhite: horizontalWhiteLogoUrl,
  vertical: verticalLogoUrl,
};

const EarthRangerLogo = ({ type = 'horizontalWhite', ...otherProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'earthRangerLogo' });

  return <img alt={t('title')} src={LOGO_URLS_BY_TYPE[type]} {...otherProps} />;
};

export default EarthRangerLogo;
