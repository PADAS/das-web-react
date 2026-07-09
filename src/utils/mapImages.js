// Literal head shared by every event icon id. It lets a `styleimagemissing`
// event be recognized as an event icon and reverse-parsed back into its parts,
// which a bare hyphen-joined key could not do because icon_ids can contain
// hyphens.
export const EVENT_ICON_ID_PREFIX = 'event-icon|';

// Builds the map-image cache key for an event's icon. Must match the format
// emitted by the Mapbox icon-image expressions: the `event-icon|` prefix
// followed by icon_id, priority, width, and height, pipe-separated, with absent
// parts omitted (e.g. "event-icon|fire|200|24|32").
// Invariant: callers must pass an `icon_id` (or guard before calling) — absent
// leading parts make the pipe-format non-reversible, and the GL icon-image
// expressions always emit the icon_id slot.
export const calcSvgImageIconId = ({ icon_id, priority, width, height }) => {
  const parts = [icon_id, priority, width, height].filter((value) => value === 0 || Boolean(value));
  return `${EVENT_ICON_ID_PREFIX}${parts.join('|')}`;
};
