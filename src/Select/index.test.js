import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import Select from './';

describe('Select', () => {
  const onChange = jest.fn();

  const OPTIONS = [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Bravo', value: 'bravo' },
  ];

  const renderSelect = (props) => render(<>
    <label htmlFor="team">Team</label>

    <Select inputId="team" onChange={onChange} options={OPTIONS} value={null} {...props} />
  </>);

  const openMenu = () => userEvent.type(screen.getByRole('combobox', { name: 'Team' }), '{arrowdown}');

  test('offers the options it is given', async () => {
    renderSelect();

    await openMenu();

    expect(screen.getByRole('option', { name: 'Alpha' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Bravo' })).toBeVisible();
  });

  test('reports the option the user picks', async () => {
    renderSelect();

    await openMenu();
    await userEvent.click(screen.getByRole('option', { name: 'Bravo' }));

    expect(onChange).toHaveBeenCalledWith(OPTIONS[1], expect.anything());
  });

  test('lets the user clear the value', async () => {
    renderSelect({ value: OPTIONS[0] });

    await userEvent.type(screen.getByRole('combobox', { name: 'Team' }), '{backspace}');

    expect(onChange).toHaveBeenCalledWith(null, expect.anything());
  });

  test('reports every option the user picks when it takes several', async () => {
    renderSelect({ isMulti: true, value: [OPTIONS[0]] });

    await openMenu();
    await userEvent.click(screen.getByRole('option', { name: 'Bravo' }));

    expect(onChange).toHaveBeenCalledWith(OPTIONS, expect.anything());
  });

  test('tells the user when there is nothing to pick', async () => {
    renderSelect({ options: [] });

    await openMenu();

    expect(screen.getByText('No options to display')).toBeVisible();
  });
});
