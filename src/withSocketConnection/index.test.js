import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { mockedSocket } from '../__test-helpers/MockSocketContext';
import { mockStore } from '../__test-helpers/MockStore';
import * as socketFns from '../socket';

const WithSocketConnectionImports = jest.requireActual('../withSocketConnection');

const { default: WithSocketConnection } = WithSocketConnectionImports;

console.log({ socketFns });

jest.spyOn(socketFns, 'default').mockReturnValue(mockedSocket);
jest.spyOn(socketFns, 'bindSocketEvents').mockImplementation(() => mockedSocket);
jest.spyOn(socketFns, 'unbindSocketEvents').mockImplementation(() => mockedSocket);

/* jest.mock('../socket', () => ({
  bindSocketEvents: jest.fn().mockReturnValue(mockedSocket),
  unbindSocketEvents: jest.fn().mockReturnValue(mockedSocket),
}));
 */
jest.mock('../store', () => ({
  default: mockStore({ data: {}, view: {} }),
}));


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