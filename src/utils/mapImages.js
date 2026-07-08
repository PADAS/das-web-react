// Builds the map-image cache key for an event's icon. Must match the suffix order
// used by the Mapbox icon-image expressions (icon_id-priority-width-height).
export const calcSvgImageIconId = ({ icon_id, priority, width, height }) => {
  const variantSuffixParts = [priority, width, height].filter((value) => value === 0 || Boolean(value));
  return [icon_id, ...variantSuffixParts].join('-');
};
