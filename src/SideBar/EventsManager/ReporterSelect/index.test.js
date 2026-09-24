import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';

import ReporterSelect from './';

jest.mock('../../../SvgIcon', () => () => null);

describe('SideBar - EventsManager - ReporterSelect', () => {
  let onChange, store;

  beforeEach(() => {
    onChange = jest.fn();

    store = {
      data: {
        eventSchemas: {
          globalSchema: {
            properties: {
              reported_by: {
                enum_ext: [
                  { value: { content_type: 'observations.subject', id: 'ranger', name: 'Canek' } },
                  { value: { content_type: 'accounts.user', first_name: 'Ana', id: 'ana', last_name: 'Ruiz' } },
                  { value: { content_type: 'accounts.user', first_name: '', id: 'bo', last_name: '', username: 'bo' } },
                  { value: { hidden: true, id: 'hidden' } },
                ],
              },
            },
          },
        },
        subjectStore: {},
      },
    };
  });

  const renderReporterSelect = (props = {}) => render(<Provider store={mockStore(store)}>
    <label htmlFor="reporter">Reported By</label>

    <ReporterSelect inputId="reporter" onChange={onChange} {...props} />
  </Provider>);

  const openMenu = () => userEvent.click(screen.getByRole('combobox', { name: 'Reported By' }));

  test('lists the reporters the user may see, by name or else by username', async () => {
    renderReporterSelect();

    await openMenu();

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Canek', 'Ana Ruiz', 'bo']);
  });

  test('offers the recent radios first, in a group of their own', async () => {
    store.data.subjectStore = {
      ranger: {
        id: 'ranger',
        last_position_date: new Date(Date.now() - 60000).toISOString(),
        name: 'Canek',
        subject_subtype: 'ranger',
      },
    };

    renderReporterSelect();

    await openMenu();

    expect(screen.getByText('Recent radios')).toBeVisible();
    expect(screen.getByText('All')).toBeVisible();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Canek', 'Ana Ruiz', 'bo']);
  });

  test('shows a reporter the user may not see as restricted', () => {
    renderReporterSelect({ value: { hidden: true, id: 'hidden' } });

    expect(screen.getByText('RESTRICTED')).toBeVisible();
  });

  test('reports the reporter the user picks', async () => {
    renderReporterSelect();

    await openMenu();
    await userEvent.click(screen.getByRole('option', { name: 'Ana Ruiz' }));

    expect(onChange.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 'ana' }));
  });
});
