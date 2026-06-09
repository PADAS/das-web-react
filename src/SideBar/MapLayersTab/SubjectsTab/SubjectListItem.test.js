import React from 'react';
import { Provider } from 'react-redux';

import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import { createMapMock } from '../../../__test-helpers/mocks';
import { staticSubjectFeature, subjectFeatureWithOneDeviceProp } from '../../../__test-helpers/fixtures/subjects';
import { getSubjectDefaultDeviceProperty } from '../../../utils/subjects';
import { render, screen } from '../../../test-utils';

import SubjectListItem from './SubjectListItem';

let map;
const store= {
  data: { tracks: {} },
  view: {
    heatmapSubjectIDs: [],
    subjectTrackState: {
      pinned: [], visible: []
    },
    systemConfig: {},
  },
};

beforeEach(() => {
  map = createMapMock();
});

test('rendering without crashing', () => {
  render(<Provider store={mockStore(store)}>
    <MapContext.Provider value={map}>
      <SubjectListItem  map={map} {...staticSubjectFeature.properties}/>
    </MapContext.Provider>
  </Provider>);
});

describe('Rendering subject list item', () => {
  beforeEach(() => {
    map = createMapMock();
  });

  test('it should show the subject name followed with the feature default property if the subject has one', async () => {
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <SubjectListItem map={map} {...staticSubjectFeature.properties}/>
      </MapContext.Provider>
    </Provider>);

    const subjectTitle = screen.getByTestId('subject-item-name');
    const defaultSubjectProperty = getSubjectDefaultDeviceProperty(staticSubjectFeature);

    const subjectName = staticSubjectFeature.properties.name;
    const defaultSubjectPropertyLabel = `${defaultSubjectProperty.label}: ${defaultSubjectProperty.value} ${defaultSubjectProperty.units}`;

    expect(subjectTitle.textContent).toEqual(` ${subjectName} ${defaultSubjectPropertyLabel}`);
  });

  test('it should not show the feature default property if the subject does not have one', async () => {
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <SubjectListItem map={map} {...subjectFeatureWithOneDeviceProp.properties}/>
      </MapContext.Provider>
    </Provider>);

    const subjectName = screen.getByTestId('subject-item-name');
    const defaultSubjectProperty = getSubjectDefaultDeviceProperty(subjectFeatureWithOneDeviceProp);

    expect(subjectName.textContent).toEqual(` ${subjectFeatureWithOneDeviceProp.properties.name} `);
    expect(defaultSubjectProperty).toMatchObject({});
  });
});