import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../__test-helpers/MockStore';


import { eventSchemas } from '../__test-helpers/fixtures/event-schemas';
import { subjectStore } from '../__test-helpers/fixtures/subjects';

import ReportedBySelect from './';

describe('ReportedBySelect', () => {
  let store, Wrapper;

  const renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

  beforeEach(() => {
    store = {
      data: {
        eventSchemas,
        subjectStore,
      }
    };
    Wrapper = ({ children }) => <Provider store={mockStore(store)}>{children}</Provider>; /* eslint-disable-line react/display-name */
  });

  test('displaying the current selection', async () => {
    renderWithWrapper(<ReportedBySelect value={{ id: '9ec20ec8-516c-40bd-a4a3-9a2b49f5ea40' }} />);

    await screen.findByText('Informant');
  });

  test('listing reporters', async () => {
    const { container } = renderWithWrapper(<ReportedBySelect />);

    expect(screen.queryByText('Informant')).not.toBeInTheDocument();
    expect(screen.queryByText('Informant2')).not.toBeInTheDocument();


    const selectControlContainer = container.querySelector('input');

    expect(screen.getByText('Reported By...')).toBeInTheDocument();

    selectControlContainer.focus();
    userEvent.type(selectControlContainer, '{arrowdown}');

    await waitFor(() => {
      expect(screen.getByText('Informant')).toBeInTheDocument();
      expect(screen.getByText('Informant2')).toBeInTheDocument();
    });
  });

  test('selecting a reporter', async () => {
    const onChange = jest.fn();

    const { container } = renderWithWrapper(<ReportedBySelect onChange={onChange} />);

    const selectControlContainer = container.querySelector('input');

    selectControlContainer.focus();
    userEvent.type(selectControlContainer, '{arrowdown}');

    const toClick = await screen.findByText('Informant2');
    toClick.click();

    expect(onChange).toHaveBeenCalled();
  });
});
