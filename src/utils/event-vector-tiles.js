export const TIME_SLIDER_DEFAULT_LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';

const FADE_INTERPOLATION_CAP = 0.3;
const TIME_SLIDER_RECENT_LABEL_COLOR = 'rgba(255, 255, 126, 1)';

export const buildEventTypeValueMap = (eventTypes) => {
  const lookup = new Map();
  (eventTypes || []).forEach((eventType) => {
    if (eventType?.value) {
      lookup.set(eventType.value, eventType);
    }
  });
  return lookup;
};

export const normalizeTileEventFeature = (feature, eventTypeValueMap) => {
  const properties = feature?.properties ?? {};
  const eventType = eventTypeValueMap?.get?.(properties.event_type_value);
  const iconId = eventType?.icon_id || 'generic';
  const baseTitle = (properties.title || eventType?.display) ?? '';
  const displayTitle = [baseTitle, properties.event_time_display].filter(Boolean).join('\n');

  return {
    type: 'Feature',
    geometry: feature?.geometry,
    properties: {
      ...properties,
      icon_id: iconId,
      display_title: displayTitle,
      event_type: properties.event_type_value,
      updated_at: properties.updated_at_iso,
    },
  };
};

export const isFeatureVisibleAtVirtualDate = (feature, { active, virtualDateIso } = {}) => {
  if (!active || !virtualDateIso) {
    return true;
  }
  return (feature?.properties?.event_time_iso ?? '') <= virtualDateIso;
};

export const resolveEventTimeSliderParameters = (timeSliderState, eventFilterDateRange) => {
  const { active, virtualDate } = timeSliderState ?? {};
  if (!active) {
    return { active: false };
  }

  const resolvedVirtualDate = virtualDate ? new Date(virtualDate) : new Date();
  const { lower, upper } = eventFilterDateRange ?? {};

  return {
    active: true,
    totalRangeDistance: (upper ? new Date(upper) : new Date()) - new Date(lower),
    virtualDateIso: resolvedVirtualDate.toISOString(),
    virtualDateMs: resolvedVirtualDate.getTime(),
  };
};

export const buildEventTimeSliderHideFilter = (active, virtualDateIso) =>
  (active ? ['<=', ['coalesce', ['get', 'event_time_iso'], ''], virtualDateIso] : null);

export const buildEventTimeSliderFadeColor = (active, totalRangeDistance, virtualDateMs) => {
  if (!active || !totalRangeDistance) {
    return TIME_SLIDER_DEFAULT_LABEL_COLOR;
  }

  return [
    'case',
    ['has', 'event_time_ms'],
    [
      'interpolate',
      ['linear'],
      ['/', ['abs', ['-', virtualDateMs, ['get', 'event_time_ms']]], totalRangeDistance],
      0, TIME_SLIDER_RECENT_LABEL_COLOR,
      FADE_INTERPOLATION_CAP, TIME_SLIDER_DEFAULT_LABEL_COLOR,
    ],
    TIME_SLIDER_DEFAULT_LABEL_COLOR,
  ];
};
