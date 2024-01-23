import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import cloneDeep from 'lodash/cloneDeep';

import MapDrawingToolsContextProvider, { MapDrawingToolsContext } from '../MapDrawingTools/ContextProvider';
import { MAP_LOCATION_SELECTION_MODES } from '../ducks/map-ui';
import { mockStore } from '../__test-helpers/MockStore';
import { report } from '../__test-helpers/fixtures/reports';
import MapLocationSelectionOverview from '.';
import { render, screen, waitFor } from '../test-utils';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
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

describe('MapLocationSelectionOverview', () => {
  const onClickDiscard = jest.fn(), onClickUndo = jest.fn(), onShowInformation = jest.fn();
  let rerender, store;

  let mockReport;


  beforeEach(() => {
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
        mapLocationSelection: { event: mockReport, isPickingLocation: true, mode: MAP_LOCATION_SELECTION_MODES.DEFAULT },
      },
    };

    ({ rerender } = render(
      <Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MapLocationSelectionOverview
              isDiscardButtonDisabled={false}
              isUndoButtonDisabled={false}
              onClickDiscard={onClickDiscard}
              onClickUndo={onClickUndo}
              onShowInformation={onShowInformation}
            />
        </MapDrawingToolsContextProvider>
      </Provider>
    ));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the report information modal when clicking the information icon', async () => {
    expect(onShowInformation).toHaveBeenCalledTimes(0);

    const informationIcon = await screen.findByText('information.svg');
    userEvent.click(informationIcon);

    expect(onShowInformation).toHaveBeenCalledTimes(1);
  });

  test('closes and opens the card', async () => {
    const collapse = await screen.findByTestId('mapLocationSelectionOverview-collapse');

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

  describe('with a single-point location', () => {
    test('the title is "Choose report location"', async () => {
      await screen.findByText('Choose report location');
    });
  });

  describe('with geometry', () => {
    beforeEach(() => {
      store.view.mapLocationSelection.mode = MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY;

      rerender(<Provider store={mockStore(store)}>
        <MapDrawingToolsContextProvider>
          <MapLocationSelectionOverview
            isDiscardButtonDisabled={false}
            isUndoButtonDisabled={false}
            onClickDiscard={onClickDiscard}
            onClickUndo={onClickUndo}
            onShowInformation={onShowInformation}
          />
        </MapDrawingToolsContextProvider>
      </Provider>);
    });

    test('the title is "Create report area"', async () => {
      await screen.findByText('Create report area');
    });

    test('renders default values for area and perimeter', async () => {
      expect((await screen.findByText('Area: 0km²'))).toBeDefined();
      expect((await screen.findByText('Perimeter: 0km'))).toBeDefined();
    });

    test('renders the given values for area and perimeter', async () => {
      const mapDrawingData = {
        fillPolygon: mockGeometry,
      };
      rerender(
        <Provider store={mockStore(store)}>
          <MapDrawingToolsContext.Provider value={{ mapDrawingData }}>
            <MapLocationSelectionOverview
                isDiscardButtonDisabled={false}
                isUndoButtonDisabled={false}
                onClickDiscard={onClickDiscard}
                onClickUndo={onClickUndo}
              />
          </MapDrawingToolsContext.Provider>
        </Provider>
      );

      expect((await screen.findByText('Area: 37.74km²'))).toBeDefined();
      expect((await screen.findByText('Perimeter: 62.89km'))).toBeDefined();
    });

    test('triggers onClickUndo', async () => {
      expect(onClickUndo).toHaveBeenCalledTimes(0);

      const undoButton = await screen.findByText('Undo');
      userEvent.click(undoButton);

      expect(onClickUndo).toHaveBeenCalledTimes(1);
    });

    test('disables undo button', async () => {
      rerender(
        <Provider store={mockStore(store)}>
          <MapDrawingToolsContextProvider>
            <MapLocationSelectionOverview
                isDiscardButtonDisabled={false}
                isUndoButtonDisabled
                onClickDiscard={onClickDiscard}
                onClickUndo={onClickUndo}
              />
          </MapDrawingToolsContextProvider>
        </Provider>
      );

      expect((await screen.findByText('Undo'))).toHaveProperty('disabled');
    });

    test('shows the undo button tooltip', async () => {
      expect((await screen.queryByRole('tooltip'))).toBeNull();

      const undoButton = await screen.findByText('Undo');
      userEvent.hover(undoButton);

      expect((await screen.findByRole('tooltip'))).toHaveTextContent('Reverse your last action');
    });

    test('triggers onClickDiscard', async () => {
      expect(onClickDiscard).toHaveBeenCalledTimes(0);

      const discardButton = await screen.findByText('Discard');
      userEvent.click(discardButton);

      expect(onClickDiscard).toHaveBeenCalledTimes(1);
    });

    test('disables discard button', async () => {
      rerender(
        <Provider store={mockStore(store)}>
          <MapDrawingToolsContextProvider>
            <MapLocationSelectionOverview
                isDiscardButtonDisabled
                isUndoButtonDisabled={false}
                onClickDiscard={onClickDiscard}
                onClickUndo={onClickUndo}
              />
          </MapDrawingToolsContextProvider>
        </Provider>
      );

      expect((await screen.findByText('Discard'))).toHaveProperty('disabled');
    });

    test('shows the discard button tooltip', async () => {
      expect((await screen.queryByRole('tooltip'))).toBeNull();

      const discardButton = await screen.findByText('Discard');
      userEvent.hover(discardButton);

      expect((await screen.findByRole('tooltip'))).toHaveTextContent('Remove all points');
    });
  });



});
