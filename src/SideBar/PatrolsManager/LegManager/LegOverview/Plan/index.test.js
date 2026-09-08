import React from 'react';
import { Provider } from 'react-redux';

import { createMapMock } from '../../../../../__test-helpers/mocks';
import {
  DEFAULT_PATROL_SEGMENT_TYPE,
  fetchDefaultPatrolSegmentTypeSchema,
  fetchPatrolTypeSchema,
} from '../../../../../ducks/patrol-schemas';
import { GPS_FORMATS } from '../../../../../utils/location';
import { MapContext } from '../../../../../MapContext';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { multiLegPatrol } from '../../../../../__test-helpers/fixtures/patrols';
import patrolTypes from '../../../../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../../../../test-utils';

import Plan from './';

jest.mock('../../../../../ducks/patrol-schemas', () => ({
  ...jest.requireActual('../../../../../ducks/patrol-schemas'),
  fetchDefaultPatrolSegmentTypeSchema: jest.fn(),
  fetchPatrolTypeSchema: jest.fn(),
}));

const schemaWithField = (fieldName, title) => ({
  json: {
    properties: { [fieldName]: { description: '', title, type: 'string' } },
    required: [],
    type: 'object',
  },
  ui: {
    fields: { [fieldName]: { inputType: 'SHORT_TEXT', parent: 'section-1', type: 'TEXT' } },
    headers: {},
    order: ['section-1'],
    sections: {
      'section-1': {
        columns: 1,
        conditions: [],
        isActive: true,
        label: '',
        leftColumn: [{ name: fieldName, type: 'field' }],
        rightColumn: [],
      },
    },
  },
});

describe('SideBar - PatrolsManager - LegManager - LegOverview - Plan', () => {
  const map = createMapMock();
  const patrolSegment = multiLegPatrol.patrol_segments[0];

  let store;
  beforeEach(() => {
    fetchDefaultPatrolSegmentTypeSchema.mockImplementation(() => () => {});
    fetchPatrolTypeSchema.mockImplementation(() => () => {});

    store = {
      data: {
        patrolSchemas: {},
        patrolTypes,
      },
      view: {
        coordinateReferenceSystems: { storedSystems: [] },
        userPreferences: { gpsFormat: GPS_FORMATS.DEG },
      },
    };
  });

  const renderPlan = (props) => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <Plan patrol={multiLegPatrol} patrolSegment={patrolSegment} {...props} />
      </MapContext.Provider>
    </Provider>
  );

  test('shows the static fields of the leg', () => {
    renderPlan();

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
  });

  test('leaves the patrol type to the header rather than repeating it', () => {
    renderPlan();

    expect(screen.queryByText('Patrol Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Routine Patrol')).not.toBeInTheDocument();
  });

  test('titles no group of its own, so each schema section reads as its own card', () => {
    renderPlan();

    expect(screen.queryByRole('heading')).toBeNull();
  });

  test('shows a loader while the universal patrol fields schema is on its way', () => {
    store.data.patrolSchemas = { [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: true } };

    renderPlan();

    expect(screen.getByTestId('legOverviewPlan-universalFieldsSchemaLoader')).toBeInTheDocument();
  });

  test('reports that the universal patrol fields schema could not be loaded', () => {
    store.data.patrolSchemas = { [DEFAULT_PATROL_SEGMENT_TYPE]: { error: new Error('Nope'), isLoading: false } };

    renderPlan();

    expect(screen.getByRole('alert')).toHaveTextContent('The universal patrol fields could not be loaded.');
  });

  test('summarizes the universal patrol fields', () => {
    store.data.patrolSchemas = {
      [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: schemaWithField('objective', 'Objective') },
    };

    renderPlan();

    expect(screen.getByText('Objective')).toBeInTheDocument();
  });

  test('renders the universal patrol fields ahead of the patrol type ones', () => {
    store.data.patrolSchemas = {
      [DEFAULT_PATROL_SEGMENT_TYPE]: { isLoading: false, schema: schemaWithField('objective', 'Objective') },
      [patrolSegment.patrol_type]: { isLoading: false, schema: schemaWithField('vehicle', 'Vehicle Name') },
    };

    renderPlan();

    expect(screen.getByText('Objective').compareDocumentPosition(screen.getByText('Vehicle Name')))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('shows a loader while the patrol type schema is on its way', () => {
    store.data.patrolSchemas = { [patrolSegment.patrol_type]: { isLoading: true } };

    renderPlan();

    expect(screen.getByTestId('legOverviewPlan-patrolTypeSchemaLoader')).toBeInTheDocument();
  });

  test('reports that the patrol type fields schema could not be loaded', () => {
    store.data.patrolSchemas = { [patrolSegment.patrol_type]: { error: new Error('Nope'), isLoading: false } };

    renderPlan();

    expect(screen.getByRole('alert')).toHaveTextContent('The fields of this patrol type could not be loaded.');
  });

  test('summarizes the patrol type fields', () => {
    store.data.patrolSchemas = {
      [patrolSegment.patrol_type]: { isLoading: false, schema: schemaWithField('vehicle', 'Vehicle Name') },
    };

    renderPlan();

    expect(screen.getByText('Vehicle Name')).toBeInTheDocument();
  });

  test('fetches the schema of the patrol type of the leg', () => {
    renderPlan();

    expect(fetchPatrolTypeSchema).toHaveBeenCalledWith(patrolSegment.patrol_type);
  });
});
