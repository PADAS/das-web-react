import { HOST_TOOL_ERROR_CODES } from './HostToolError';
import setDateRangeTool from './setDateRangeTool';

import runHostTool, { HOST_TOOL_SPECS } from './';

jest.mock('./setDateRangeTool', () => ({
  __esModule: true,
  default: { ...jest.requireActual('./setDateRangeTool').default, run: jest.fn() },
}));

describe('SideBar - OtusTab - hostTools', () => {
  let context;
  beforeEach(() => {
    context = { dispatch: jest.fn(), getState: jest.fn(), jumpToLocation: jest.fn(), map: {} };
    setDateRangeTool.run.mockResolvedValue({ date_range: { lower: '2026-10-01T00:00:00.000Z', upper: null } });
  });

  describe('HOST_TOOL_SPECS', () => {
    test('describes every tool by name, description and input schema only', () => {
      expect(HOST_TOOL_SPECS.map((hostToolSpec) => hostToolSpec.name)).toEqual([
        'pin_subject_tracks',
        'set_date_range',
        'set_event_filter',
        'set_map_layer_visibility',
        'set_patrol_filter',
        'show_event',
        'show_patrol',
      ]);
      HOST_TOOL_SPECS.forEach((hostToolSpec) => {
        expect(Object.keys(hostToolSpec)).toEqual(['description', 'inputSchema', 'name']);
      });
    });
  });

  describe('runHostTool', () => {
    test('runs the named tool with its arguments and context and resolves with its result', async () => {
      const args = { lower: '2026-10-01T00:00:00.000Z' };

      await expect(runHostTool('set_date_range', args, context))
        .resolves.toEqual({ date_range: { lower: '2026-10-01T00:00:00.000Z', upper: null } });
      expect(setDateRangeTool.run).toHaveBeenCalledWith(args, context);
    });

    test('rejects an unknown tool, including names inherited from Object', async () => {
      await expect(runHostTool('delete_event', {}, context))
        .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.UNKNOWN_TOOL });
      await expect(runHostTool('constructor', {}, context))
        .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.UNKNOWN_TOOL });
    });

    test('rejects arguments its schema does not allow, without running the tool', async () => {
      await expect(runHostTool('set_date_range', { lower: 'last tuesday' }, context))
        .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS });
      await expect(runHostTool('set_date_range', { lower: null, title: 'x' }, context))
        .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS });
      await expect(runHostTool('show_event', { event_id: 'not-a-uuid' }, context))
        .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS });
      expect(setDateRangeTool.run).not.toHaveBeenCalled();
    });
  });
});
