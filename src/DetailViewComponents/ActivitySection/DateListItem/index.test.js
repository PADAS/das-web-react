import React from 'react';

import { format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';
import { render, screen } from '../../../test-utils';

import DateListItem from '.';

describe('ActivitySection - DateListItem', () => {
  const date = new Date('2022-06-06T21:58:48.248Z');

  const renderDateListItem = (props = {}) => render(
    <DateListItem date={date} title="Patrol Started" {...props} />
  );

  test('shows the title of the milestone', async () => {
    renderDateListItem();

    expect((await screen.findByText('Patrol Started'))).toBeInTheDocument();
  });

  test('shows the date both formatted for reading and machine readable', async () => {
    renderDateListItem();

    const time = await screen.findByTestId(`activitySection-dateTime-${date.getTime()}`);

    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('dateTime', date.toISOString());
    expect(time).toHaveTextContent(format(date, STANDARD_DATE_FORMAT));
  });

  test('parses a date given as a string', async () => {
    renderDateListItem({ date: date.toISOString() });

    expect((await screen.findByTestId(`activitySection-dateTime-${date.getTime()}`)))
      .toHaveAttribute('dateTime', date.toISOString());
  });

  test('shows the title alone when there is no date', async () => {
    renderDateListItem({ date: null });

    expect((await screen.findByText('Patrol Started'))).toBeInTheDocument();
    expect((screen.queryByRole('time'))).toBeNull();
    expect(document.querySelector('time')).toBeNull();
  });

  test('shows the title alone when the date cannot be parsed', async () => {
    renderDateListItem({ date: 'not a date' });

    expect((await screen.findByText('Patrol Started'))).toBeInTheDocument();
    expect(document.querySelector('time')).toBeNull();
  });

  test('renders a row that screen readers announce as a list item, with a decorative icon', async () => {
    renderDateListItem();

    const listItem = (await screen.findByText('Patrol Started')).closest('li');

    expect(listItem).toBeInTheDocument();
    expect((await screen.findByTestId('dateListItem-icon'))).toHaveAttribute('aria-hidden', 'true');
  });

  test('does not render a link when the row has none', async () => {
    renderDateListItem();

    expect((await screen.findByText('Patrol Started'))).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  test('renders a named link to what the row stands for', async () => {
    renderDateListItem({ link: { label: 'View leg 1', to: '/patrols/123/legs/456' } });

    expect((await screen.findByRole('link', { name: 'View leg 1' })))
      .toHaveAttribute('href', '/patrols/123/legs/456');
  });
});
