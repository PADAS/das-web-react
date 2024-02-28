const GEO_PERMISSION_KEY_SUBSTRINGS = ['_geographic_distance', '_gd'];

export const userIsGeoPermissionRestricted = user =>
  Object.keys(user?.permissions ?? {})
    .some(item =>
      GEO_PERMISSION_KEY_SUBSTRINGS.some(substring =>
        item.includes(substring)
      )
    );
