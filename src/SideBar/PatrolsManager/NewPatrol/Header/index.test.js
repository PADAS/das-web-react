import React, { useState } from 'react';
import userEvent from '@testing-library/user-event';

import { dogPatrol } from '../../../../__test-helpers/fixtures/patrol-types';
import { render, screen } from '../../../../test-utils';

import Header from './';

jest.mock('../../../../SvgIcon', () => jest.fn(() => null));

describe('SideBar - PatrolsManager - NewPatrol - Header', () => {
  const onChangeTitle = jest.fn();

  const ControlledHeader = ({ patrolType }) => {
    const [editedTitle, setEditedTitle] = useState(null);

    const title = editedTitle ?? patrolType.display;

    return <Header
      isTitleDirty={editedTitle !== null && editedTitle.trim() !== patrolType.display}
      onChangeTitle={(newTitle) => {
        onChangeTitle(newTitle);
        setEditedTitle(newTitle);
      }}
      patrolType={patrolType}
      title={title}
    />;
  };

  const renderHeader = () => render(<ControlledHeader patrolType={dogPatrol} />);

  const getSubtitle = () => screen.queryByText('Dog Patrol', { selector: 'p' });

  test('shows the breadcrumb of the route', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByText('New Patrol')).toHaveAttribute('aria-current', 'page');
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });

  test('shows the patrol as new', () => {
    renderHeader();

    expect(screen.getByText('New')).toBeVisible();
  });

  test('shows the patrol type icon in the color of a new patrol', () => {
    renderHeader();

    expect(screen.getByTestId('newPatrolHeader-icon')).toHaveClass('new');
  });

  test('does not repeat the patrol type below a title that is the patrol type', () => {
    renderHeader();

    expect(getSubtitle()).toBeNull();
  });

  test('shows the patrol type below a title of its own', async () => {
    renderHeader();

    await userEvent.type(screen.getByRole('textbox', { name: 'Patrol title' }), '!');

    expect(getSubtitle()).toBeVisible();
  });

  test('reports the title the user types', async () => {
    renderHeader();

    await userEvent.type(screen.getByRole('textbox', { name: 'Patrol title' }), '!');

    expect(onChangeTitle).toHaveBeenCalledWith('Dog Patrol!');
  });

  test('shows the title as unsaved once it differs from the patrol type name', async () => {
    renderHeader();

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).not.toHaveClass('unsaved');

    await userEvent.type(screen.getByRole('textbox', { name: 'Patrol title' }), '!');

    expect(screen.getByRole('textbox', { name: 'Patrol title' })).toHaveClass('unsaved');
  });
});
