import React from 'react';

import { render, screen } from '../../../../../test-utils';

import Footer from './';

describe('SideBar - PatrolsManager - LegManager - NewLeg - Footer', () => {
  const renderFooter = (props) => render(
    <Footer formId="legForm" isSaving={false} patrolId="93485e1d-6804-459b-9243-1d239556bb48" {...props} />
  );

  test('submits the leg form through the form attribute of its save button', () => {
    renderFooter();

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('form', 'legForm');
    expect(saveButton).toHaveAttribute('type', 'submit');
  });

  test('cancels back to the patrol the leg belongs to', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Cancel' }))
      .toHaveAttribute('href', '/patrols/93485e1d-6804-459b-9243-1d239556bb48');
  });

  test('shows the save button as busy while the leg is being added', () => {
    renderFooter({ isSaving: true });

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toBeDisabled();
  });
});
