import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { mockStore } from '../../__test-helpers/MockStore';
import { SIGHTING_SCHEMA, SIGHTING_TYPE, V1_TYPE } from './testSchema';

import describeEventTypeTool from './';

jest.mock('../../ducks/event-schemas', () => ({
  ...jest.requireActual('../../ducks/event-schemas'),
  fetchEventTypeSchema: jest.fn(),
}));

describe('hostActions - describeEventTypeTool', () => {
  let state;
  beforeEach(() => {
    fetchEventTypeSchema.mockImplementation(() => () => {
      state = { data: { ...state.data, eventSchemas: { [SIGHTING_TYPE.value]: { base: SIGHTING_SCHEMA } } } };
    });
    state = { data: { eventSchemas: {}, eventTypes: [SIGHTING_TYPE, V1_TYPE] } };
  });

  const runTool = (args) => {
    const store = mockStore(() => state);

    return describeEventTypeTool.run(args, { dispatch: store.dispatch, getState: store.getState });
  };

  test('loads the form and lists its fields', async () => {
    const result = await runTool({ event_type_id: SIGHTING_TYPE.id });

    expect(fetchEventTypeSchema).toHaveBeenCalledWith(SIGHTING_TYPE.value);
    expect(result).toEqual({
      event_type_id: SIGHTING_TYPE.id,
      event_type_value: SIGHTING_TYPE.value,
      geometry_type: 'Point',
      sections: [{
        conditional: false,
        fields: [
          {
            label: 'Species',
            multiple: false,
            name: 'species',
            options: [{ label: 'Bear', value: 'bear' }, { label: 'Wolf', value: 'wolf' }],
            required: true,
            type: 'CHOICE_LIST',
          },
          { label: 'Count', name: 'count', required: false, type: 'NUMERIC' },
        ],
        label: 'Sighting',
      }],
      title: 'Wildlife sighting',
    });
  });

  test('refuses a v1 event type', async () => {
    await expect(runTool({ event_type_id: V1_TYPE.id })).rejects.toMatchObject({
      code: HOST_TOOL_ERROR_CODES.INVALID_ARGUMENTS,
    });
    expect(fetchEventTypeSchema).not.toHaveBeenCalled();
  });

  test('says so when the event type does not exist', async () => {
    await expect(runTool({ event_type_id: '00000000-0000-4000-8000-000000000000' })).rejects.toMatchObject({
      code: HOST_TOOL_ERROR_CODES.NOT_FOUND,
    });
  });
});
