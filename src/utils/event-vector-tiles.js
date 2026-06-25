export const TIME_SLIDER_DEFAULT_LABEL_COLOR = 'rgba(255, 255, 255, 0.7)';

const FADE_INTERPOLATION_CAP = 0.3;
const TIME_SLIDER_RECENT_LABEL_COLOR = 'rgba(255, 255, 126, 1)';

export const resolveEventTimeSliderParameters = (timeSliderState, eventFilterDateRange) => {
  const { active, virtualDate } = timeSliderState ?? {};
  if (!active) {
    return { active: false };
  }

  // Fall back to "now" when the slider is active but has no virtual date yet, matching the
  // flag-OFF `virtualDate || new Date()`, so the transient window shows the same events.
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

  // Guard the arithmetic against features missing event_time_ms (parity with the flag-OFF
  // `['case', ['has', 'distanceFromVirtualDate'], …]`); those keep the default tint.
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
