import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';

import IconTooltip from './';

describe('IconTooltip', () => {
  const renderIconTooltip = (props) => render(<IconTooltip
    data-testid="icon-button"
    title="Tooltip title"
    {...props}
  />);

  it('assigns a custom classname to the icon button', () => {
    renderIconTooltip({ className: 'className' });

    expect(screen.getByTestId('icon-button')).toHaveClass('className');
  });

  it('assigns the id to a sr-only paragraph with the title', () => {
    renderIconTooltip({ id: 'tooltip' });

    const srOnlyParagraph = screen.getByRole('paragraph');

    expect(srOnlyParagraph).toHaveClass('sr-only');
    expect(srOnlyParagraph).toHaveAttribute('id', 'tooltip');
    expect(srOnlyParagraph).toHaveTextContent('Tooltip title');
  });

  it('shows the tooltip overlay when hovering the icon', async () => {
    renderIconTooltip();

    await userEvent.hover(screen.getByTestId('icon-button'));
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Tooltip title');
    expect(tooltip).toHaveAttribute('x-placement', 'bottom');
  });

  it('shows the tooltip overlay in a custom placement', async () => {
    renderIconTooltip({ placement: 'top' });

    await userEvent.hover(screen.getByTestId('icon-button'));
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Tooltip title');
    expect(tooltip).toHaveAttribute('x-placement', 'top');
  });
});
