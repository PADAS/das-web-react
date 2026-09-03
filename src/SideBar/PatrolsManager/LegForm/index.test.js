import React, { useState } from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import buildLegDraft from './utils/buildLegDraft';
import { CLEAR } from '../../../ducks/user-content';
import { createMapMock } from '../../../__test-helpers/mocks';
import {
  DEFAULT_PATROL_SEGMENT_TYPE,
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
} from '../../../ducks/patrol-schemas';
import { defaultPatrolSegmentTypeSchema, patrolTypeFieldsSchema } from '../../../__test-helpers/fixtures/patrol-schemas';
import { GPS_FORMATS } from '../../../utils/location';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes, { dogPatrol, routinePatrol } from '../../../__test-helpers/fixtures/patrol-types';
import { render, screen, within } from '../../../test-utils';
import { TrackerContext } from '../../../utils/analytics';

import LegForm from './';

jest.mock('../../../ducks/patrol-schemas', () => ({
  ...jest.requireActual('../../../ducks/patrol-schemas'),
  fetchDefaultPatrolSegmentTypeSchema: jest.fn(),
  fetchPatrolTypeSchema: jest.fn(),
}));

const EMPTY_PATROL_TYPE_SCHEMA = {
  json: { $schema: 'https://json-schema.org/draft/2020-12/schema', properties: {}, required: [], type: 'object' },
  ui: { fields: {}, headers: {}, order: [], sections: {} },
};

const withRequiredField = (schema, fieldName) => ({
  ...schema,
  json: { ...schema.json, required: [fieldName] },
});

