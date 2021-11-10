import React from 'react';
import MockSocketProvider, { mockedSocket } from '../../__test-helpers/MockSocketContext';

import StateManagedSocketConsumer from '.';

import { render } from '@testing-library/react';

it('renders without crashing', () => {
  render(
    <MockSocketProvider>
      <StateManagedSocketConsumer />
    </MockSocketProvider>
  );
});

describe('binding handlers', () => {
  let callback;
  let onStateMismatch;
  const TYPE = 'test_type';
  beforeEach(() => {
    callback = jest.fn();
    onStateMismatch = jest.fn();

    render(
      <MockSocketProvider>
        <StateManagedSocketConsumer type={TYPE} callback={callback} onStateMismatch={onStateMismatch} />
      </MockSocketProvider>
    );

  });

  it('invokes the callback if the message received is next-in-line', () => {
    const testPayload = { mid: 1 };

    mockedSocket.socketClient.emit(TYPE, testPayload);

    expect(callback).toHaveBeenCalledWith(testPayload);

    expect(onStateMismatch).not.toHaveBeenCalled();
  });

  it('invokes the `onStateMismatch` handler if the message received is out of order', () => {
    const testPayload = { mid: 666 };

    mockedSocket.socketClient.emit(TYPE, testPayload);

    expect(onStateMismatch).toHaveBeenCalledWith(testPayload);

    expect(callback).not.toHaveBeenCalled();
  });

});
