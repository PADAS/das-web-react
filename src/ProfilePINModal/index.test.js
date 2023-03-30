import React from 'react';

import { render } from '@testing-library/react';

import ProfilePINModal from './';


describe('ProfilePINModal', () => {
  let onSuccess, profile;

  beforeEach(() => {
    onSuccess = jest.fn();

    profile = {
      username: 'meow',
      pin: 1234,
    };

  });

  test('rendering without crashing', () => {
    render(<ProfilePINModal onSuccess={onSuccess} profile={profile} />);
  });

  test('the content', () => {
    const { container } = render(<ProfilePINModal onSuccess={onSuccess} profile={profile} />);

    expect(container).toHaveTextContent('Enter Your PIN');
    expect(container).toHaveTextContent(`User: ${profile.username}`);
  });

  test('entering the correct PIN invokes the onSuccess callback', () => {

  });

  describe('entering the incorrect PIN', () => {
    test('displaying an error message', () => {

    });

    test('changing the value after an error clears the error message', () => {

    });
  });
});