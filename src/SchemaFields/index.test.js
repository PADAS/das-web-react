import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ExternalLinkField } from './';

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