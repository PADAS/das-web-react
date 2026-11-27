import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { MapContext } from '../../../MapContext';
import { createMapMock } from '../../../__test-helpers/mocks';
import { mockStore } from '../../../__test-helpers/MockStore';
import { act, render, screen } from '../../../test-utils';

import FeatureListItem from './FeatureListItem';

describe('SideBar - MapLayersTab - FeaturesTab - FeatureListItem', () => {
  let map, store;
  beforeEach(() => {
    map = createMapMock();
    map.queryRenderedFeatures.mockReturnValue([]);
    store = mockStore({ data: {}, view: {} });
  });

  const renderFeatureListItem = (props = {}) => render(<Provider store={store}>
    <MapContext.Provider value={map}>
      <FeatureListItem bounds={[0, 0, 1, 1]} id="feature-1" name="Northern Fence" {...props} />
    </MapContext.Provider>
  </Provider>);

  test('shows the icon of the feature geometry beside its name', () => {
    renderFeatureListItem({ geometry_type: 'MultiLineString' });

    expect(screen.getByText('Northern Fence')).toContainElement(screen.getByTestId('featureGeometryIcon-lineIcon'));
  });

  test.each([null, undefined])('does not show a geometry icon when the geometry type is %s', (geometryType) => {
    renderFeatureListItem({ geometry_type: geometryType });

    expect(screen.getByText('Northern Fence')).toBeVisible();
    expect(screen.queryByTestId(/^featureGeometryIcon-/)).toBeNull();
  });

  describe('jumping to the feature', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const jumpToFeature = async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderFeatureListItem({ geometry_type: 'Polygon' });

      await user.click(screen.getByRole('button', { name: 'Jump to this location' }));

      act(() => jest.advanceTimersByTime(1200));
    };

    test('fits the map to the feature bounds', async () => {
      await jumpToFeature();

      expect(map.fitBounds).toHaveBeenCalledWith([0, 0, 1, 1], expect.objectContaining({ maxZoom: 16, minZoom: 5 }));
    });

    test('opens the feature popup at the center of its bounds, with the geometry type of the feature', async () => {
      await jumpToFeature();

      expect(store.getActions()).toContainEqual({
        payload: {
          data: {
            coordinates: [0.5, 0.5],
            geometryType: 'Polygon',
            properties: { id: 'feature-1', name: 'Northern Fence' },
          },
          type: 'feature-symbol',
        },
        type: 'SHOW_POPUP',
      });
    });
  });
});
