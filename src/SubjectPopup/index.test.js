import React from 'react';
import userEvent from '@testing-library/user-event';

import { Provider, useSelector }  from 'react-redux';

import { GPS_FORMATS } from '../utils/location';

import { subjectFeatureWithMultipleDeviceProps, subjectFeatureWithOneDeviceProp, staticSubjectFeature } from '../__test-helpers/fixtures/subjects';

import { getSubjectDefaultDeviceProperty } from '../utils/subjects';
import { render, screen } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';

import SubjectPopup from './';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));


describe('SubjectPopup', () => {
  let renderWithWrapper, Wrapper, state;
  beforeEach(() => {
    state = {
      data: {
        eventFilter: {
          filter: {
            date_range: {
              lower: null,
              upper: null,
            },
          },
        },
        tracks: {},
      },
      view: {
        featureFlagOverrides: {},
        heatmapSubjectIDs: [],
        timeSliderState: {
          active: false,
          virtualDate: null,
        },
        trackLength: {
          origin: 'customLength',
          length: 21,
        },
        subjectTrackState: {
          visible: [],
          pinned: [],
        },
        patrolTrackState: {
          visible: [],
          pinned: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };

    useSelector.mockImplementation(selectorFn => selectorFn(state));

  });

  describe('generic popup', () => {
    beforeEach(() => {
      jest.spyOn(document, 'querySelector').mockImplementation(() => ({
        clientHeight: 1000,
        clientWidth: 1000,
      }));

      /* eslint-disable-next-line react/display-name */
      Wrapper = ({ children }) => <Provider store={mockStore(state)}>{children}</Provider>;

      renderWithWrapper = (Component) => render(Component, { wrapper: Wrapper });

      renderWithWrapper(<SubjectPopup data={subjectFeatureWithMultipleDeviceProps} />);
    });

    test('showing the subject name', () => {
      expect(screen.getByText('RD-001')).toBeInTheDocument();
    });

    test('toggling multiple device properties', async () => {
      const additionalPropsToggleBtn = await screen.getByTestId('additional-props-toggle-btn');

      userEvent.click(additionalPropsToggleBtn);

      const additionalProps = await screen.findByTestId('additional-props');
      const deviceStatusProps = subjectFeatureWithMultipleDeviceProps.properties.device_status_properties;

      deviceStatusProps.forEach(({ label, value }) => {
        if (label.length) expect(additionalProps).toHaveTextContent(label);
        if (value.length) expect(additionalProps).toHaveTextContent(value);
      });

      userEvent.click(additionalPropsToggleBtn);
      expect(additionalProps).not.toBeInTheDocument();
    });

    test('listing individual device properties', async () => {
      renderWithWrapper(<SubjectPopup data={subjectFeatureWithOneDeviceProp} />);

      const [statusProp] = subjectFeatureWithOneDeviceProp.properties.device_status_properties;
      const additionalProps = await screen.getByTestId('additional-props');

      expect(additionalProps).toHaveTextContent(statusProp.label);
      expect(additionalProps).toHaveTextContent(statusProp.units);
      expect(additionalProps).toHaveTextContent(statusProp.value);
    });

    test('render additional props with boolean values', async () => {
      renderWithWrapper(<SubjectPopup data={subjectFeatureWithOneDeviceProp} />);

      const additionalPropsValues = await screen.findAllByTestId('additional-props-value');
      expect(additionalPropsValues[1]).toHaveTextContent('false');
    });
  });

  describe('Stationary Subjects popup', () => {
    const defaultSubjectProperty = getSubjectDefaultDeviceProperty(staticSubjectFeature);
    const defaultSubjectValue = `${defaultSubjectProperty.value} ${defaultSubjectProperty.units}`;
    staticSubjectFeature.properties.default_status_value = defaultSubjectValue;

    beforeEach(() => {
      renderWithWrapper(<SubjectPopup data={staticSubjectFeature} />);
    });

    test('render default featured property for stationary subjects', async () => {
      const defaultStatusElement = await screen.findByTestId('header-default-status-property');

      expect(defaultStatusElement).toBeDefined();
      expect(defaultStatusElement).toHaveTextContent(defaultSubjectValue);
    });

  });
});
