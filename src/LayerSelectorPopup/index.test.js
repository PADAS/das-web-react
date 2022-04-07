import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import LayerSelectorPopup from './';
import { mockClusterLeaves } from '../__test-helpers/fixtures/clusters';
import { hidePopup } from '../ducks/popup';
import { mockStore } from '../__test-helpers/MockStore';
import { uuid } from '../utils/string';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: { ENABLE_NEW_CLUSTERING: true },
}));
jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  hidePopup: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useFeatureFlag: () => true,
}));

describe('LayerSelectorPopup', () => {
  const onSelectSubject = jest.fn(), onSelectEvent = jest.fn(), onSelectPoint = jest.fn();
  let hidePopupMock, store;
  beforeEach(() => {
    hidePopupMock = jest.fn(() => () => {});
    hidePopup.mockImplementation(hidePopupMock);

    store = mockStore({ view: { mapImages: [] } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('does not show the search bar if there are 5 or less features', async () => {
    const data = {
      layers: mockClusterLeaves[0],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.queryByRole('textbox')).toBeNull();
  });

  test('shows the search bar if there are more than 5 features', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.queryByRole('textbox')).toBeDefined();
  });

  test('filters the layers shown in the list when user types in the search bar', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(await screen.findAllByRole('listitem')).toHaveLength(6);

    const searchBar = await screen.findByRole('textbox');
    userEvent.type(searchBar, 'Jenae One Field');

    expect(await screen.findAllByRole('listitem')).toHaveLength(4);
  });

  test('clears the filter when user presses the clear button', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    const searchBar = await screen.findByRole('textbox');
    userEvent.type(searchBar, 'Jenae One Field');

    expect(await screen.findAllByRole('listitem')).toHaveLength(4);

    const clearButton = await screen.findByRole('button');
    userEvent.click(clearButton);

    expect(await screen.findAllByRole('listitem')).toHaveLength(6);
  });

  test('hides the current popup and triggers onSelectSubject when user clicks a subject layer', async () => {
    const data = {
      layers: mockClusterLeaves[0],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(hidePopup).toHaveBeenCalledTimes(0);
    expect(onSelectSubject).toHaveBeenCalledTimes(0);

    const subjectLayer = (await screen.findAllByRole('listitem'))[0];
    userEvent.click(subjectLayer);

    expect(hidePopup).toHaveBeenCalledTimes(1);
    expect(onSelectSubject).toHaveBeenCalledTimes(1);
    expect(onSelectSubject.mock.calls[0][0].layer.properties.id).toBe('78c67448-666c-4c51-8e33-e1a079e215dc');
  });

  test('hides the current popup and triggers onSelectEvent when user clicks an event layer', async () => {
    const data = {
      layers: mockClusterLeaves[1],
      onSelectSubject,
      onSelectEvent,
      onSelectPoint,
    };
    render(
      <Provider store={store}>
        <LayerSelectorPopup data={data} id={uuid()} />
      </Provider>
    );

    expect(hidePopup).toHaveBeenCalledTimes(0);
    expect(onSelectEvent).toHaveBeenCalledTimes(0);

    const eventLayer = (await screen.findAllByRole('listitem'))[0];
    userEvent.click(eventLayer);

    expect(hidePopup).toHaveBeenCalledTimes(1);
    expect(onSelectEvent).toHaveBeenCalledTimes(1);
    expect(onSelectEvent.mock.calls[0][0].layer.properties.id).toBe('60e98094-4f5d-4e91-8b7c-1cef1775109d');
  });
});
