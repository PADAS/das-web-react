import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import ReportOverview from './';

describe('ReportOverview', () => {
  const onShowInformationModal = jest.fn();
  let rerender, store;

  beforeEach(() => {
    store = { data: { eventTypes: [], patrolTypes: [] }, view: { mapLocationSelection: { event: report } } };

    ({ rerender } = render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapDrawingToolsContextProvider>
            <ReportOverview onShowInformationModal={onShowInformationModal} />
          </MapDrawingToolsContextProvider>
        </NavigationWrapper>
      </Provider>
    ));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the report information modal when clicking the information icon', async () => {
    expect(onShowInformationModal).toHaveBeenCalledTimes(0);

    const informationIcon = await screen.findByText('information.svg');
    userEvent.click(informationIcon);

    expect(onShowInformationModal).toHaveBeenCalledTimes(1);
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
      fillLabelPoint: {
        properties: {
          areaLabel: '5km²',
        },
      },
      drawnLineSegments: {
        properties: {
          lengthLabel: '10km',
        },
      },
    };
    rerender(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <MapDrawingToolsContext.Provider value={{ mapDrawingData }}>
            <ReportOverview />
          </MapDrawingToolsContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect((await screen.findByText('Area: 5km²'))).toBeDefined();
    expect((await screen.findByText('Perimeter: 10km'))).toBeDefined();
  });
});
