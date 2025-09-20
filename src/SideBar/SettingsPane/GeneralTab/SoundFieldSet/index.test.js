import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen } from '../../../../test-utils';
import { mockStore } from '../../../../__test-helpers/MockStore';
import {
  setPlaySoundForNewEvents,
  setPlaySoundForNewInReachMessages,
  setPlaySoundForRadioStateChangeToRed,
} from '../../../../ducks/user-preferences';

import SoundFieldSet from './';

jest.mock('../../../../ducks/user-preferences', () => ({
  ...jest.requireActual('../../../../ducks/user-preferences'),
  setPlaySoundForNewEvents: jest.fn(),
  setPlaySoundForNewInReachMessages: jest.fn(),
  setPlaySoundForRadioStateChangeToRed: jest.fn(),
}));

describe('SideBar - SettingsPane - GeneralTab - SoundFieldSet', () => {
  let store;
  beforeEach(() => {
    setPlaySoundForNewEvents.mockImplementation(() => () => { });
    setPlaySoundForNewInReachMessages.mockImplementation(() => () => { });
    setPlaySoundForRadioStateChangeToRed.mockImplementation(() => () => { });

    store = {
      data: {},
      view: {
        userPreferences: {
          playSoundForNewEvents: false,
          playSoundForNewInReachMessages: false,
          playSoundForRadioStateChangeToRed: false,
        },
      },
    };
  });

  const renderSoundFieldSet = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SoundFieldSet {...props} />
    </Provider>
  );

  test('updates the new in reach message setting when user interacts with its checkbox', async () => {
    renderSoundFieldSet();

    expect(setPlaySoundForNewInReachMessages).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'New inReach messages' }));

    expect(setPlaySoundForNewInReachMessages).toHaveBeenCalledTimes(1);
    expect(setPlaySoundForNewInReachMessages).toHaveBeenCalledWith(true);
  });

  test('updates the new events setting when user interacts with its checkbox', async () => {
    renderSoundFieldSet();

    expect(setPlaySoundForNewEvents).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'New Events' }));

    expect(setPlaySoundForNewEvents).toHaveBeenCalledTimes(1);
    expect(setPlaySoundForNewEvents).toHaveBeenCalledWith(true);
  });

  test('updates the radio state change to red setting when user interacts with its checkbox', async () => {
    renderSoundFieldSet();

    expect(setPlaySoundForRadioStateChangeToRed).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('checkbox', { name: 'When a radio state changes to red (alarm)' }));

    expect(setPlaySoundForRadioStateChangeToRed).toHaveBeenCalledTimes(1);
    expect(setPlaySoundForRadioStateChangeToRed).toHaveBeenCalledWith(true);
  });
});
