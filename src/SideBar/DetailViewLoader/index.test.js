import React from 'react';

import { render, screen } from '../../test-utils';

import DetailViewLoader from './';

describe('SideBar - DetailViewLoader', () => {
  test('announces what is loading', () => {
    render(<DetailViewLoader label="Loading event data" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading event data');
  });
});
