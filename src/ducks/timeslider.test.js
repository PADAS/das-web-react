import timeSliderReducer, { clearVirtualDate, setTimeSliderState, setVirtualDate } from './timeslider';

describe('ducks - timeslider', () => {
  const RANGE_END_DATE = '2026-08-20T00:00:00.000Z';
  const VIRTUAL_DATE = '2026-08-10T00:00:00.000Z';

  const activeState = () => timeSliderReducer(undefined, setTimeSliderState(true));

  test('starts with the slider closed and no history requested', () => {
    const state = timeSliderReducer(undefined, { type: 'UNKNOWN' });

    expect(state).toEqual({ active: false, hasScrubbedIntoPast: false, virtualDate: null });
  });

  test('does not request history when the slider is opened', () => {
    expect(activeState()).toEqual({ active: true, hasScrubbedIntoPast: false, virtualDate: null });
  });

  test('records that history was requested when a virtual date is set', () => {
    const state = timeSliderReducer(activeState(), setVirtualDate(VIRTUAL_DATE));

    expect(state).toEqual({ active: true, hasScrubbedIntoPast: true, virtualDate: VIRTUAL_DATE });
  });

  test('does not request history when the range ends at a date and the handle rests there', () => {
    const state = timeSliderReducer(
      activeState(),
      setVirtualDate(RANGE_END_DATE, { isAtRangeEnd: true }),
    );

    expect(state).toEqual({ active: true, hasScrubbedIntoPast: false, virtualDate: RANGE_END_DATE });
  });

  test('keeps history requested when the handle returns to a range that ends at a date', () => {
    const scrubbed = timeSliderReducer(activeState(), setVirtualDate(VIRTUAL_DATE));

    const state = timeSliderReducer(scrubbed, setVirtualDate(RANGE_END_DATE, { isAtRangeEnd: true }));

    expect(state).toEqual({ active: true, hasScrubbedIntoPast: true, virtualDate: RANGE_END_DATE });
  });

  test('keeps history requested when the handle returns to the end of the range', () => {
    const scrubbed = timeSliderReducer(activeState(), setVirtualDate(VIRTUAL_DATE));

    const state = timeSliderReducer(scrubbed, clearVirtualDate());

    expect(state).toEqual({ active: true, hasScrubbedIntoPast: true, virtualDate: null });
  });

  test('forgets that history was requested when the slider is closed', () => {
    const scrubbed = timeSliderReducer(activeState(), setVirtualDate(VIRTUAL_DATE));

    const state = timeSliderReducer(scrubbed, setTimeSliderState(false));

    expect(state).toEqual({ active: false, hasScrubbedIntoPast: false, virtualDate: null });
  });
});
