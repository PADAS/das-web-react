
import { DEVELOPMENT_FEATURE_FLAGS } from '../constants';
const GEO_PERMISSION_KEY_SUBSTRING = '_geographic_distance';

const { ENABLE_GEOPERMISSION_UI } = DEVELOPMENT_FEATURE_FLAGS;

export const userIsGeoPermissionRestricted = user =>
  ENABLE_GEOPERMISSION_UI
  && Object.keys(user?.permissions ?? {})
    .some(item =>
      item.includes(GEO_PERMISSION_KEY_SUBSTRING)
    );
