

const GEO_PERMISSION_KEY_SUBSTRING = 'geographic_distance';

export const userIsGeoPermissionRestricted = () => true; // for QA, remove before release

// export const userIsGeoPermissionRestricted = user =>
//   Object.keys(user?.permissions ?? {})
//     .some(item =>
//       item.includes(GEO_PERMISSION_KEY_SUBSTRING)
//     );