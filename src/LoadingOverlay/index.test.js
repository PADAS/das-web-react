import React from 'react';

import { render, screen } from '../test-utils';

import LoadingOverlay from './';

describe('LoadingOverlay', () => {
  test('shows the message given by the caller', async () => {
    render(<LoadingOverlay message="Loading something" />);

    expect(screen.getByText('Loading something')).toBeVisible();
  });

  test('renders the children given by the caller', async () => {
    render(<LoadingOverlay message="Loading something">
      <button type="button">Cancel</button>
    </LoadingOverlay>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('gives the id of the message to children rendered as a function', async () => {
    render(<LoadingOverlay message="Loading something">
      {({ messageId }) => <button aria-describedby={messageId} type="button">Cancel</button>}
    </LoadingOverlay>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAccessibleDescription('Loading something');
  });
});
