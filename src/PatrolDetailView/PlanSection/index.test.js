import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MapDrawingToolsContextProvider from '../../MapDrawingTools/ContextProvider';
import { newPatrol, overduePatrol, scheduledPatrol,  patrolDefaultStoreData } from '../../__test-helpers/fixtures/patrols';
import { mockStore } from '../../__test-helpers/MockStore';
import { GPS_FORMATS } from '../../utils/location';

import PlanSection from '.';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/patrols' }),
}));

jest.mock('../../ducks/patrols', () => ({
  ...jest.requireActual('../../ducks/patrols'),
  updatePatrol: jest.fn(),
}));

const onPatrolEndDateChange = jest.fn(),
  onPatrolEndLocationChange = jest.fn(),
  onPatrolObjectiveChange = jest.fn(),
  onPatrolReportedByChange = jest.fn(),
  onPatrolStartDateChange = jest.fn(),
  onPatrolStartLocationChange = jest.fn();
const store = {
  ...patrolDefaultStoreData,
  view: {
    ...patrolDefaultStoreData.view,
    mapLocationSelection: { isPickingLocation: false },
    userPreferences: { gpsFormat: GPS_FORMATS.DEG },
  },
};
store.data.patrolLeaderSchema.trackedbySchema.properties.leader.enum_ext.push(
  {
    value: {
      content_type: 'observations.subject',
      id: 'dba0e0a6-0083-41be-a0eb-99e956977748',
      name: 'Alex',
      subject_type: 'person',
      subject_subtype: 'ranger',
      common_name: null,
      additional: {},
      created_at: '2021-08-31T14:42:06.701541-07:00',
      updated_at: '2021-08-31T14:42:06.701557-07:00',
      is_active: true,
      tracks_available: false,
      image_url: '/static/ranger-black.svg'
    },
  }
);

describe('PatrolDetailView - PlanSection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the name of the tracking subject for patrols that already exist', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={overduePatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('patrolDetailView-reportedBySelect');
    const selectionImage = await screen.getByAltText('Radio icon for Alex value');

    expect(within(reportedBySelect).queryByText('Select Device...')).toBeNull();
    expect(selectionImage).toHaveAttribute('src', 'https://localhost//static/ranger-black.svg');
    expect((await within(reportedBySelect).findByText('Alex'))).toBeDefined();
  });

  test('it should show the field empty for new patrols', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={newPatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    const reportedBySelect = await screen.getByTestId('patrolDetailView-reportedBySelect');
    const placeholderText = within(reportedBySelect).queryByText('Select Device...');

    expect(() => within(reportedBySelect).getByTestId('select-single-value')).toThrow();
    expect(placeholderText).toBeDefined();
  });

  test('it should show the objective for patrols that already exist', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={overduePatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');

    expect(objectiveInput).toHaveTextContent('very ambitious objective');
  });

  test('it should show the field empty for new patrols', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={newPatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    const objectiveInput = await screen.getByTestId('patrolDetailView-objectiveTextArea');

    expect(objectiveInput).toHaveTextContent('');
  });

  test('it should show the start and end location inputs', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={scheduledPatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect(await screen.getByTestId('patrolDetailView-startLocationSelect')).toBeDefined();
    expect(await screen.getByTestId('patrolDetailView-endLocationSelect')).toBeDefined();
  });

  test('it should show the placeholder for empty values', async () => {
    render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <PlanSection
            onPatrolEndDateChange={onPatrolEndDateChange}
            onPatrolEndLocationChange={onPatrolEndLocationChange}
            onPatrolObjectiveChange={onPatrolObjectiveChange}
            onPatrolReportedByChange={onPatrolReportedByChange}
            onPatrolStartDateChange={onPatrolStartDateChange}
            onPatrolStartLocationChange={onPatrolStartLocationChange}
            patrolForm={overduePatrol}
          />
        </MapDrawingToolsContextProvider>
      </Provider>
    );

    expect(await screen.findByText('Start Location')).toBeDefined();
    expect(await screen.findByText('End Location')).toBeDefined();
  });
});