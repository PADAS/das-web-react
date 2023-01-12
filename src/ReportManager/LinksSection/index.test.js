import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import LinksSection from './index';
import { activePatrol, readyToStartPatrol } from '../../__test-helpers/fixtures/patrols';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { Provider } from 'react-redux';
import patrolTypes from '../../__test-helpers/fixtures/patrol-types';
import { mockStore } from '../../__test-helpers/MockStore';
import { eventTypes } from '../../__test-helpers/fixtures/event-types';

describe('LinksSection', () => {

  const store = mockStore({
    view: {
      timeSliderState: {
        active: false,
      }
    },
    data: {
      patrolTypes,
      eventTypes,
      tracks: {},
    }
  });

  const initialProps = {
    linkedReportsInfo: [activePatrol],
    patrolsInfo: [readyToStartPatrol],
    onReportLinkClicked: () => {},
    onPatrolLinkClicked: () => {}
  };

  const renderLinksSection = ({ linkedReportsInfo, patrolsInfo, onReportLinkClicked, onPatrolLinkClicked } = initialProps) => render(
    <Provider store={store}>
      <NavigationWrapper>
        <LinksSection
                linkedReportsInfo={linkedReportsInfo}
                patrolsInfo={patrolsInfo}
                onReportLinkClicked={onReportLinkClicked}
                onPatrolLinkClicked={onPatrolLinkClicked}
            />
      </NavigationWrapper>
    </Provider>
  );

  it('renders correctly with initial props', () => {
    const { title: titleReport, serial_number: serialNumberReport } = activePatrol;
    const { title: titlePatrol, serial_number: serialNumberPatrol } = readyToStartPatrol;
    renderLinksSection();

    expect(screen.getByText('Links')).toBeInTheDocument();
    expect(screen.getByText(titleReport)).toBeInTheDocument();
    expect(screen.getByText(serialNumberReport)).toBeInTheDocument();
    expect(screen.getByText(titlePatrol)).toBeInTheDocument();
    expect(screen.getByText(serialNumberPatrol)).toBeInTheDocument();
  });

  it('it handles onClick events properly', () => {
    const onReportLinkClicked = jest.fn();
    const onPatrolLinkClicked = jest.fn();
    renderLinksSection({ ...initialProps, onReportLinkClicked, onPatrolLinkClicked });

    fireEvent.click( screen.getByText(activePatrol.title) );
    fireEvent.click( screen.getByText(readyToStartPatrol.title) );

    expect(onReportLinkClicked).toHaveBeenCalledTimes(1);
    expect(onPatrolLinkClicked).toHaveBeenCalledTimes(1);
  });
});