describe('SideBar - PatrolsManager - LegForm', () => {
  const onSubmit = jest.fn();

  let map, reduxStore, store;
  beforeEach(() => {
    fetchDefaultPatrolSegmentTypeSchema.mockImplementation(() => () => {});
    fetchPatrolTypeSchema.mockImplementation(() => () => {});

    map = createMapMock();

    store = {
      data: {
        patrolSchemas: {
          [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: defaultPatrolSegmentTypeSchema },
          [dogPatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
          [routinePatrol.value]: { isLoading: false, schema: patrolTypeFieldsSchema },
        },
        patrolTeamAndTrackingOptions: { assets: [], leaders: [], teamMembers: [], teams: [] },
        patrolTypes,
        userContent: {},
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        mapLocationSelection: { isPickingLocation: false },
        modals: { canShowModals: true },
        showUserLocation: false,
        userLocation: null,
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const ControlledLegForm = ({ earliestStartDateTime, initialLeg }) => {
    const [leg, setLeg] = useState(initialLeg);

    return <LegForm
      earliestStartDateTime={earliestStartDateTime}
      formId="legForm"
      leg={leg}
      onChangeLeg={(legChanges) => setLeg((prevLeg) => ({ ...prevLeg, ...legChanges }))}
      onSubmit={onSubmit}
    />;
  };

  const renderLegForm = ({ earliestStartDateTime, leg } = {}) => {
    reduxStore = mockStore(store);

    return render(
      <Provider store={reduxStore}>
        <MapContext.Provider value={map}>
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <ControlledLegForm
              earliestStartDateTime={earliestStartDateTime}
              initialLeg={{
                ...buildLegDraft(),
                patrolType: dogPatrol,
                startDate: '2026-04-13',
                startTime: '08:00',
                ...leg,
              }}
            />
          </TrackerContext.Provider>
        </MapContext.Provider>

        <button form="legForm" type="submit">Submit</button>
      </Provider>
    );
  };

  const getDateInput = (groupName, inputName) =>
    within(screen.getByRole('group', { name: groupName })).getByRole('textbox', { name: inputName });

  const pickPatrolType = async (display) => {
    await userEvent.type(screen.getByRole('combobox', { name: 'Patrol Type' }), '{arrowdown}');
    await userEvent.click(screen.getByRole('option', { name: display }));
  };

  const submitForm = () => userEvent.click(screen.getByRole('button', { name: 'Submit' }));

  test('owns a single form element', () => {
    const { container } = renderLegForm();

    expect(container.querySelectorAll('form')).toHaveLength(1);
  });

  test('shows the static fields, the universal patrol fields and the patrol type fields', () => {
    renderLegForm();

    expect(screen.getByRole('group', { name: 'Start Time' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Objective' })).toBeVisible();
    expect(screen.getByLabelText('Station')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Patrol Type' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toBeVisible();
  });

  test('does not show the patrol type fields until a patrol type is picked', () => {
    renderLegForm({ leg: { patrolType: null } });

    expect(screen.queryByRole('textbox', { name: 'Vehicle Name' })).toBeNull();

    expect(screen.getByRole('textbox', { name: 'Objective' })).toBeVisible();
  });

  test('does not show the universal patrol fields until the site serves their schema', () => {
    delete store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE];

    renderLegForm();

    expect(screen.queryByRole('textbox', { name: 'Objective' })).toBeNull();

    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toBeVisible();
  });

  test('clears the user content the schema driven fields uploaded when it goes away', () => {
    const { unmount } = renderLegForm();

    unmount();

    expect(reduxStore.getActions()).toContainEqual(expect.objectContaining({ type: CLEAR }));
  });

  test('does not show the patrol type fields when the schema of the picked type is empty', () => {
    store.data.patrolSchemas[dogPatrol.value] = { isLoading: false, schema: EMPTY_PATROL_TYPE_SCHEMA };

    renderLegForm();

    expect(screen.queryByRole('textbox', { name: 'Vehicle Name' })).toBeNull();

    expect(screen.getByRole('textbox', { name: 'Objective' })).toBeVisible();
  });

  test('gives the two schema forms their own dom ids', () => {
    renderLegForm();

    const objectiveField = screen.getByRole('textbox', { name: 'Objective' });
    const vehicleNameField = screen.getByRole('textbox', { name: 'Vehicle Name' });

    expect(objectiveField.id).not.toBe(vehicleNameField.id);
    expect(objectiveField.getAttribute('aria-describedby'))
      .not.toBe(vehicleNameField.getAttribute('aria-describedby'));
  });

  test('submits the leg when every part of the form is valid', async () => {
    renderLegForm();

    await submitForm();

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('does not submit the leg while a static field is invalid', async () => {
    renderLegForm({ leg: { startDate: '--' } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('A leg needs a start date.')).toBeVisible();
  });

  test('drops the error of a field as soon as the user edits it', async () => {
    renderLegForm({ leg: { startDate: '--' } });

    await submitForm();
    expect(screen.getByText('A leg needs a start date.')).toBeVisible();

    await userEvent.type(getDateInput('Start date', 'Year'), '2');

    expect(screen.queryByText('A leg needs a start date.')).toBeNull();
  });

  test('keeps the error of a field while the user edits another one', async () => {
    renderLegForm({ leg: { startDate: '--' } });

    await submitForm();

    await userEvent.type(getDateInput('End date', 'Year'), '2026');

    expect(screen.getByText('A leg needs a start date.')).toBeVisible();
  });

  test('drops the end error when the user moves the start it is measured against', async () => {
    renderLegForm({ leg: { endDate: '2026-04-12', endTime: '08:00' } });

    await submitForm();
    expect(screen.getByText('The end of the leg must be later than its start.')).toBeVisible();

    await userEvent.clear(getDateInput('Start date', 'Year'));

    expect(screen.queryByText('The end of the leg must be later than its start.')).toBeNull();
  });

  test('brings a dropped static field error back when the next submission still has it', async () => {
    renderLegForm({ leg: { startDate: '--' } });

    await submitForm();
    await userEvent.type(getDateInput('Start date', 'Year'), '2');

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('A leg needs a start date.')).toBeVisible();
  });

  test('focuses the erroneous static field even when a schema form is invalid too', async () => {
    store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = {
      isLoading: false,
      schema: withRequiredField(defaultPatrolSegmentTypeSchema, 'objective'),
    };

    renderLegForm({ leg: { startDate: '--' } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(getDateInput('Start date', 'Year')).toHaveFocus();
  });

  test('focuses the end date when the leg ends before it starts', async () => {
    renderLegForm({ leg: { endDate: '2026-04-12', endTime: '08:00' } });

    await submitForm();

    expect(getDateInput('End date', 'Year')).toHaveFocus();
  });

  test('does not submit the leg when it starts earlier than it may', async () => {
    renderLegForm({ earliestStartDateTime: new Date(2026, 3, 14, 8, 0) });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('This leg cannot overlap the previous one.')).toBeVisible();
    expect(getDateInput('Start date', 'Year')).toHaveFocus();
  });

  test('does not submit the leg when its start time is incomplete', async () => {
    renderLegForm({ leg: { startTime: ':' } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('A leg needs a start time.')).toBeVisible();
    expect(getDateInput('Start time', 'Hour')).toHaveFocus();
  });

  test('does not submit the leg when it has an end date and no end time', async () => {
    renderLegForm({ leg: { endDate: '2026-04-20' } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('A leg with an end date needs an end time.')).toBeVisible();
    expect(getDateInput('End time', 'Hour')).toHaveFocus();
  });

  test('does not submit the leg without a patrol type', async () => {
    renderLegForm({ leg: { patrolType: null } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('A leg needs a patrol type.')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Patrol Type' })).toHaveFocus();
  });

  test('drops the patrol type error as soon as the user picks a type', async () => {
    renderLegForm({ leg: { patrolType: null } });

    await submitForm();
    expect(screen.getByText('A leg needs a patrol type.')).toBeVisible();

    await pickPatrolType('Dog Patrol');

    expect(screen.queryByText('A leg needs a patrol type.')).toBeNull();
  });

  test('focuses the erroneous universal patrol fields before the missing patrol type', async () => {
    store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = {
      isLoading: false,
      schema: withRequiredField(defaultPatrolSegmentTypeSchema, 'objective'),
    };

    renderLegForm({ leg: { patrolType: null } });

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveFocus();
  });

  test('focuses the first erroneous universal patrol field when both schema forms are invalid', async () => {
    store.data.patrolSchemas[dogPatrol.value] = {
      isLoading: false,
      schema: withRequiredField(patrolTypeFieldsSchema, 'vehicle_name'),
    };
    store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = {
      isLoading: false,
      schema: withRequiredField(defaultPatrolSegmentTypeSchema, 'objective'),
    };

    renderLegForm();

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveFocus();
  });

  test('focuses the first erroneous patrol type field when the universal patrol fields are valid', async () => {
    store.data.patrolSchemas[dogPatrol.value] = {
      isLoading: false,
      schema: withRequiredField(patrolTypeFieldsSchema, 'vehicle_name'),
    };

    renderLegForm();

    await submitForm();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toHaveFocus();
  });

  test('keeps the values the user types in each schema form apart', async () => {
    renderLegForm();

    await userEvent.type(screen.getByRole('textbox', { name: 'Objective' }), 'Reach the trail');
    await userEvent.type(screen.getByRole('textbox', { name: 'Vehicle Name' }), 'KTN-123');

    expect(screen.getByRole('textbox', { name: 'Objective' })).toHaveValue('Reach the trail');
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toHaveValue('KTN-123');
  });

  test('clears the fields of the patrol type when the user changes it', async () => {
    renderLegForm();

    await userEvent.type(screen.getByRole('textbox', { name: 'Vehicle Name' }), 'KTN-123');

    await pickPatrolType(routinePatrol.display);

    expect(screen.getByText('Routine Patrol')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Vehicle Name' })).toHaveValue('');
  });

  describe('the schema of the patrol type', () => {
    test('loads the schema of the patrol type the form opens with', () => {
      delete store.data.patrolSchemas[dogPatrol.value];

      renderLegForm();

      expect(fetchPatrolTypeSchema).toHaveBeenCalledTimes(1);
      expect(fetchPatrolTypeSchema).toHaveBeenCalledWith(dogPatrol.value);
    });

    test('loads the schema of the patrol type the user picks', async () => {
      delete store.data.patrolSchemas[routinePatrol.value];

      renderLegForm();

      await pickPatrolType(routinePatrol.display);

      expect(fetchPatrolTypeSchema).toHaveBeenCalledTimes(1);
      expect(fetchPatrolTypeSchema).toHaveBeenCalledWith(routinePatrol.value);
    });

    test('does not load a schema it already has', () => {
      renderLegForm();

      expect(fetchPatrolTypeSchema).not.toHaveBeenCalled();
    });

    test('shows a loader while the schema is on its way', () => {
      store.data.patrolSchemas[dogPatrol.value] = { isLoading: true };

      renderLegForm();

      expect(screen.getByTestId('legForm-patrolTypeSchemaLoader')).toBeVisible();
      expect(screen.queryByRole('textbox', { name: 'Vehicle Name' })).toBeNull();
    });

    test('shows an error message when the schema cannot be loaded', () => {
      store.data.patrolSchemas[dogPatrol.value] = { error: new Error('Oops'), isLoading: false };

      renderLegForm();

      expect(screen.getByText('The fields of this patrol type could not be loaded.')).toBeVisible();
    });
  });

  describe('the schema of the universal patrol fields', () => {
    test('loads it when the store does not hold it yet', () => {
      delete store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE];

      renderLegForm();

      expect(fetchDefaultPatrolSegmentTypeSchema).toHaveBeenCalledTimes(1);
    });

    test('does not load it again when the store already holds it', () => {
      renderLegForm();

      expect(fetchDefaultPatrolSegmentTypeSchema).not.toHaveBeenCalled();
    });

    test('shows a loader while it is on its way', () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { isLoading: true };

      renderLegForm();

      expect(screen.getByTestId('legForm-universalFieldsSchemaLoader')).toBeVisible();
      expect(screen.queryByRole('textbox', { name: 'Objective' })).toBeNull();
    });

    test('shows an error message when it cannot be loaded', () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { error: new Error('Oops'), isLoading: false };

      renderLegForm();

      expect(screen.getByText('The universal patrol fields could not be loaded.')).toBeVisible();
      expect(screen.queryByTestId('legForm-universalFieldsSchemaLoader')).toBeNull();
    });

    test('leaves the rest of the form usable when it cannot be loaded', async () => {
      store.data.patrolSchemas[DEFAULT_PATROL_SEGMENT_TYPE] = { error: new Error('Oops'), isLoading: false };

      renderLegForm();

      await submitForm();

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
