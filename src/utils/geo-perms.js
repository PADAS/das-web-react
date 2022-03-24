
const GEO_PERMISSION_KEY_SUBSTRING = '_geographic_distance';

export const userIsGeoPermissionRestricted = user =>
  Object.keys(user?.permissions ?? {})
    .some(item =>
      item.includes(GEO_PERMISSION_KEY_SUBSTRING)
    );
