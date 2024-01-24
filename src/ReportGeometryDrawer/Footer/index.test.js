import React from 'react';
import userEvent from '@testing-library/user-event';

import Footer from './';
import { render, screen } from '../../test-utils';

describe('Footer', () => {
  const onCancel = jest.fn(), onSave = jest.fn();
  let rerender;
  beforeEach(() => {
    ({ rerender } = render(<Footer isDrawing={false} isGeometryAValidPolygon onCancel={onCancel} onSave={onSave} />));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onCancel when canceling the geometry', async () => {
    expect(onCancel).toHaveBeenCalledTimes(0);

    const cancelButton = await screen.findByText('Cancel');
    userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('triggers onSave when saving the geometry', async () => {
    expect(onSave).toHaveBeenCalledTimes(0);

    const saveButton = await screen.findByText('Save');
    userEvent.click(saveButton);

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('shows the save button tooltip if it is disabled', async () => {
    rerender(<Footer isDrawing isGeometryAValidPolygon onCancel={onCancel} onSave={onSave} />);

    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.findByRole('tooltip'))).toHaveTextContent('Only closed shapes can be saved');
  });

  test('shows the save button tooltip if polygon is not valid', async () => {
    rerender(<Footer isDrawing={false} isGeometryAValidPolygon={false} onCancel={onCancel} onSave={onSave} />);

    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.findByRole('tooltip'))).toHaveTextContent('Segments of the shape cannot intersect');
  });

  test('does not show the save button tooltip if there is a valid closed polygon', async () => {
    rerender(<Footer isDrawing={false} isGeometryAValidPolygon onCancel={onCancel} onSave={onSave} />);

    expect((await screen.queryByRole('tooltip'))).toBeNull();

    const saveButton = await screen.findByText('Save');
    userEvent.hover(saveButton);

    expect((await screen.queryByRole('tooltip'))).toBeNull();
  });
});
