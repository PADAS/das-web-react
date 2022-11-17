import React from 'react';
import PrioritySelect from './';
import { REPORT_PRIORITIES } from '../constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('PrioritySelect', () => {

  const renderPrioritySelect = (onChange = () => {}) => (
    render(<PrioritySelect onChange={onChange} />)
  );

  it('should render all report priority levels', () => {
    renderPrioritySelect();
    const list = screen.getByRole('textbox');
    userEvent.click(list);
    REPORT_PRIORITIES.forEach(({ display }) => expect( screen.getByText(display) ).toBeInTheDocument());
  });

  it('should return selected priority level', () => {
    const [ highLevel ] = REPORT_PRIORITIES;
    const { display, value } = highLevel;
    const onChange = jest.fn(({ value: selectedValue }) => expect(selectedValue).toBe(value));
    renderPrioritySelect({ onChange });
    const list = screen.getByRole('textbox');
    userEvent.click(list);
    const option = screen.getByText(display);
    userEvent.click(option);
    expect(onChange).toHaveBeenCalled();
  });

});