import timeSliderReducer, { clearVirtualDate, setTimeSliderState, setVirtualDate } from './timeslider';

describe('ducks - timeslider', () => {
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
