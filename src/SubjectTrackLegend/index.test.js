import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { setIsTimeOfDayColoringActive, TRACK_LENGTH_ORIGINS } from '../ducks/tracks';
import { updateTrackState } from '../ducks/map-ui';
import { useFeatureFlag } from '../hooks';

import SubjectTrackLegend from '.';

jest.mock('../ducks/tracks', () => ({
  ...jest.requireActual('../ducks/tracks'),
  setIsTimeOfDayColoringActive: jest.fn(),
}));

jest.mock('../ducks/map-ui', () => ({
  ...jest.requireActual('../ducks/map-ui'),
  updateTrackState: jest.fn(),
}));

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));

describe('SubjectTrackLegend', () => {
  const onClearTracks = jest.fn();

  let setIsTimeOfDayColoringActiveMock, updateTrackStateMock, store;
  beforeEach(() => {
    setIsTimeOfDayColoringActiveMock = jest.fn(() => () => {});
    setIsTimeOfDayColoringActive.mockImplementation(setIsTimeOfDayColoringActiveMock);
    updateTrackStateMock = jest.fn(() => () => {});
    updateTrackState.mockImplementation(updateTrackStateMock);

    store = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: '2020-01-01T06:00:00.000Z',
            },
          },
        },
        patrolStore: {},
        subjectStore: {
          123: {},
          456: {},
        },
        tracks: {
          123: {
            points: {
              features: [],
            },
            track: {
              features: [{
                properties: {
                  id: '123',
                  image: 'https://root.dev.pamdas.org/static/elk-male.svg',
                  title: 'Ludwig',
                },
              }],
            },
          },
          456: {
            points: {
              features: [],
            },
            track: {
              features: [{
                properties: {
                  id: '456',
                  image: 'https://root.dev.pamdas.org/static/bison-male.svg',
                  title: 'Gabo',
                },
              }],
            },
          },
        },
      },
      view: {
        patrolTrackState: {
          pinned: [],
          visible: [],
        },
        subjectTrackState: {
          pinned: [],
          visible: [],
        },
        timeSliderState: {
          active: false,
          virtualDate: '2020-06-01T06:00:00.000Z',
        },
        trackSettings: {
          isTimeOfDayColoringActive: false,
          length: 21,
          origin: TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH,
        },
      },
    };
  });

  const renderSubjectTrackLegend = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SubjectTrackLegend onClearTracks={onClearTracks} {...props} />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('shows the subject track legend if there are subjects with visible or pinned tracks', () => {
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    expect(screen.getByTestId('subjectTrackLegend')).toHaveClass('show');
  });

  test('does not show the subject track legend if there are no subjects with visible or pinned tracks', () => {
    renderSubjectTrackLegend();

    expect(screen.queryByTestId('subjectTrackLegend')).toBeNull();
  });

  test('shows the icon and title of the subject if there is only one subject being tracked', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    const titleWrapper = screen.getByTestId('subjectTrackLegend-titleWrapper');

    expect(within(titleWrapper).getByAltText('Icon for Ludwig'))
      .toHaveAttribute('src', 'https://root.dev.pamdas.org/static/elk-male.svg');
    expect(titleWrapper).toHaveTextContent('Ludwig');
  });

  test('shows the tracks icon and a button with the amount of subjects if there are multiple subjects being tracked', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123', '456'];
    renderSubjectTrackLegend();

    const titleWrapper = screen.getByTestId('subjectTrackLegend-titleWrapper');

    expect(within(titleWrapper).getByText('tracks_off.svg')).toBeVisible();
    expect(titleWrapper).toHaveTextContent('2 subjects');
  });

  test('opens and closes the subject tracks list when clicking the button in the title', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123', '456'];
    renderSubjectTrackLegend();

    const subjectTracksListButton = screen.getByLabelText('Open the list of subjects');

    expect(subjectTracksListButton).toHaveAttribute('aria-expanded', 'false');

    userEvent.click(subjectTracksListButton);

    expect(subjectTracksListButton).toHaveAttribute('aria-expanded', 'true');
    expect(subjectTracksListButton).toHaveAttribute('aria-label', 'Close the list of subjects');

    userEvent.click(subjectTracksListButton);

    expect(subjectTracksListButton).toHaveAttribute('aria-expanded', 'false');
    expect(subjectTracksListButton).toHaveAttribute('aria-label', 'Open the list of subjects');
  });

  test('closes the subject tracks list from the close button in the menu', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123', '456'];
    renderSubjectTrackLegend();

    const subjectTracksListButton = screen.getByLabelText('Open the list of subjects');
    userEvent.click(subjectTracksListButton);

    expect(subjectTracksListButton).toHaveAttribute('aria-expanded', 'true');
    expect(subjectTracksListButton).toHaveAttribute('aria-label', 'Close the list of subjects');

    userEvent.click(screen.getAllByLabelText('Close the list of subjects')[1]);

    expect(subjectTracksListButton).toHaveAttribute('aria-expanded', 'false');
    expect(subjectTracksListButton).toHaveAttribute('aria-label', 'Open the list of subjects');
  });

  test('removes the tracks of a subject from the subject tracks list', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123', '456'];
    renderSubjectTrackLegend();

    userEvent.click(screen.getByLabelText('Open the list of subjects'));

    expect(updateTrackState).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Remove Ludwig'));

    expect(updateTrackState).toHaveBeenCalledTimes(1);
    expect(updateTrackState).toHaveBeenCalledWith({ pinned: [], visible: ['456'] });
  });

  test('activates the time of day coloring when clicking the day night button', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    const timeOfDaySettingsButton = screen.getByLabelText('Activate the time of day coloring');

    expect(timeOfDaySettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(timeOfDaySettingsButton).not.toHaveClass('open');
    expect(setIsTimeOfDayColoringActive).not.toHaveBeenCalled();

    userEvent.click(timeOfDaySettingsButton);

    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledTimes(1);
    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledWith(true);
  });

  test('expands and collapses the time of day settings menu when clicking the chevron', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.trackSettings.isTimeOfDayColoringActive = true;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

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
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.trackSettings.isTimeOfDayColoringActive = true;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    const timeOfDaySettingsButton = screen.getByLabelText('Deactivate the time of day coloring');

    expect(timeOfDaySettingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(timeOfDaySettingsButton).toHaveClass('open');
    expect(setIsTimeOfDayColoringActive).not.toHaveBeenCalled();

    userEvent.click(timeOfDaySettingsButton);

    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledTimes(1);
    expect(setIsTimeOfDayColoringActive).toHaveBeenCalledWith(false);
  });

  test('opens and closes the track settings when clicking the gear button', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

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
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    const trackSettingsButton = screen.getByLabelText('Open the track settings');
    userEvent.click(trackSettingsButton);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'true');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Close the track settings');

    userEvent.click(screen.getAllByLabelText('Close the track settings')[1]);

    expect(trackSettingsButton).toHaveAttribute('aria-expanded', 'false');
    expect(trackSettingsButton).toHaveAttribute('aria-label', 'Open the track settings');
  });

  test('clears the tracks when clicking the clear tracks button', () => {
    store.view.trackSettings.origin = TRACK_LENGTH_ORIGINS.EVENT_FILTER;
    store.view.subjectTrackState.visible = ['123'];
    renderSubjectTrackLegend();

    expect(updateTrackState).not.toHaveBeenCalled();

    userEvent.click(screen.getByText('Clear Tracks'));

    expect(updateTrackState).toHaveBeenCalledTimes(1);
    expect(updateTrackState).toHaveBeenCalledWith({ pinned: [], visible: [] });
  });
});
