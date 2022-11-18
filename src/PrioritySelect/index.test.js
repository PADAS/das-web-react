import React from 'react';
import PrioritySelect from './';
import { REPORT_PRIORITIES } from '../constants';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


describe('PrioritySelect', () => {
  const initialProps = {
    onChange: () => {},
    placeholder: 'select priority'
  };
  const renderPrioritySelect = ({ onChange, placeholder } = initialProps) => (
    render(<PrioritySelect onChange={onChange} placeholder={placeholder} />)
  );

  it('should render all report priority levels', () => {
    renderPrioritySelect();
    const list = screen.getByText(initialProps.placeholder);
    userEvent.click(list);
    REPORT_PRIORITIES.forEach(({ display }) => expect( screen.getByText(display) ).toBeInTheDocument());
  });

  it('should return selected priority level', () => {
    const [ highLevel ] = REPORT_PRIORITIES;
    const { display, value } = highLevel;
    const onChange = jest.fn(({ value: selectedValue }) => {
      expect(selectedValue).toBe(value);
    });
    renderPrioritySelect({ ...initialProps, onChange });
    const list = screen.getByText(initialProps.placeholder);
    userEvent.click(list);
    const option = screen.getByText(display);
    userEvent.click(option);
    expect(onChange).toHaveBeenCalled();
  });

});