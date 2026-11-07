import { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { mockStore } from '../../__test-helpers/MockStore';
import { SIGHTING_SCHEMA, SIGHTING_TYPE } from '../describeEventTypeTool/testSchema';

import draftNewEventTool from './';

describe('hostActions - draftNewEventTool', () => {
  let navigate, state;
  beforeEach(() => {
    navigate = jest.fn();
    state = {
      data: {
        eventCategories: { monitoring: { display: 'Monitoring', value: 'monitoring' } },
        eventSchemas: { [SIGHTING_TYPE.value]: { base: SIGHTING_SCHEMA } },
        eventTypes: [{ ...SIGHTING_TYPE, category: 'monitoring' }],
      },
    };
  });

  const runTool = (args) => {
    const store = mockStore(() => state);

    return draftNewEventTool.run(args, { dispatch: store.dispatch, getState: store.getState, navigate });
  };

  test('opens the new-event form with the values and the Atlas marker', async () => {
    const result = await runTool({
      event_details: { count: 2, species: 'bear' },
      event_type_id: SIGHTING_TYPE.id,
      location: { latitude: 48.71, longitude: -121.12 },
    });

    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/events/new', search: `?reportType=${SIGHTING_TYPE.id}` },
      {
        state: {
          reportData: {
            draftedBy: 'atlas',
            eventDetails: { count: 2, species: 'bear' },
            location: { latitude: 48.71, longitude: -121.12 },
          },
          temporalId: expect.any(String),
        },
      }
    );
    expect(result).toEqual({
      event_type_value: SIGHTING_TYPE.value,
      filled_fields: ['count', 'species'],
      location_used: true,
      saved: false,
    });
  });

  test('refuses values the form would reject, and opens nothing', async () => {
    await expect(runTool({ event_details: { count: 0, species: 'moose' }, event_type_id: SIGHTING_TYPE.id }))
      .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS, message: expect.stringContaining('count') });
    expect(navigate).not.toHaveBeenCalled();
  });

  test('refuses an event type the user cannot create', async () => {
    state.data.eventCategories.monitoring = { flag: 'user', permissions: ['read'], value: 'monitoring' };

    await expect(runTool({ event_type_id: SIGHTING_TYPE.id })).rejects.toMatchObject({
      code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS,
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  test('leaves a missing required field for the person to fill', async () => {
    await runTool({ event_details: { count: 3 }, event_type_id: SIGHTING_TYPE.id });

    expect(navigate).toHaveBeenCalled();
  });
});
