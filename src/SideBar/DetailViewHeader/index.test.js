import React from 'react';

import { render, screen } from '../../test-utils';

import DetailViewHeader from './';

describe('SideBar - DetailViewHeader', () => {
  const renderDetailViewHeader = (props) => render(<DetailViewHeader
    breadcrumbLabel="Patrol navigation"
    crumbs={[{ label: 'Patrols', to: '/patrols' }, { label: 'Delta Patrol' }]}
    {...props}
  />);

  test('shows the breadcrumb of the route', () => {
    renderDetailViewHeader();

    expect(screen.getByRole('link', { name: 'Patrols' })).toHaveAttribute('href', '/patrols');
    expect(screen.getByText('Delta Patrol')).toHaveAttribute('aria-current', 'page');
  });

  test('labels the breadcrumb navigation', () => {
    renderDetailViewHeader();

    expect(screen.getByRole('navigation', { name: 'Patrol navigation' })).toBeVisible();
  });

  test('closes the sidebar', () => {
    renderDetailViewHeader();

    expect(screen.getByRole('link', { name: 'Close sidebar' })).toHaveAttribute('href', '/');
  });

  test('shows the actions of the route before the close button', () => {
    renderDetailViewHeader({ renderActions: () => <button type="button">Print</button> });

    const [firstAction, secondAction] = screen.getAllByRole('button');

    expect(firstAction).toHaveAccessibleName('Print');
    expect(secondAction).toBeUndefined();
  });

  test('does not show an actions group of its own when the route has no actions', () => {
    renderDetailViewHeader();

    expect(screen.queryByRole('button')).toBeNull();
  });

  test('shows the title bar of the route', () => {
    renderDetailViewHeader({ renderTitleBar: () => <h1>Delta Patrol</h1> });

    expect(screen.getByRole('heading', { name: 'Delta Patrol' })).toBeVisible();
  });

  test('shows only the title bar when the route has no top bar', () => {
    renderDetailViewHeader({ hasTopBar: false, renderTitleBar: () => <h1>Delta Patrol</h1> });

    expect(screen.getByRole('heading', { name: 'Delta Patrol' })).toBeVisible();
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Close sidebar' })).toBeNull();
  });
});
