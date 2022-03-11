import differenceInMinutes from 'date-fns/difference_in_minutes';

const GEO_PERMISSION_KEY_SUBSTRING = 'geographic_distance';
const WARNING_SPLASH_TOAST_TIME_THRESHOLD = 30; // thirty minutes
export const WARNING_HEADER_TOAST_TIME_THRESHOLD = 2; // two minutes
export const ACCESS_DENIED_NO_LOCATION_TOAST_THRESHOLD = 2; // two minutes

export const userIsGeoPermissionRestricted = user =>
  Object.keys(user?.permissions ?? {})
    .some(item =>
      item.includes(GEO_PERMISSION_KEY_SUBSTRING)
    );

export const geoPermWarningSplashToastIsDueToBeShown = (timestamp) => {
  if (!timestamp) return true;
  if (differenceInMinutes(new Date(), new Date(timestamp)) > WARNING_SPLASH_TOAST_TIME_THRESHOLD) return true;
  return false;
};