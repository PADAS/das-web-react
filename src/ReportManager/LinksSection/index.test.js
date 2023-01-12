import React from 'react';
import { render, screen } from '@testing-library/react';
import LinksSection from './index';

describe('LinksSection', () => {
  const initialProps = {
    linkedReportsInfo: [],
    patrolsInfo: [],
    onReportLinkClicked: () => {},
    onPatrolLinkClicked: () => {}
  };
  const renderLinksSection = ({ linkedReportsInfo, patrolsInfo, onReportLinkClicked, onPatrolLinkClicked } = initialProps) => render(
    <LinksSection
        linkedReportsInfo={linkedReportsInfo}
        patrolsInfo={patrolsInfo}
        onReportLinkClicked={onReportLinkClicked}
        onPatrolLinkClicked={onPatrolLinkClicked}
    />
  );

  it('renders properly with initial props', () => {
    renderLinksSection();
    expect(screen.getByText('Links')).toBeInTheDocument();
  });
});
