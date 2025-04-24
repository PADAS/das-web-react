import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';
import ProfilePINModal from './';

describe('ProfilePINModal', () => {
  let onSuccess, profile;

  beforeEach(() => {
    onSuccess = jest.fn();

    profile = {
      username: 'meow',
      pin: '1234',
    };

    render(<ProfilePINModal onSuccess={onSuccess} profile={profile} />);

  });

  test('the content', async () => {
    await screen.findByText('Enter Your PIN');
    await screen.findByText(`User: ${profile.username}`);
  });

  test('entering the correct PIN invokes the onSuccess callback', async () => {
    const pinInputs = await screen.findAllByRole('input');

    expect(onSuccess).not.toHaveBeenCalled();

    await userEvent.type(pinInputs[0], profile.pin[0]);
    await userEvent.type(pinInputs[1], profile.pin[1]);
    await userEvent.type(pinInputs[2], profile.pin[2]);
    await userEvent.type(pinInputs[3], profile.pin[3]);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('entering the incorrect PIN', () => {
    test('showing an error message', async () => {
      const pinInputs = await screen.findAllByRole('input');

      await userEvent.type(pinInputs[0], '1');
      await userEvent.type(pinInputs[1], '1');
      await userEvent.type(pinInputs[2], '1');
      await userEvent.type(pinInputs[3], '1');

      expect(screen.queryByText('Incorrect PIN')).toBeInTheDocument();
    });

    test('changing the value after an error clears the error message', async () => {
      const pinInputs = await screen.findAllByRole('input');

      await userEvent.type(pinInputs[0], '1');
      await userEvent.type(pinInputs[1], '1');
      await userEvent.type(pinInputs[2], '1');
      await userEvent.type(pinInputs[3], '1');
      await userEvent.type(pinInputs[3], '{backspace}');

      expect(screen.queryByText('Incorrect PIN')).not.toBeInTheDocument();
    });
  });
});