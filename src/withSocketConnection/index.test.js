import React from 'react';
import { render, waitFor } from '@testing-library/react';

import { mockedSocket } from '../__test-helpers/MockSocketContext';

import createSocket, { bindSocketEvents, unbindSocketEvents } from '../socket';

jest.mock('../socket', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    console.log('i am now returning a value', mockedSocket);
    return mockedSocket;
  }),
  bindSocketEvents: jest.fn().mockImplementation(socket => socket),
  unbindSocketEvents: jest.fn().mockImplementation(socket => socket),
}));

const WithSocketConnectionImports = jest.requireActual('../withSocketConnection');

const { default: WithSocketConnection } = WithSocketConnectionImports;


describe('initializing the web socket', () => {
  test('binding socket events', () => {
    // render(<WithSocketConnection>
    //   <div>Hello there</div>
    // </WithSocketConnection>
    // );

    // expect(createSocket).toHaveBeenCalled();
    // expect(bindSocketEvents).toHaveBeenCalledWith(mockedSocket);
  });
});

describe('recreating the web socket', () => {
  test('tearing down the old web socket for failure cases', () => {

  });

  test('creating the new web socket', () => {

  });
});