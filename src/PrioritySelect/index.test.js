import React from 'react';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';
import { REPORT_PRIORITIES, REPORT_PRIORITY_HIGH } from '../constants';

import PrioritySelect from './';

describe('PrioritySelect', () => {
  const selectedPriority = REPORT_PRIORITY_HIGH;
  const testId = `priority-select-${selectedPriority.key}`;
  const initialProps = {
    onChange: () => {},
    isDisabled: false,
    priority: selectedPriority.value
  };
  const renderPrioritySelect = ({ isDisabled, onChange, priority } = initialProps) => (
    render(<PrioritySelect isDisabled={isDisabled} onChange={onChange} priority={priority} />)
  );

  it('should render all report priority levels', async () => {
    renderPrioritySelect();
    const list = screen.getByText(selectedPriority.display);
    await userEvent.click(list);
    REPORT_PRIORITIES.forEach(({ key }) => {
      const currentTestId = `priority-select-${key}`;
      expect( screen.getByTestId(currentTestId) ).toBeInTheDocument();
    });
  });

  it('should return selected priority level', async () => {
    const onChangePartialArgs = { action: 'select-option' };
    const [ highLevel ] = REPORT_PRIORITIES;
    const { display } = highLevel;
    const onChange = jest.fn();
    renderPrioritySelect({ ...initialProps, onChange });
    const list = screen.getByText(display);
    await userEvent.click(list);
    expect(onChange).not.toHaveBeenCalled();
    const option = screen.getByTestId(testId);
    await userEvent.click(option);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(highLevel, onChangePartialArgs);
  });

  it('closes the menu when pressing escape', async () => {
    renderPrioritySelect();

    const list = screen.getByText(selectedPriority.display);
    await userEvent.click(list);

    await userEvent.keyboard('{Escape}');

    REPORT_PRIORITIES.forEach(({ key }) => {
      const currentTestId = `priority-select-${key}`;
      expect(screen.queryByTestId(currentTestId)).toBeNull();
    });
  });
});