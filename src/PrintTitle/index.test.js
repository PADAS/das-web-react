import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import PrintTitle from './PrintTitle';

// Mock matchMedia function to simulate print media
beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation(query => {
    return {
      matches: query === 'print',
      media: query,
      onchange: null,
      addListener: jest.fn(),  // deprecated
      removeListener: jest.fn(),  // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });
});

const mockStore = configureStore([]);

const renderWithRedux = (state) => {
  const store = mockStore(state);
  return render(
    <Provider store={store}>
      <PrintTitle />
    </Provider>
  );
};

test('PrintTitle is visible only when media is set to print', () => {
  const initialState = {
    view: {
      printTitle: 'Test Print Title',
      homeMap: {
        icon: {
          src: 'test-icon-src.png'
        }
      }
    }
  };

  // Initial render, default media is not print
  renderWithRedux(initialState);
  expect(screen.queryByText('Test Print Title')).not.toBeVisible();

  // Simulate print media
  window.matchMedia = jest.fn().mockImplementation(query => {
    return {
      matches: query === 'print',
      media: query,
      onchange: null,
      addListener: jest.fn(),  // deprecated
      removeListener: jest.fn(),  // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });

  // Re-render and verify visibility in print mode
  renderWithRedux(initialState);
  expect(screen.getByText('Test Print Title')).toBeVisible();
});
