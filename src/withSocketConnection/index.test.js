import React from 'react';

const WithSocketConnectionImports = jest.requireActual('../withSocketConnection');
const { default: WithSocketConnection } = WithSocketConnectionImports;

describe('initializing the web socket', () => {
  test('binding socket events', () => {});
});

describe('recreating the web socket', () => {
  test('tearing down the old web socket for failure cases', () => {});

  test('creating the new web socket', () => {});
});