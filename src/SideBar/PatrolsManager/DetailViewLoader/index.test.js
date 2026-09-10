import React from 'react';

import { render, screen } from '../../../test-utils';

import DetailViewLoader from './';

describe('SideBar - PatrolsManager - DetailViewLoader', () => {
  test('announces that the patrol data is loading', () => {
    render(<DetailViewLoader />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading patrol data');
  });
});
