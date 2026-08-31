import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../../../__test-helpers/MockStore';
import patrolTypes, { dogPatrol, routinePatrol } from '../../../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../../../test-utils';
import { TrackerContext } from '../../../../utils/analytics';

import PatrolTypeField from './';

jest.mock('../../../../SvgIcon', () => jest.fn(() => null));

describe('SideBar - PatrolsManager - LegForm - PatrolTypeField', () => {
  const onChange = jest.fn();
  const tracker = { track: jest.fn() };

  const renderPatrolTypeField = (props) => render(
    <Provider store={mockStore({ data: { patrolTypes } })}>
      <TrackerContext.Provider value={tracker}>
        <PatrolTypeField onChange={onChange} patrolType={dogPatrol} {...props} />
      </TrackerContext.Provider>
    </Provider>
  );

  const openMenu = () => userEvent.type(screen.getByRole('combobox', { name: 'Patrol Type' }), '{arrowdown}');

  test('shows the selected patrol type', () => {
    renderPatrolTypeField();

    expect(screen.getByText('Dog Patrol')).toBeVisible();
  });

  test('prompts for a patrol type when none is selected', () => {
    renderPatrolTypeField({ patrolType: null });

    expect(screen.getByText('Select a patrol type')).toBeVisible();
  });

  test('does not show the options until the user opens the menu', async () => {
    renderPatrolTypeField();

    expect(screen.queryByRole('option')).toBeNull();

    await openMenu();

    expect(screen.getByRole('option', { name: 'Dog Patrol' })).toBeVisible();
  });

  test('only offers the active patrol types', async () => {
    renderPatrolTypeField();

    await openMenu();

    expect(screen.getByRole('option', { name: 'Dog Patrol' })).toBeVisible();
    expect(screen.queryByRole('option', { name: 'The Don Patrol' })).toBeNull();
  });

  test('marks the selected patrol type as selected', async () => {
    renderPatrolTypeField();

    await openMenu();

    expect(screen.getByRole('option', { name: 'Dog Patrol' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Routine Patrol' })).toHaveAttribute('aria-selected', 'false');
  });

  test('reports the patrol type the user picks', async () => {
    renderPatrolTypeField();

    await openMenu();
    await userEvent.click(screen.getByRole('option', { name: 'Routine Patrol' }));

    expect(onChange).toHaveBeenCalledWith(routinePatrol);
  });

  test('does not let the user leave the leg without a patrol type', async () => {
    renderPatrolTypeField();

    await userEvent.type(screen.getByRole('combobox', { name: 'Patrol Type' }), '{backspace}');

    expect(onChange).not.toHaveBeenCalled();
  });
});
