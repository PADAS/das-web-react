import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { mockedSocket } from '../__test-helpers/MockSocketContext';
import * as socketFns from '../socket';

const WithSocketConnectionImports = jest.requireActual('../withSocketConnection');

const { default: WithSocketConnection } = WithSocketConnectionImports;

console.log({ mockedSocket });

jest.spyOn(socketFns, 'default').mockReturnValue({ on: jest.fn(), off: jest.fn(), close: jest.fn() });
jest.spyOn(socketFns, 'bindSocketEvents').mockImplementation(socket => socket);
jest.spyOn(socketFns, 'unbindSocketEvents').mockImplementation(socket => socket);

console.log({ socketFns });

describe('initializing the web socket', () => {
  test('binding socket events', async () => {
    render(<WithSocketConnection>
      <div>Hello there</div>
    </WithSocketConnection>
    );

    await waitFor(() => {
      expect(socketFns.bindSocketEvents).toHaveBeenCalled();
    });
  });
});

describe('recreating the web socket', () => {
  test('tearing down the old web socket for failure cases', () => {

  });

  test('creating the new web socket', () => {

  });
});