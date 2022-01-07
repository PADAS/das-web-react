

import React from 'react';
import { Provider } from 'react-redux';

import { DrawersContext } from '../DrawersLayer';
import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';
import { subjectFeatureWithMultipleDeviceProps, subjectFeatureWithOneDeviceProp } from '../__test-helpers/fixtures/subjects';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GPS_FORMATS } from '../utils/location';

import SubjectPopup from './';

const store = mockStore({
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
});

describe('SubjectPopup', () => {
  let map;
  beforeEach(() => {
    jest.spyOn(document, 'querySelector').mockImplementation(() => ({
      clientHeight: 1000,
      clientWidth: 1000,
    }));

    map = createMapMock();
    render(
      <DrawersContext.Provider value={{}}>
        <Provider store={store}>
          <SubjectPopup data={subjectFeatureWithMultipleDeviceProps} map={map} />
        </Provider>
      </DrawersContext.Provider>
    );
  });

  describe('the popup', () => {
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
      render(
        <DrawersContext.Provider value={{}}>
          <Provider store={store}>
            <SubjectPopup data={subjectFeatureWithOneDeviceProp} />
          </Provider>
        </DrawersContext.Provider>
      );

      const [statusProp] = subjectFeatureWithOneDeviceProp.properties.device_status_properties;
      const additionalProps = await screen.getByTestId('additional-props');

      expect(additionalProps).toHaveTextContent(statusProp.label);
      expect(additionalProps).toHaveTextContent(statusProp.units);
      expect(additionalProps).toHaveTextContent(statusProp.value);
    });

    test('render additional props with boolean values', async () => {
      render(
        <DrawersContext.Provider value={{}}>
          <Provider store={store}>
            <SubjectPopup data={subjectFeatureWithOneDeviceProp} />
          </Provider>
        </DrawersContext.Provider>
      );

      const additionalPropsValues = await screen.findAllByTestId('additional-props-value');
      expect(additionalPropsValues[1]).toHaveTextContent('false');
    });
  });
});
