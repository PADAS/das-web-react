import React from 'react';
import PrioritySelect from './';
import { REPORT_PRIORITIES, REPORT_PRIORITY_HIGH } from '../constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


describe('PrioritySelect', () => {
  const selectedPriority = REPORT_PRIORITY_HIGH;
  const testId = `priority-select-${selectedPriority.display}`;
  const initialProps = {
    onChange: () => {},
    priority: selectedPriority.value
  };
  const renderPrioritySelect = ({ onChange, priority } = initialProps) => (
    render(<PrioritySelect onChange={onChange} priority={priority} />)
  );

  it('should render all report priority levels', () => {
    renderPrioritySelect();
    const list = screen.getByText(selectedPriority.display);
    userEvent.click(list);
    REPORT_PRIORITIES.forEach(({ display }) => {
      const currentTestId = `priority-select-${display}`;
      expect( screen.getByTestId(currentTestId) ).toBeInTheDocument();
    });
  });

  it('should return selected priority level', () => {
    const onChangePartialArgs = { action: 'select-option' };
    const [ highLevel ] = REPORT_PRIORITIES;
    const { display } = highLevel;
    const onChange = jest.fn();
    renderPrioritySelect({ ...initialProps, onChange });
    const list = screen.getByText(display);
    userEvent.click(list);
    expect(onChange).not.toHaveBeenCalled();
    const option = screen.getByTestId(testId);
    userEvent.click(option);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(highLevel, onChangePartialArgs);
  });

});