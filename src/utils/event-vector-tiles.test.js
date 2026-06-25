import {
  buildEventTimeSliderFadeColor,
  buildEventTimeSliderHideFilter,
  resolveEventTimeSliderParameters,
  TIME_SLIDER_DEFAULT_LABEL_COLOR,
} from './event-vector-tiles';

describe('utils - Event vector tiles', () => {
  describe('resolveEventTimeSliderParameters', () => {
    const dateRange = { lower: '2026-06-01T00:00:00.000Z', upper: '2026-06-25T00:00:00.000Z' };

    test('returns inactive when the slider is off', () => {
      expect(resolveEventTimeSliderParameters({ active: false, virtualDate: null }, dateRange))
        .toEqual({ active: false });
    });

    test('falls back to now when active without a virtual date (parity with the flag-OFF path)', () => {
      const parameters = resolveEventTimeSliderParameters({ active: true, virtualDate: null }, dateRange);

      expect(parameters.active).toBe(true);
      expect(typeof parameters.virtualDateMs).toBe('number');
      expect(typeof parameters.virtualDateIso).toBe('string');
    });

    test('returns the normalized iso/ms and the filter-range length when active', () => {
      const parameters = resolveEventTimeSliderParameters(
        { active: true, virtualDate: '2026-06-20T00:00:00.000Z' },
        dateRange
      );

      expect(parameters).toEqual({
        active: true,
        virtualDateIso: '2026-06-20T00:00:00.000Z',
        virtualDateMs: new Date('2026-06-20T00:00:00.000Z').getTime(),
        totalRangeDistance: new Date(dateRange.upper) - new Date(dateRange.lower),
      });
    });
  });

  describe('buildEventTimeSliderHideFilter', () => {
    test('returns null when inactive', () => {
      expect(buildEventTimeSliderHideFilter(false)).toBeNull();
    });

    test('keeps events at or before the virtual date when active', () => {
      expect(buildEventTimeSliderHideFilter(true, '2026-06-20T00:00:00.000Z')).toEqual(
        ['<=', ['coalesce', ['get', 'event_time_iso'], ''], '2026-06-20T00:00:00.000Z']
      );
    });
  });

  describe('buildEventTimeSliderFadeColor', () => {
    test('returns the default label color when inactive', () => {
      expect(buildEventTimeSliderFadeColor(false)).toBe(TIME_SLIDER_DEFAULT_LABEL_COLOR);
    });

    test('returns the default label color when the range length is zero', () => {
      expect(buildEventTimeSliderFadeColor(true, 0, 1000))
        .toBe(TIME_SLIDER_DEFAULT_LABEL_COLOR);
    });

    test('interpolates on the event age when active, guarding features without event_time_ms', () => {
      expect(buildEventTimeSliderFadeColor(true, 10000, 5000)).toEqual([
        'case',
        ['has', 'event_time_ms'],
        [
          'interpolate',
          ['linear'],
          ['/', ['abs', ['-', 5000, ['get', 'event_time_ms']]], 10000],
          0, 'rgba(255, 255, 126, 1)',
          0.3, TIME_SLIDER_DEFAULT_LABEL_COLOR,
        ],
        TIME_SLIDER_DEFAULT_LABEL_COLOR,
      ]);
    });
  });
});
