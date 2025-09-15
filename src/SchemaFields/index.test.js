import React from 'react';
import userEvent from '@testing-library/user-event';

import { DateTimeWidget, ExternalLinkField } from './';
import { render, screen, within } from '../test-utils';

describe('the ExternalLinkField field',  () => {
  beforeEach(() => {
    render(
      <ExternalLinkField
        formData='https://testing-this-neat-thing.biz'
          idSchema={{ id: 'link-1' }}
          schema={{ title: 'here is your great link' }}
        />
    );
  });
  test('rendering a label', async  () => {
    const label = await screen.getByTestId('schema-link-label-link-1');

    expect(label).toHaveTextContent('here is your great link');
  });

  test('rendering a link', async () => {
    const link = await screen.getByTestId('schema-link-link-1');
    expect(link).toHaveAttribute('href', 'https://testing-this-neat-thing.biz');
  });
});

describe('DateTimeWidget', () => {
  let props;
  beforeEach(() => {
    props = {
      autofocus: false,
      disabled: false,
      formData: '2020-01-01T00:00:00+00:00',
      idSchema: '1234',
      onBlur: jest.fn(),
      onChange: jest.fn(),
      onFocus: jest.fn(),
      readonly: false,
      required: false,
      schema: { title: 'Date Time Widget' },
    };
  });

  test('shows the * character in the label if the field is required', async () => {
    props.required = true;
    render(<DateTimeWidget {...props} />);

    expect((await screen.findByText('Date Time Widget*'))).toBeDefined();
  });

  test('does not show the * character in the label if the field is not required', async () => {
    render(<DateTimeWidget {...props} />);

    expect((await screen.queryByText('Date Time Widget*'))).toBeNull();
    expect((await screen.findByText('Date Time Widget'))).toBeDefined();
  });

  test.skip('triggers the onChange callback when changing the date', async () => {
    render(<DateTimeWidget {...props} />);

    expect(props.onChange).toHaveBeenCalledTimes(0);

    const datePickerOpenCalendarButton = await screen.findByLabelText('Open calendar');
    await userEvent.click(datePickerOpenCalendarButton);
    const options = await screen.findAllByRole('option');
    await userEvent.click(options[16]);

    expect(props.onChange).toHaveBeenCalled();
  });

  test('triggers the onChange callback when changing the time', async () => {
    render(<DateTimeWidget {...props} />);

    expect(props.onChange).toHaveBeenCalledTimes(0);

    const timePickerOpenOptionsButton = await screen.findByLabelText('Open time options');
    await userEvent.click(timePickerOpenOptionsButton);
    const optionsList = await screen.findByTestId('timePicker-OptionsList');
    const timeOptionsListItems = await within(optionsList).findAllByRole('option');
    await userEvent.click(timeOptionsListItems[2]);

    expect(props.onChange).toHaveBeenCalled();
  });
});
