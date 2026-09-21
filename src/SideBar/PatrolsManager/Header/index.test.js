import React from 'react';

import { render, screen } from '../../../test-utils';

import Header from './';

describe('SideBar - PatrolsManager - Header', () => {
  const renderHeader = (props) => render(<Header
    crumbs={[{ label: 'Patrols', to: '/patrols' }, { label: 'Delta Patrol' }]}
    {...props}
  />);

  test('shows the breadcrumb of the route', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByText('Delta Patrol')).toHaveAttribute('aria-current', 'page');
  });

  test('closes the sidebar', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });

  test('shows the actions of the route before the close button', () => {
    renderHeader({ renderActions: () => <button type="button">Print</button> });

    const [firstAction, secondAction] = screen.getAllByRole('button');

    expect(firstAction).toHaveAccessibleName('Print');
    expect(secondAction).toBeUndefined();
  });

  test('does not show an actions group of its own when the route has no actions', () => {
    renderHeader();

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('shows the title bar of the route', () => {
    renderHeader({ renderTitleBar: () => <h1>Delta Patrol</h1> });

    expect(screen.getByRole('heading', { name: 'Delta Patrol' })).toBeVisible();
  });
});
