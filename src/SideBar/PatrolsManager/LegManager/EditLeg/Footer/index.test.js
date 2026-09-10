import React from 'react';

import { render, screen } from '../../../../../test-utils';

import Footer from './';

describe('SideBar - PatrolsManager - LegManager - EditLeg - Footer', () => {
  const renderFooter = (props) => render(
    <Footer
      disableSaveButton={false}
      formId="legForm"
      isSaving={false}
      legId="76794b2f-cbb2-49ed-b0dd-9335ae471562"
      patrolId="93485e1d-6804-459b-9243-1d239556bb48"
      {...props}
    />
  );

  test('submits the leg form through the form attribute of its save button', () => {
    renderFooter();

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('form', 'legForm');
    expect(saveButton).toHaveAttribute('type', 'submit');
  });

  test('cancels back to the leg being edited', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      '/patrols/93485e1d-6804-459b-9243-1d239556bb48/legs/76794b2f-cbb2-49ed-b0dd-9335ae471562'
    );
  });

  test('disables the save button while the leg carries no change to save', () => {
    renderFooter({ disableSaveButton: true });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test('shows the save button as busy while the leg is being saved', () => {
    renderFooter({ isSaving: true });

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('aria-busy', 'true');
    expect(saveButton).toBeDisabled();
  });
});
