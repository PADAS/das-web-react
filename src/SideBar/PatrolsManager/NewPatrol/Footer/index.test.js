import React from 'react';

import { render, screen } from '../../../../test-utils';

import Footer from './';

describe('SideBar - PatrolsManager - NewPatrol - Footer', () => {
  const renderFooter = (props) => render(<Footer formId="legForm" isSaving={false} {...props} />);

  test('submits the leg form through the form attribute of its save button', () => {
    renderFooter();

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('form', 'legForm');
    expect(saveButton).toHaveAttribute('type', 'submit');
  });

  test('cancels back to the patrols feed', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', '/patrols');
  });

  test('shows the save button as busy while the patrol is being created', () => {
    renderFooter({ isSaving: true });

    const saveButton = screen.getByRole('button', { name: 'Loading' });

    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toBeDisabled();
  });
});
