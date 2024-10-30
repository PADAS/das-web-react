import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import PrintTitle from './';

//Mock matchMedia function to simulate print media
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

test('PrintTitle is not visible if not present on the store', () => {
  const printTitle = 'Test Print Title';
  const initialState = {
    view: {
      printTitle: '',
      homeMap: {
        icon: {
          src: 'test-icon-src.png'
        }
      }
    }
  };

  renderWithRedux(initialState);

  expect(screen.queryByText(printTitle)).not.toBeInTheDocument();
});
