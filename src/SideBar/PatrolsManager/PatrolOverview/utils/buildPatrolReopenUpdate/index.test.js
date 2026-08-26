import buildPatrolReopenUpdate from './';

describe('SideBar - PatrolsManager - PatrolOverview - utils - buildPatrolReopenUpdate', () => {
  const firstLeg = {
    id: 'leg-1',
    time_range: { start_time: '2026-04-13T08:00:00.000Z', end_time: '2026-04-13T09:00:00.000Z' },
  };
  const lastLeg = {
    id: 'leg-2',
    time_range: { start_time: '2026-04-13T10:00:00.000Z', end_time: '2026-04-13T11:00:00.000Z' },
  };
  const patrol = { state: 'done', patrol_segments: [firstLeg, lastLeg] };

  test('opens the patrol back up and clears the last leg end time', () => {
    expect(buildPatrolReopenUpdate(patrol)).toEqual({
      state: 'open',
      patrol_segments: [firstLeg, { id: 'leg-2', time_range: { start_time: lastLeg.time_range.start_time, end_time: null } }],
    });
  });

  test('leaves the last leg start time alone, so the patrol lands wherever its own times put it', () => {
    expect(buildPatrolReopenUpdate({
      state: 'cancelled',
      patrol_segments: [{ scheduled_start: '2026-04-13T10:00:00.000Z', time_range: { start_time: null, end_time: null } }],
    }).patrol_segments.at(-1).time_range.start_time).toBeNull();
  });
});
