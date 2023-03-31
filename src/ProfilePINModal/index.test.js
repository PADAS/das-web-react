import React from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

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

    const splitPin = profile.pin.split('');

    expect(onSuccess).not.toHaveBeenCalled();

    splitPin.forEach((char, index) => {
      fireEvent.keyDown(pinInputs[index], { key: char, code: `key${char}` });
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('entering the incorrect PIN', () => {
    let pinInputs;

    beforeEach(async () => {
      pinInputs = await screen.findAllByRole('input');

      pinInputs.forEach((input) => {
        fireEvent.keyDown(input, { key: '1', code: 'key1' });
      });
    });

    test('displaying an error message', () => {
      expect(screen.queryByText('Incorrect PIN')).toBeInTheDocument();
    });

    test('changing the value after an error clears the error message', () => {
      expect(screen.queryByText('Incorrect PIN')).toBeInTheDocument();

      fireEvent.keyDown(pinInputs[1], {
        key: 'Backspace',
        keyCode: 8,
        charCode: 8,
        which: 8,
      });

      expect(screen.queryByText('Incorrect PIN')).not.toBeInTheDocument();
    });
  });
});