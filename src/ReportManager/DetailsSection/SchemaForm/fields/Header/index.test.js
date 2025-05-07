import React from 'react';

import { render, screen } from '../../../../../test-utils';
import { HEADER_ELEMENT_SIZES } from '../../../../../utils/v2-event-schemas/constants';

import Header from './';

import * as styles from './styles.module.scss';

describe('ReportManager - DetailsSection - SchemaForm - fields - Header', () => {

  const headerDetails = {
    size: HEADER_ELEMENT_SIZES.LARGE,
    label: 'A great header'
  };

  const initialProps = {
    details: headerDetails,
    id: 'header-1',
  };

  const renderHeader = (props = initialProps) => render(
    <Header {...props}/>
  );

  test('Display a proper large header', () => {
    renderHeader();
    const header = screen.getByText(headerDetails.label);
    expect( header ).toBeVisible();
    expect( header ).toHaveClass(styles.large);
  });

  test('Display a proper medium header', () => {
    renderHeader({
      ...initialProps,
      details: {
        ...headerDetails,
        size: HEADER_ELEMENT_SIZES.MEDIUM
      }
    });
    const header = screen.getByText(headerDetails.label);
    expect( header ).toBeVisible();
    expect( header ).toHaveClass(styles.medium);
  });

  test('Display a proper small header', () => {
    renderHeader({
      ...initialProps,
      details: {
        ...headerDetails,
        size: HEADER_ELEMENT_SIZES.SMALL
      }
    });
    const header = screen.getByText(headerDetails.label);
    expect( header ).toBeVisible();
    expect( header ).toHaveClass(styles.small);
  });

});
