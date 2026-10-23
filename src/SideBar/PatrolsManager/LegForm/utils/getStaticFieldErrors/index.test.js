import '../../../../../i18nForTests';

import buildLegDraft from '../../../utils/buildLegDraft';

import getStaticFieldErrors from './';

describe('SideBar - PatrolsManager - LegForm - utils - getStaticFieldErrors', () => {
  let leg;
  beforeEach(() => {
    leg = {
      ...buildLegDraft(),
      patrolType: { display: 'Foot Patrol', id: 'patrol-type-1', value: 'foot' },
      startDate: '2026-04-13',
      startTime: '08:00',
    };
  });

  test('does not report errors when the times are valid', () => {
    expect(getStaticFieldErrors(leg)).toEqual({});
  });

  test('reports a missing start date', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '--' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  test('reports a start date the calendar does not have', () => {
    expect(getStaticFieldErrors({ ...leg, startDate: '2026-02-31' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  test('reports a missing start time', () => {
    expect(getStaticFieldErrors({ ...leg, startTime: ':' })).toEqual({
      startTime: 'A leg needs a start time.',
    });
  });

  test('reports a half typed start time', () => {
    expect(getStaticFieldErrors({ ...leg, startTime: '08:' })).toEqual({
      startTime: 'A leg needs a start time.',
    });
  });

  test('reports an end date earlier than the start date', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-12', endTime: '08:00' })).toEqual({
      endDateTime: 'The end of the leg must be later than its start.',
    });
  });

  test('reports an end time earlier than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '07:00' })).toEqual({
      endDateTime: 'The end of the leg must be later than its start.',
    });
  });

  test('does not report an end time later than the start time on the same day', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '09:00' })).toEqual({});
  });

  test('reports an end that matches the start', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-13', endTime: '08:00' })).toEqual({
      endDateTime: 'The end of the leg must be later than its start.',
    });
  });

  describe('when the leg is being edited', () => {
    const buildEditedPatrolSegment = (startTime, endTime) => ({
      id: 'segment-1',
      time_range: { end_time: endTime.toISOString(), start_time: startTime.toISOString() },
    });

    test('does not report an end on the start minute when the stored times are seconds apart', () => {
      const editedPatrolSegment = buildEditedPatrolSegment(
        new Date(2026, 3, 13, 8, 0, 12),
        new Date(2026, 3, 13, 8, 0, 48)
      );

      expect(getStaticFieldErrors(
        { ...leg, endDate: '2026-04-13', endTime: '08:00' },
        { editedPatrolSegment }
      )).toEqual({});
    });

    test('reports an end moved onto the start minute that would be saved before the stored start', () => {
      const editedPatrolSegment = buildEditedPatrolSegment(
        new Date(2026, 3, 13, 8, 0, 30),
        new Date(2026, 3, 13, 9, 15)
      );

      expect(getStaticFieldErrors(
        { ...leg, endDate: '2026-04-13', endTime: '08:00' },
        { editedPatrolSegment }
      )).toEqual({
        endDateTime: 'The end of the leg must be later than its start.',
      });
    });

    test('reports an end that matches the start once both are moved off their stored minutes', () => {
      const editedPatrolSegment = buildEditedPatrolSegment(
        new Date(2026, 3, 13, 7, 0, 30),
        new Date(2026, 3, 13, 9, 15, 10)
      );

      expect(getStaticFieldErrors(
        { ...leg, endDate: '2026-04-13', endTime: '08:00' },
        { editedPatrolSegment }
      )).toEqual({
        endDateTime: 'The end of the leg must be later than its start.',
      });
    });
  });

  test('reports a missing end time when the leg has an end date', () => {
    expect(getStaticFieldErrors({ ...leg, endDate: '2026-04-20', endTime: ':' })).toEqual({
      endTime: 'A leg with an end date needs an end time.',
    });
  });

  test('does not report a missing end time when the leg has no end date', () => {
    expect(getStaticFieldErrors({ ...leg, endTime: ':' })).toEqual({});
  });

  test('reports a missing patrol type', () => {
    expect(getStaticFieldErrors({ ...leg, patrolType: null })).toEqual({
      patrolType: 'A leg needs a patrol type.',
    });
  });

  test('reports the erroneous times of the leg before its missing patrol type', () => {
    expect(getStaticFieldErrors({ ...leg, patrolType: null, startDate: '--' })).toEqual({
      startDate: 'A leg needs a start date.',
    });
  });

  describe('when the leg follows another one', () => {
    test('reports a start date earlier than the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, { earliestStartDateTime: new Date(2026, 3, 14, 8, 0) })).toEqual({
        startDateTime: 'This leg cannot overlap the previous one.',
      });
    });

    test('reports a start time earlier than the earliest start of the leg on the same day', () => {
      expect(getStaticFieldErrors(leg, { earliestStartDateTime: new Date(2026, 3, 13, 9, 0) })).toEqual({
        startDateTime: 'This leg cannot overlap the previous one.',
      });
    });

    test('reports a start that falls short of the earliest start of the leg by seconds', () => {
      expect(getStaticFieldErrors(leg, { earliestStartDateTime: new Date(2026, 3, 13, 8, 0, 32) })).toEqual({
        startDateTime: 'This leg cannot overlap the previous one.',
      });
    });

    test('does not report a start that meets the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, { earliestStartDateTime: new Date(2026, 3, 13, 8, 0) })).toEqual({});
    });

    test('reports a start that matches the start of the previous leg', () => {
      const previousLegStartDateTime = new Date(2026, 3, 13, 8, 0);

      expect(getStaticFieldErrors(leg, { earliestStartDateTime: previousLegStartDateTime, previousLegStartDateTime }))
        .toEqual({ startDateTime: 'This leg cannot start at the same time as the previous one.' });
    });

    test('does not report a start whose stored seconds keep it after the start of the previous leg', () => {
      const previousLegStartDateTime = new Date(2026, 3, 13, 8, 0);
      const editedPatrolSegment = {
        id: 'segment-1',
        time_range: { end_time: null, start_time: new Date(2026, 3, 13, 8, 0, 30).toISOString() },
      };

      expect(getStaticFieldErrors(leg, {
        earliestStartDateTime: previousLegStartDateTime,
        editedPatrolSegment,
        previousLegStartDateTime,
      })).toEqual({});
    });

    test('does not report a start a minute after the start of the previous leg', () => {
      const previousLegStartDateTime = new Date(2026, 3, 13, 7, 59);

      expect(getStaticFieldErrors(leg, { earliestStartDateTime: previousLegStartDateTime, previousLegStartDateTime }))
        .toEqual({});
    });

    test('reports an overlap with the previous leg before comparing the start with its start', () => {
      expect(getStaticFieldErrors(leg, {
        earliestStartDateTime: new Date(2026, 3, 13, 9, 0),
        previousLegStartDateTime: new Date(2026, 3, 13, 8, 0),
      })).toEqual({ startDateTime: 'This leg cannot overlap the previous one.' });
    });

    test('does not report a start later than the earliest start of the leg', () => {
      expect(getStaticFieldErrors(leg, { earliestStartDateTime: new Date(2026, 3, 12, 8, 0) })).toEqual({});
    });

    test('reports the missing start date before comparing it with the previous leg', () => {
      const earliestStartDateTime = new Date(2026, 3, 14, 8, 0);

      expect(getStaticFieldErrors({ ...leg, startDate: '--' }, { earliestStartDateTime })).toEqual({
        startDate: 'A leg needs a start date.',
      });
    });

    test('reports the missing start time before comparing it with the previous leg', () => {
      const earliestStartDateTime = new Date(2026, 3, 14, 8, 0);

      expect(getStaticFieldErrors({ ...leg, startTime: ':' }, { earliestStartDateTime })).toEqual({
        startTime: 'A leg needs a start time.',
      });
    });
  });

  describe('when another leg follows the leg', () => {
    test('reports a missing end date for a leg that had one', () => {
      const editedPatrolSegment = {
        scheduled_end: null,
        time_range: { end_time: new Date(2026, 3, 13, 17, 0).toISOString(), start_time: null },
      };
      const nextLegStartDateTime = new Date(2026, 3, 13, 18, 0);

      expect(getStaticFieldErrors(leg, {
        editedPatrolSegment,
        latestEndDateTime: nextLegStartDateTime,
        nextLegStartDateTime,
      })).toEqual({ endDateTime: 'A leg followed by another one needs an end date.' });
    });

    test('does not report a missing end date for a leg stored without one', () => {
      const editedPatrolSegment = { scheduled_end: null, time_range: { end_time: null, start_time: null } };
      const nextLegStartDateTime = new Date(2026, 3, 13, 18, 0);

      expect(getStaticFieldErrors(leg, {
        editedPatrolSegment,
        latestEndDateTime: nextLegStartDateTime,
        nextLegStartDateTime,
      })).toEqual({});
    });

    test('reports a start that matches the start of the next leg', () => {
      const nextLegStartDateTime = new Date(2026, 3, 13, 8, 0);

      expect(getStaticFieldErrors(leg, { latestEndDateTime: nextLegStartDateTime, nextLegStartDateTime }))
        .toEqual({ startDateTime: 'This leg cannot start at the same time as the next one.' });
    });

    test('does not report a start a minute before the start of the next leg', () => {
      const nextLegStartDateTime = new Date(2026, 3, 13, 8, 1);

      expect(getStaticFieldErrors(
        { ...leg, endDate: '2026-04-13', endTime: '08:01' },
        { latestEndDateTime: nextLegStartDateTime, nextLegStartDateTime }
      )).toEqual({});
    });

    test('does not report a start whose stored seconds keep it ahead of the next leg', () => {
      const nextLegStartDateTime = new Date(2026, 3, 13, 8, 0);
      const editedPatrolSegment = {
        id: 'segment-1',
        time_range: {
          end_time: new Date(2026, 3, 13, 8, 0).toISOString(),
          start_time: new Date(2026, 3, 13, 7, 59, 40).toISOString(),
        },
      };

      expect(getStaticFieldErrors(
        { ...leg, endDate: '2026-04-13', endTime: '08:00', startTime: '07:59' },
        { editedPatrolSegment, latestEndDateTime: nextLegStartDateTime, nextLegStartDateTime }
      )).toEqual({});
    });

    test('reports a start date later than the latest end of the leg', () => {
      expect(getStaticFieldErrors(leg, { latestEndDateTime: new Date(2026, 3, 12, 8, 0) })).toEqual({
        startDateTime: 'This leg cannot overlap the next one.',
      });
    });

    test('reports a start time later than the latest end of the leg on the same day', () => {
      expect(getStaticFieldErrors(leg, { latestEndDateTime: new Date(2026, 3, 13, 7, 0) })).toEqual({
        startDateTime: 'This leg cannot overlap the next one.',
      });
    });

    test('does not report a start that meets the latest end of the leg', () => {
      expect(getStaticFieldErrors(leg, { latestEndDateTime: new Date(2026, 3, 13, 8, 0) })).toEqual({});
    });

    test('reports an end date later than the latest end of the leg', () => {
      const legWithEnd = { ...leg, endDate: '2026-04-20', endTime: '08:00' };

      expect(getStaticFieldErrors(legWithEnd, { latestEndDateTime: new Date(2026, 3, 14, 8, 0) })).toEqual({
        endDateTime: 'This leg cannot overlap the next one.',
      });
    });

    test('does not report an end that meets the latest end of the leg', () => {
      const legWithEnd = { ...leg, endDate: '2026-04-14', endTime: '08:00' };

      expect(getStaticFieldErrors(legWithEnd, { latestEndDateTime: new Date(2026, 3, 14, 8, 0) })).toEqual({});
    });

    test('reports the erroneous start of the leg before its end', () => {
      const legWithEnd = { ...leg, endDate: '2026-04-20', endTime: '08:00' };

      expect(getStaticFieldErrors(legWithEnd, { latestEndDateTime: new Date(2026, 3, 12, 8, 0) })).toEqual({
        startDateTime: 'This leg cannot overlap the next one.',
      });
    });
  });
});
