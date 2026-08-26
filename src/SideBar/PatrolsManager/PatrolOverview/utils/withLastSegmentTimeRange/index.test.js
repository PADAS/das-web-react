import withLastSegmentTimeRange from './';

describe('SideBar - PatrolsManager - PatrolOverview - utils - withLastSegmentTimeRange', () => {
  const firstLeg = {
    id: 'leg-1',
    time_range: { start_time: '2026-04-13T08:00:00.000Z', end_time: '2026-04-13T09:00:00.000Z' },
  };
  const lastLeg = { id: 'leg-2', time_range: { start_time: '2026-04-13T10:00:00.000Z', end_time: null } };
  const patrol = { patrol_segments: [firstLeg, lastLeg] };

  test('merges the given times into the last leg time range', () => {
    expect(withLastSegmentTimeRange(patrol, { end_time: '2026-04-13T12:00:00.000Z' }).at(-1)).toEqual({
      id: 'leg-2',
      time_range: { start_time: '2026-04-13T10:00:00.000Z', end_time: '2026-04-13T12:00:00.000Z' },
    });
  });

  test('hands back the legs it does not touch', () => {
    expect(withLastSegmentTimeRange(patrol, { end_time: null })[0]).toBe(firstLeg);
  });

  test('does not mutate the patrol', () => {
    withLastSegmentTimeRange(patrol, { end_time: '2026-04-13T12:00:00.000Z' });

    expect(lastLeg.time_range.end_time).toBeNull();
  });

  test('has no leg to change in a patrol without legs', () => {
    expect(withLastSegmentTimeRange({ patrol_segments: [] }, { end_time: null })).toEqual([]);
  });
});
