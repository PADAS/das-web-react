import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';

import { MapContext } from '../App';
import { mockStore } from '../__test-helpers/MockStore';
import { createMapMock } from '../__test-helpers/mocks';
import { staticSubjectFeature, subjectFeatureWithOneDeviceProp } from '../__test-helpers/fixtures/subjects';
import { getSubjectDefaultDeviceProperty } from '../utils/subjects';

import SubjectListItem from './SubjectListItem';

let map;
const store= {
  view: {
    subjectTrackState: {
      pinned: [], visible: []
    },
    heatmapSubjectIDs: []
  },
  data: { tracks: {} }
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

describe('Rendering static sensor items', () => {
  beforeEach(async () => {
    map = createMapMock();
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <SubjectListItem map={map} {...staticSubjectFeature.properties}/>
      </MapContext.Provider>
    </Provider>);
  });

  test('it should show the subject name followed with the feature default property', async () => {
    const subjectTitle = screen.getByTestId('subject-item-name');
    const defaultSubjectProperty = getSubjectDefaultDeviceProperty(staticSubjectFeature);

    const subjectName = staticSubjectFeature.properties.name;
    const defaultSubjectPropertyLabel = `${defaultSubjectProperty.label}: ${defaultSubjectProperty.value} ${defaultSubjectProperty.units}`;

    expect(subjectTitle.textContent).toEqual(`${subjectName}${defaultSubjectPropertyLabel}`);
  });
});

describe('Rendering mobile subject items', () => {
  beforeEach(async () => {
    map = createMapMock();
    render(<Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <SubjectListItem map={map} {...subjectFeatureWithOneDeviceProp.properties}/>
      </MapContext.Provider>
    </Provider>);
  });

  test('it should show the subject name without a feature default property', async () => {
    const subjectName = screen.getByTestId('subject-item-name');
    const defaultSubjectProperty = getSubjectDefaultDeviceProperty(subjectFeatureWithOneDeviceProp);

    expect(subjectName.textContent).toEqual(subjectFeatureWithOneDeviceProp.properties.name);
    expect(defaultSubjectProperty).toMatchObject({});
  });
});