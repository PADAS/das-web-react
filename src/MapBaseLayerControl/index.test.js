import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { setBaseLayer } from '../ducks/layers';
import { mockTrack } from '../utils/analytics';
import esriLogoSrc from '../common/images/icons/esri-logo.svg';

import MapBaseLayerControl from '.';

jest.mock('../ducks/layers', () => ({
  ...jest.requireActual('../ducks/layers'),
  setBaseLayer: jest.fn(),
}));

// The component builds its trackers at import time, so the shared track mock has to live inside the factory
jest.mock('../utils/analytics', () => {
  const mockTrack = jest.fn();

  return {
    ...jest.requireActual('../utils/analytics'),
    mockTrack,
    trackEventFactory: jest.fn(() => ({ track: mockTrack })),
  };
});

const CDN_ICON_URL = 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/assets/images/esri-logo-color.png';

const buildLayer = (id, name, attributes) => ({ id, name, attributes });

describe('MapBaseLayerControl', () => {
  let store;

  const mapboxLayer = buildLayer('mapbox', 'Mapbox Streets', { type: 'mapbox_style' });
  const tileLayer = buildLayer('tile', 'Custom Tiles', { type: 'tile_server' });
  const esriLayer = buildLayer('esri', 'ESRI Satellite', { type: 'tile_server', icon_url: CDN_ICON_URL });
  const customIconLayer = buildLayer('custom', 'Custom Icon', {
    type: 'tile_server',
    icon_url: 'https://example.com/custom.png',
  });

  const renderControl = (baseLayers = [], currentBaseLayer = null) => {
    store = mockStore({ data: { baseLayers }, view: { currentBaseLayer } });

    return render(<Provider store={store}><MapBaseLayerControl /></Provider>);
  };

  const openPopover = async () => await userEvent.click(screen.getByRole('button', { name: 'Set Map Base Layer' }));

  beforeEach(() => {
    setBaseLayer.mockImplementation((layer) => ({ type: 'SET_BASE_LAYER', payload: layer }));
  });

  test('does not show the layer list until the button is clicked', () => {
    renderControl([tileLayer]);

    expect(screen.queryByText('Custom Tiles')).toBeNull();
  });

  test('shows the list of base layers when clicking the button', async () => {
    renderControl([mapboxLayer, tileLayer]);

    await openPopover();

    expect(screen.getByText('Mapbox Streets')).toBeVisible();
    expect(screen.getByText('Custom Tiles')).toBeVisible();
  });

  test('tracks the click on the button', async () => {
    renderControl([tileLayer]);

    await openPopover();

    expect(mockTrack).toHaveBeenCalledWith('Click Base Layer button');
  });

  test('does not list layers with an unsupported source type', async () => {
    renderControl([tileLayer, buildLayer('google', 'Google Maps', { type: 'google_map' })]);

    await openPopover();

    expect(screen.getByText('Custom Tiles')).toBeVisible();
    expect(screen.queryByText('Google Maps')).toBeNull();
  });

  test('closes the popover when pressing Escape', async () => {
    renderControl([tileLayer]);

    await openPopover();
    expect(screen.getByText('Custom Tiles')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByText('Custom Tiles')).toBeNull();
  });

  test('closes the popover when clicking outside of it', async () => {
    renderControl([tileLayer]);

    await openPopover();
    expect(screen.getByText('Custom Tiles')).toBeVisible();

    await userEvent.click(document.body);

    expect(screen.queryByText('Custom Tiles')).toBeNull();
  });

  test('sets the base layer and tracks the selection when clicking a layer', async () => {
    renderControl([mapboxLayer, tileLayer]);

    await openPopover();
    await userEvent.click(screen.getByText('Custom Tiles'));

    expect(setBaseLayer).toHaveBeenCalledTimes(1);
    expect(setBaseLayer).toHaveBeenCalledWith(tileLayer);
    expect(store.getActions()).toEqual([{ type: 'SET_BASE_LAYER', payload: tileLayer }]);
    expect(mockTrack).toHaveBeenCalledWith('Select \'Custom Tiles\' Base Layer');
  });

  test('marks the current base layer as active', async () => {
    renderControl([mapboxLayer, tileLayer], tileLayer);

    await openPopover();

    expect(screen.getByText('Custom Tiles').closest('button')).toHaveClass('active');
    expect(screen.getByText('Mapbox Streets').closest('button')).not.toHaveClass('active');
  });

  describe('layer logos', () => {
    test('uses the bundled Esri logo instead of the stored icon url for Esri layers', async () => {
      renderControl([esriLayer]);

      await openPopover();

      const logo = screen.getByAltText('ESRI Satellite logo');
      expect(logo).toHaveAttribute('src', esriLogoSrc);
      expect(logo.getAttribute('src')).not.toContain('cloudfront');
    });

    test('detects Esri layers by their icon url when the name does not mention Esri', async () => {
      renderControl([buildLayer('esri-url', 'Satellite', {
        type: 'tile_server',
        icon_url: 'https://cdn.worldvectorlogo.com/logos/esri-3.svg',
      })]);

      await openPopover();

      expect(screen.getByAltText('Satellite logo')).toHaveAttribute('src', esriLogoSrc);
    });

    test('does not treat names that merely contain "esri" inside a word as Esri layers', async () => {
      renderControl([buildLayer('lookalike', 'Jesrin Tiles', { type: 'tile_server' })]);

      await openPopover();

      expect(screen.getByAltText('Jesrin Tiles logo')).toHaveAttribute('src', 'generic-globe-logo.png');
    });

    test('renders the default layer, which has no name, with the Mapbox logo', async () => {
      renderControl([{ id: 'default', nameKey: 'defaultMapLayerName', attributes: { type: 'mapbox_style' } }]);

      await openPopover();

      expect(screen.getByText('EarthRanger Terrain Map')).toBeVisible();
      expect(screen.getByRole('img')).toHaveAttribute('src', 'mapbox-logo.png');
    });

    test('uses the icon url for non-Esri layers that define one', async () => {
      renderControl([customIconLayer]);

      await openPopover();

      expect(screen.getByAltText('Custom Icon logo')).toHaveAttribute('src', 'https://example.com/custom.png');
    });

    test('uses the Mapbox logo for mapbox style layers', async () => {
      renderControl([mapboxLayer]);

      await openPopover();

      expect(screen.getByAltText('Mapbox Streets logo')).toHaveAttribute('src', 'mapbox-logo.png');
    });

    test('uses the generic globe logo for tile layers without an icon url', async () => {
      renderControl([tileLayer]);

      await openPopover();

      expect(screen.getByAltText('Custom Tiles logo')).toHaveAttribute('src', 'generic-globe-logo.png');
    });
  });
});
