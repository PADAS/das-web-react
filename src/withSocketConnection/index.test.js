import React from 'react';
import { render } from '@testing-library/react';

import { mockedSocket } from '../__test-helpers/MockSocketContext';
import * as socketExports from '../socket';

const WithSocketConnectionImports = jest.requireActual('../withSocketConnection');

jest.spyOn(socketExports, 'createSocket').mockReturnValue(mockedSocket);
jest.spyOn(socketExports, 'bindSocketEvents').mockReturnValue(mockedSocket);
jest.spyOn(socketExports, 'unbindSocketEvents').mockReturnValue(mockedSocket);


const { default: WithSocketConnection } = WithSocketConnectionImports;

describe('initializing the web socket', () => {
  test('binding socket events', () => {
    // render(<WithSocketConnection>
    //   <div>Hello there</div>
    // </WithSocketConnection>
    // );

    // expect(socketExports.createSocket).toHaveBeenCalled();
    // expect(socketExports.bindSocketEvents).toHaveBeenCalledWith(mockedSocket);
  });
});

describe('recreating the web socket', () => {
  test('tearing down the old web socket for failure cases', () => {

  });

  test('creating the new web socket', () => {

  });
});