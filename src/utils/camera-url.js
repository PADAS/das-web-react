export const LNGLAT_PARAM = 'lnglat';
export const ZOOM_PARAM = 'zoom';

const LNGLAT_DECIMALS = 6;
const ZOOM_DECIMALS = 2;
const MAX_ZOOM = 24;

const parseNumber = (value) => {
  if (value === null || value.trim() === '') return null;

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

// toFixed keeps a sign on a rounded-away negative, so "-0.000000" reads as 0.
const formatNumber = (value, decimals) => (Object.is(Number(value.toFixed(decimals)), -0)
  ? (0).toFixed(decimals)
  : value.toFixed(decimals));

/* The camera in a URL search, or null without a valid `lnglat`. `zoom` is null
   when absent or invalid, as record links carry a centre alone. */
export const parseCameraSearch = (search) => {
  const params = new URLSearchParams(search);
  const lngLat = params.get(LNGLAT_PARAM);
  if (lngLat === null) return null;

  const parts = lngLat.replace(/\s/g, '').split(',');
  if (parts.length !== 2) return null;

  const [lng, lat] = parts.map(parseNumber);
  if (lng === null || lat === null || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;

  const zoom = parseNumber(params.get(ZOOM_PARAM));

  return { center: [lng, lat], zoom: zoom !== null && zoom >= 0 && zoom <= MAX_ZOOM ? zoom : null };
};

/* The search with the camera in `lnglat` and `zoom`, other params kept in
   place. The comma is written as is, not percent-encoded, so the URL stays
   readable. */
export const formatCameraSearch = (search, { center: [lng, lat], zoom }) => {
  const params = new URLSearchParams(search);
  params.delete(LNGLAT_PARAM);
  params.delete(ZOOM_PARAM);

  const otherParams = params.toString();
  const cameraParams = `${LNGLAT_PARAM}=${formatNumber(lng, LNGLAT_DECIMALS)},${formatNumber(lat, LNGLAT_DECIMALS)}`
    + `&${ZOOM_PARAM}=${formatNumber(zoom, ZOOM_DECIMALS)}`;

  return `?${otherParams ? `${otherParams}&` : ''}${cameraParams}`;
};
