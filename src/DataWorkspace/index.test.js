import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import merge from 'lodash/merge';

import { mockStore } from '../__test-helpers/MockStore';
import { SYSTEM_CONFIG_FLAGS } from '../constants';
import { INITIAL_FILTER_STATE as EVENT_FILTER_INITIAL } from '../ducks/event-filter/';
import { INITIAL_FILTER_STATE as PATROL_FILTER_INITIAL } from '../ducks/patrol-filter';
import { render, screen } from '../test-utils';

import DataWorkspace from './index';

jest.mock('ag-grid-react', () => ({
  AgGridReact: function AgGridReactStub() {
    return <div data-testid="ag-grid-stub" />;
  },
}));

jest.mock('../EventFilter', () => function EventFilterStub() {
  return <div data-testid="stub-event-filter" />;
});

jest.mock('../PatrolFilter', () => function PatrolFilterStub() {
  return <div data-testid="stub-patrol-filter" />;
});

jest.mock('../utils/toast', () => ({
  showToast: jest.fn(),
}));

jest.mock('../SideBar/useReportsFeed', () => jest.fn());
const mockUseFetchPatrolsFeed = jest.fn(() => ({ loadingPatrolsFeed: false }));

jest.mock('../SideBar/useFetchPatrolsFeed', () => ({
  __esModule: true,
  default: (...args) => mockUseFetchPatrolsFeed(...args),
}));

const defaultState = {
  data: {
    eventFilter: { ...EVENT_FILTER_INITIAL },
    eventTypes: [],
    feedEvents: { results: [], count: 0, next: null },
    eventStore: {},
    patrolFilter: { ...PATROL_FILTER_INITIAL },
    patrolsFeed: { count: null, next: null, results: [] },
    patrolStore: {},
    mapSubjects: { bbox: null, subjects: [] },
    selectedUserProfile: null,
    user: {
      permissions: {
        patrol: ['view'],
      },
    },
  },
  view: {
    systemConfig: {
      [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
      [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
      [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
    },
  },
};

const buildState = (overrides = {}) => merge({}, defaultState, overrides);

describe('DataWorkspace', () => {
  const renderWorkspace = (state) => render(
    <Provider store={mockStore(buildState(state))}>
      <DataWorkspace />
    </Provider>,
  );

  beforeEach(() => {
    mockUseFetchPatrolsFeed.mockImplementation(() => ({ loadingPatrolsFeed: false }));
  });

  test('renders the workspace root and entity switcher', () => {
    renderWorkspace();

    expect(screen.getByTestId('data-workspace-root')).toBeInTheDocument();
    expect(screen.getByTestId('data-entity-switcher')).toBeInTheDocument();
    const select = screen.getByTestId('data-entity-select');
    expect(select).toBeVisible();
    expect(select).toHaveValue('events');
    expect(screen.getByRole('option', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Subjects' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Patrols' })).toBeInTheDocument();
  });

  test('shows event filters, grid, and export under the data view kebab menu', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.getByTestId('data-event-filters')).toContainElement(screen.getByTestId('stub-event-filter'));
    expect(screen.getByTestId('ag-grid-stub')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Export CSV' })).toBeNull();

    await user.click(screen.getByTestId('data-view-kebab-menu').querySelector('button'));
    expect(await screen.findByTestId('data-export-csv-button')).toBeEnabled();

    expect(screen.queryByRole('button', { name: 'Open structure' })).toBeNull();
  });

  test('shows no event filters when Subjects entity is selected', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.selectOptions(screen.getByTestId('data-entity-select'), 'subjects');

    expect(screen.queryByTestId('stub-event-filter')).not.toBeInTheDocument();
    expect(screen.getByTestId('data-entity-select')).toHaveValue('subjects');
  });

  test('shows patrol filters when Patrols entity is selected', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.selectOptions(screen.getByTestId('data-entity-select'), 'patrols');

    expect(screen.getByTestId('stub-patrol-filter')).toBeInTheDocument();
  });

  test('shows grid busy overlay while patrol feed is loading', async () => {
    const user = userEvent.setup();
    mockUseFetchPatrolsFeed.mockImplementation(() => ({ loadingPatrolsFeed: true }));
    renderWorkspace();

    await user.selectOptions(screen.getByTestId('data-entity-select'), 'patrols');

    expect(screen.getByTestId('data-grid-busy-overlay')).toBeInTheDocument();
  });

  test('hides events option when events are disabled in system config', () => {
    renderWorkspace({
      view: {
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.EVENTS]: false,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
        },
      },
    });

    expect(screen.queryByRole('option', { name: 'Events' })).toBeNull();
    expect(screen.getByTestId('data-entity-select')).toHaveValue('subjects');
  });
});
