import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { setIsTimeOfDayColoringActive, TRACK_LENGTH_ORIGINS } from '../ducks/tracks';

import TrackLegend from '.';

jest.mock('../ducks/tracks', () => ({
  ...jest.requireActual('../ducks/tracks'),
  setIsTimeOfDayColoringActive: jest.fn(),
}));

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));

describe('TrackLegend', () => {
  const onClickClearTracks = jest.fn();
  const onRemoveItemTracks = jest.fn();

  let setIsTimeOfDayColoringActiveMock, store;
  beforeEach(() => {
    setIsTimeOfDayColoringActiveMock = jest.fn(() => () => {});
    setIsTimeOfDayColoringActive.mockImplementation(setIsTimeOfDayColoringActiveMock);

    store = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: '2020-01-01T06:00:00.000Z',
            },
          },
        },
      },
      view: {
        trackSettings: {
          isTimeOfDayColoringActive: false,
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
          timeOfDayTimeZone: null,
        },
      },
    };
  });

  const renderTrackLegend = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <TrackLegend
        description="Description"
        items={[]}
        itemsName="items"
        onClickClearTracks={onClickClearTracks}
        onRemoveItemTracks={onRemoveItemTracks}
        {...props}
      />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the track legend if there is at least one item', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    expect(screen.getByTestId('trackLegend')).toHaveClass('show');
  });

  test('does not show the track legend if there are no items', () => {
    renderTrackLegend();

    expect(screen.queryByTestId('trackLegend')).toBeNull();
  });

  test('shows the icon and title of the item if there is only one item', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const titleWrapper = screen.getByTestId('trackLegend-titleWrapper');

    expect(within(titleWrapper).getByAltText('Item icon')).toHaveAttribute('src', 'icon');
    expect(titleWrapper).toHaveTextContent('Item title');
  });

  test('shows the tracks icon and a button with the amount of items if there are zero or multiple items', () => {
    renderTrackLegend({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    const titleWrapper = screen.getByTestId('trackLegend-titleWrapper');

    expect(within(titleWrapper).getByText('tracks_off.svg')).toBeVisible();
    expect(titleWrapper).toHaveTextContent('2 items');
  });

  test('opens and closes the tracks list when clicking the button in the title', () => {
    renderTrackLegend({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    const tracksListButton = screen.getByLabelText('Open the list of items');

    expect(tracksListButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(tracksListButton);

    expect(tracksListButton).toHaveAttribute('aria-expanded', 'true');
    expect(tracksListButton).toHaveAttribute('aria-label', 'Close the list of items');

    userEvent.click(tracksListButton);

    expect(tracksListButton).toHaveAttribute('aria-expanded', 'false');
    expect(tracksListButton).toHaveAttribute('aria-label', 'Open the list of items');
  });

  test('closes the tracks list from the close button in the menu', () => {
    renderTrackLegend({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    const tracksListButton = screen.getByLabelText('Open the list of items');
    userEvent.click(tracksListButton);

    expect(tracksListButton).toHaveAttribute('aria-expanded', 'true');
    expect(tracksListButton).toHaveAttribute('aria-label', 'Close the list of items');

    userEvent.click(screen.getAllByLabelText('Close the list of items')[1]);

    expect(tracksListButton).toHaveAttribute('aria-expanded', 'false');
    expect(tracksListButton).toHaveAttribute('aria-label', 'Open the list of items');
  });

  test('removes the tracks of an item from the tracks list', () => {
    renderTrackLegend({
      items: [{
        description: 'Item 1 description',
        icon: <img alt="Item 1 icon" src="icon-1" />,
        id: '1',
        title: 'Item 1 title',
      }, {
        description: 'Item 2 description',
        icon: <img alt="Item 2 icon" src="icon-2" />,
        id: '2',
        title: 'Item 2 title',
      }],
    });

    userEvent.click(screen.getByLabelText('Open the list of items'));

    expect(onRemoveItemTracks).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Remove Item 2 title'));

    expect(onRemoveItemTracks).toHaveBeenCalledTimes(1);
    expect(onRemoveItemTracks).toHaveBeenCalledWith('2');
  });

  test('doest not show the time of day settings button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
      showTimeOfDaySettings: false,
    });

    expect(screen.queryByLabelText('Activate the time of day coloring')).toBeNull();
  });

  test('shows the time of day settings button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    expect(screen.getByLabelText('Activate the time of day coloring')).toBeVisible();
  });

  test('activates the time of day coloring when clicking the time of day settings button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const timeOfDaySettingsButton = screen.getByLabelText('Activate the time of day coloring');

    expect(timeOfDaySettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(timeOfDaySettingsButton).not.toHaveClass('open');
    expect(setIsTimeOfDayColoringActive).not.toHaveBeenCalled();

    userEvent.click(timeOfDaySettingsButton);

    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledTimes(1);
    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledWith(true);
  });

  test('expands and collapses the time of day settings menu when clicking the chevron', () => {
    store.view.trackSettings.isTimeOfDayColoringActive = true;
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const timeOfDaySettingsChevronButton = screen.getByLabelText('Expand the time of day settings');

    expect(timeOfDaySettingsChevronButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(timeOfDaySettingsChevronButton);

    expect(timeOfDaySettingsChevronButton).toHaveAttribute('aria-expanded', 'true');
    expect(timeOfDaySettingsChevronButton).toHaveAttribute('aria-label', 'Collapse the time of day settings');

    userEvent.click(timeOfDaySettingsChevronButton);

    expect(timeOfDaySettingsChevronButton).toHaveAttribute('aria-expanded', 'false');
    expect(timeOfDaySettingsChevronButton).toHaveAttribute('aria-label', 'Expand the time of day settings');
  });

  test('deactivates the time of day coloring when clicking the day night button', () => {
    store.view.trackSettings.isTimeOfDayColoringActive = true;
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const timeOfDaySettingsButton = screen.getByLabelText('Deactivate the time of day coloring');

    expect(timeOfDaySettingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(timeOfDaySettingsButton).toHaveClass('open');
    expect(setIsTimeOfDayColoringActive).not.toHaveBeenCalled();

    userEvent.click(timeOfDaySettingsButton);

    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledTimes(1);
    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledWith(false);
  });

  test('doest not show the track settings button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
      showTrackSettings: false,
    });

    expect(screen.queryByLabelText('Open the track settings')).toBeNull();
  });

  test('shows the track settings button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    expect(screen.getByLabelText('Open the track settings')).toBeVisible();
  });

  test('opens and closes the track settings when clicking the gear button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const trackSettingsButton = screen.getByLabelText('Open the track settings');

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(trackSettingsButton).not.toHaveClass('open');

    userEvent.click(trackSettingsButton);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Close the track settings');
    expect(trackSettingsButton).toHaveClass('open');

    userEvent.click(trackSettingsButton);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Open the track settings');
    expect(trackSettingsButton).not.toHaveClass('open');
  });

  test('closes the track settings from the close button in the menu', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    const trackSettingsButton = screen.getByLabelText('Open the track settings');
    userEvent.click(trackSettingsButton);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Close the track settings');

    userEvent.click(screen.getAllByLabelText('Close the track settings')[1]);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Open the track settings');
  });

  test('clears the tracks when clicking the clear tracks button', () => {
    renderTrackLegend({
      items: [{
        description: 'Item description',
        icon: <img alt="Item icon" src="icon" />,
        id: 'id',
        title: 'Item title',
      }],
    });

    expect(onClickClearTracks).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Clear Tracks'));

    expect(onClickClearTracks).toHaveBeenCalledTimes(1);
  });
});
