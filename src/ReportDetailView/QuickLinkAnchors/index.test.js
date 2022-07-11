import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import QuickLinkAnchors from './';
import useOnScreen from '../../hooks/useOnScreen';

jest.mock('../../hooks/useOnScreen', () => jest.fn());

describe('ReportDetailView - QuickLinkAnchors', () => {
  const activitySectionElement = document.createElement('div');
  activitySectionElement.textContent = 'Activity anchor';
  const detailsSectionElement = document.createElement('div');
  detailsSectionElement.textContent = 'Details anchor';
  const historySectionElement = document.createElement('div');
  historySectionElement.textContent = 'History anchor';
  const onScrollToSection = jest.fn();

  let useOnScreenMock = jest.fn();
  beforeEach(() => {
    useOnScreenMock = jest.fn();
    useOnScreen.mockImplementation(useOnScreenMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers onScrollToSection when clicking the activity anchor', async () => {
    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect(onScrollToSection).toHaveBeenCalledTimes(0);

    const activityAnchor = await screen.findByTestId('reportDetailView-quickLinkAnchors-activityAnchor');
    userEvent.click(activityAnchor);

    expect(onScrollToSection).toHaveBeenCalledTimes(1);
    expect(onScrollToSection).toHaveBeenCalledWith(activitySectionElement);
  });

  test('triggers onScrollToSection when clicking the details anchor', async () => {
    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect(onScrollToSection).toHaveBeenCalledTimes(0);

    const detailsAnchor = await screen.findByTestId('reportDetailView-quickLinkAnchors-detailsAnchor');
    userEvent.click(detailsAnchor);

    expect(onScrollToSection).toHaveBeenCalledTimes(1);
    expect(onScrollToSection).toHaveBeenCalledWith(detailsSectionElement);
  });

  test('triggers onScrollToSection when clicking the history anchor', async () => {
    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect(onScrollToSection).toHaveBeenCalledTimes(0);

    const historyAnchor = await screen.findByTestId('reportDetailView-quickLinkAnchors-historyAnchor');
    userEvent.click(historyAnchor);

    expect(onScrollToSection).toHaveBeenCalledTimes(1);
    expect(onScrollToSection).toHaveBeenCalledWith(historySectionElement);
  });

  test('sets the activity anchor as the active one', async () => {
    useOnScreenMock = jest.fn((element) => element === activitySectionElement ? true : false);
    useOnScreen.mockImplementation(useOnScreenMock);

    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-activityAnchor')))
      .toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-detailsAnchor')))
      .not.toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-historyAnchor')))
      .not.toHaveClass('active');
  });

  test('sets the details anchor as the active one', async () => {
    useOnScreenMock = jest.fn((element) => element === detailsSectionElement ? true : false);
    useOnScreen.mockImplementation(useOnScreenMock);

    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-activityAnchor')))
      .not.toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-detailsAnchor')))
      .toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-historyAnchor')))
      .not.toHaveClass('active');
  });

  test('sets the history anchor as the active one', async () => {
    useOnScreenMock = jest.fn((element) => element === historySectionElement ? true : false);
    useOnScreen.mockImplementation(useOnScreenMock);

    render(<QuickLinkAnchors
      activitySectionElement={activitySectionElement}
      detailsSectionElement={detailsSectionElement}
      historySectionElement={historySectionElement}
      onScrollToSection={onScrollToSection}
    />);

    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-activityAnchor')))
      .not.toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-detailsAnchor')))
      .not.toHaveClass('active');
    expect((await screen.findByTestId('reportDetailView-quickLinkAnchors-historyAnchor')))
      .toHaveClass('active');
  });
});
