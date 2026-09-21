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

  const clickToOpenMenu = () => userEvent.click(screen.getByRole('combobox', { name: 'Team' }));

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

  test('focuses the selected option when the menu opens', async () => {
    renderSelect({ value: OPTIONS[1] });

    await clickToOpenMenu();

    expect(screen.getByRole('combobox', { name: 'Team' }))
      .toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bravo' }).id);
  });

  test('focuses the selected option when the menu opens for a value equal to an option', async () => {
    renderSelect({ value: { ...OPTIONS[1] } });

    await clickToOpenMenu();

    expect(screen.getByRole('combobox', { name: 'Team' }))
      .toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bravo' }).id);
  });

  test('focuses the selected option of a select that labels its options on its own', async () => {
    const namedOptions = [{ id: 'alpha', name: 'Alpha' }, { id: 'bravo', name: 'Bravo' }];

    renderSelect({
      getOptionLabel: ({ name }) => name,
      getOptionValue: ({ id }) => id,
      options: namedOptions,
      value: { id: 'bravo', name: 'Bravo' },
    });

    await clickToOpenMenu();

    expect(screen.getByRole('combobox', { name: 'Team' }))
      .toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bravo' }).id);
  });

  test('keeps the keyboard on the option the user moved to while taking several values', async () => {
    renderSelect({ isMulti: true, value: [{ ...OPTIONS[0] }] });

    await clickToOpenMenu();
    await userEvent.keyboard('{arrowdown}');

    expect(screen.getByRole('combobox', { name: 'Team' }))
      .toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Bravo' }).id);
  });

  test('marks the selected option as selected', async () => {
    renderSelect({ value: OPTIONS[1] });

    await clickToOpenMenu();

    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: 'Bravo' })).toHaveAttribute('aria-selected', 'true');
  });

  test('keeps a value the options no longer carry', () => {
    renderSelect({ value: { label: 'Charlie', value: 'charlie' } });

    expect(screen.getByText('Charlie')).toBeVisible();
  });

  test('tells the user when there is nothing to pick', async () => {
    renderSelect({ options: [] });

    await openMenu();

    expect(screen.getByText('No options to display')).toBeVisible();
  });
});
