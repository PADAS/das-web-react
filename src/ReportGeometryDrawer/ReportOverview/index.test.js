import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import cloneDeep from 'lodash/cloneDeep';

import { addModal } from '../../ducks/modals';
import InformationModal from './../InformationModal';
import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import ReportOverview from './';

jest.mock('../../ducks/modals', () => ({
  ...jest.requireActual('../../ducks/modals'),
  addModal: jest.fn(),
}));

const mockGeometry = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0.1], [0.1, 0.2], [0.2, 0.3], [0, 0.1],
      ],
    ],
  },
  properties: {
    perimeter: 62900,
    area: 37748000,
  },
};

describe('ReportOverview', () => {
  let addModalMock, store;

  let mockReport;


  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);

    mockReport = cloneDeep(report);
    mockReport.location = null;
    mockReport.geometry = mockGeometry;

    store = {
      data: {
        eventStore: { [mockReport.id]: mockReport },
        eventTypes: [],
        patrolTypes: []
      },
      view: {
        mapLocationSelection: { event: mockReport }
      },
    };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapDrawingToolsContextProvider>
            <ReportOverview />
          </MapDrawingToolsContextProvider>
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the report information modal when clicking the information icon', async () => {
    expect(addModal).toHaveBeenCalledTimes(0);

    const informationIcon = await screen.findByText('information.svg');
    userEvent.click(informationIcon);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].content).toBe(InformationModal);
  });

  test('closes and opens the card', async () => {
    const collapse = await screen.findByTestId('reportOverview-collapse');

    expect(collapse).toHaveClass('show');

    const arrowUpIcon = await screen.findByText('arrow-up-simple.svg');
    userEvent.click(arrowUpIcon);

    expect(collapse).not.toHaveClass('show');

    const arrowDownIcon = await screen.findByText('arrow-down-simple.svg');
    userEvent.click(arrowDownIcon);

    await waitFor(() => {
      expect(collapse).toHaveClass('show');
    });
  });

  test('renders default values for area and perimeter', async () => {
    expect((await screen.findByText('Area: 0km²'))).toBeDefined();
    expect((await screen.findByText('Perimeter: 0km'))).toBeDefined();
  });

  test('renders the given values for area and perimeter', async () => {
    const mapDrawingData = {
      fillPolygon: mockGeometry,
    };

    cleanup();

    render(
      <MapDrawingToolsContext.Provider value={{ mapDrawingData }}>
        <Provider store={mockStore(store)}>
          <NavigationWrapper>
            <ReportOverview />
          </NavigationWrapper>
        </Provider>
      </MapDrawingToolsContext.Provider>
    );

    expect((await screen.findByText('Area: 37.74km²'))).toBeDefined();
    expect((await screen.findByText('Perimeter: 62.89km'))).toBeDefined();
  });
});
