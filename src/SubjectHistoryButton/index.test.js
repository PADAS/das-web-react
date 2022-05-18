import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react';

import SubjectHistoryButton from './';

const onClick = jest.fn();

test('rendering without crashing', () => {
  render(<SubjectHistoryButton onClick={onClick} />);
});

test('call onClick', () => {
  render(<SubjectHistoryButton onClick={onClick} />);
  waitFor(async () => {
    const toggleButton = await screen.getByRole('button');
    userEvent.click(toggleButton);
    expect(onClick).toHaveBeenCalled();
  });
});

describe('setting label visibility', () => {
  test('showing the label showLabel is true', () => {
    render(<SubjectHistoryButton onClick={onClick} showLabel={true}/>);
    expect(screen.getByText('Historical Data')).toBeTruthy();
  });


  test('not showing any label if showLabel is false', () => {
    render(<SubjectHistoryButton onClick={onClick} showLabel={false}/>);
    expect(() => screen.getByText('Historical Data')).toThrow();
  });
});