import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReactComponent as BulletListIcon } from '../../common/images/icons/bullet-list.svg';
import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import QuickLinks, { QuickLinksContext } from './';

describe('ReportDetailView - QuickLinks', () => {
  test('renders the anchors and sections', async () => {
    render(
      <QuickLinks>
        <QuickLinks.NavigationBar>
          <QuickLinks.Anchor anchorTitle="quicklink1" iconComponent={<BulletListIcon />} />

          <QuickLinks.Anchor anchorTitle="quicklink2" iconComponent={<PencilWritingIcon />} />
        </QuickLinks.NavigationBar>

        <QuickLinks.SectionsWrapper>
          <QuickLinks.Section anchorTitle="quicklink1">
            <div>Section 1</div>
          </QuickLinks.Section>

          <QuickLinks.Section anchorTitle="quicklink2">
            <div>Section 2</div>
          </QuickLinks.Section>
        </QuickLinks.SectionsWrapper>
      </QuickLinks>
    );

    expect((await screen.findByTestId('reportDetailView-quickLinks-anchor-quicklink1'))).toBeDefined();
    expect((await screen.findByTestId('reportDetailView-quickLinks-anchor-quicklink2'))).toBeDefined();
    expect((await screen.findByTestId('reportDetailView-quickLinks-section-quicklink1'))).toBeDefined();
    expect((await screen.findByTestId('reportDetailView-quickLinks-section-quicklink2'))).toBeDefined();
  });

  test('does not render a quicklink that does not have a corresponding section', async () => {
    render(
      <QuickLinks>
        <QuickLinks.NavigationBar>
          <QuickLinks.Anchor anchorTitle="quicklink1" iconComponent={<BulletListIcon />} />

          <QuickLinks.Anchor anchorTitle="quicklink2" iconComponent={<PencilWritingIcon />} />
        </QuickLinks.NavigationBar>

        <QuickLinks.SectionsWrapper>
          <QuickLinks.Section anchorTitle="quicklink1">
            <div>Section 1</div>
          </QuickLinks.Section>
        </QuickLinks.SectionsWrapper>
      </QuickLinks>
    );

    expect((await screen.queryByTestId('reportDetailView-quickLinks-anchor-quicklink2'))).toBeNull();
  });

  describe('QuickLinks.Anchor', () => {
    test('triggers onClickAnchor', async () => {
      const getSectionElement = jest.fn(() => true), onClickAnchor= jest.fn();
      render(
        <QuickLinksContext.Provider value={{ getSectionElement, onClickAnchor }}>
          <QuickLinks.Anchor anchorTitle="anchor1" iconComponent={<BulletListIcon />} />
        </QuickLinksContext.Provider>
      );

      expect(onClickAnchor).toHaveBeenCalledTimes(0);

      const anchor = await screen.queryByTestId('reportDetailView-quickLinks-anchor-anchor1');
      userEvent.click(anchor);

      expect(onClickAnchor).toHaveBeenCalledTimes(1);
      expect(onClickAnchor).toHaveBeenCalledWith('anchor1');
    });
  });

  describe('QuickLinks.Section', () => {
    test('triggers onSectionElementChange', async () => {
      const getSectionElement = jest.fn(), onSectionElementChange= jest.fn();
      render(
        <QuickLinksContext.Provider value={{ getSectionElement, onSectionElementChange }}>
          <QuickLinks.Section anchorTitle="section1" />
        </QuickLinksContext.Provider>
      );

      expect(onSectionElementChange).toHaveBeenCalled();
      expect(onSectionElementChange.mock.calls[0][0]).toBe('section1');
    });

    test('does not render the section if hidden prop is set', async () => {
      const getSectionElement = jest.fn(), onSectionElementChange= jest.fn();
      render(
        <QuickLinksContext.Provider value={{ getSectionElement, onSectionElementChange }}>
          <QuickLinks.Section anchorTitle="section1" hidden />
        </QuickLinksContext.Provider>
      );

      expect((await screen.queryByTestId('reportDetailView-quickLinks-section-section1'))).toBeNull();
    });
  });
});
