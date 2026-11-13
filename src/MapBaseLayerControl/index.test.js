import { Provider } from 'react-redux';
import ReactGA4 from 'react-ga4';
import userEvent from '@testing-library/user-event';

import esriLogoSrc from '../common/images/icons/esri-logo.svg?url';
import { fireEvent, render, screen } from '../test-utils';
import { mockStore } from '../__test-helpers/MockStore';
import { setBaseLayer } from '../ducks/layers';

import MapBaseLayerControl from './';

jest.mock('react-ga4', () => ({ __esModule: true, default: { event: jest.fn() } }));

const buildLayer = (id, name, attributes) => ({ attributes, id, name });

describe('MapBaseLayerControl', () => {
  let customIconLayer, esriLayer, mapboxLayer, store, tileLayer;

  const getLayerButton = (name) => screen.getByRole('button', { name: new RegExp(`${name}$`) });

  const openPopover = async () => await userEvent.click(screen.getByRole('button', { name: 'Set Map Base Layer' }));

  const renderMapBaseLayerControl = (baseLayers, currentBaseLayer = null) => {
    store = mockStore({ data: { baseLayers }, view: { currentBaseLayer } });

    return render(<Provider store={store}><MapBaseLayerControl /></Provider>);
  };

  beforeEach(() => {
    customIconLayer = buildLayer('custom', 'Custom Icon', {
      icon_url: 'https://example.com/custom.png',
      type: 'tile_server',
    });
    esriLayer = buildLayer('esri', 'ESRI Satellite', {
      icon_url: 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/images/esri-logo-color.png',
      type: 'tile_server',
    });
    mapboxLayer = buildLayer('mapbox', 'Mapbox Streets', { type: 'mapbox_style' });
    tileLayer = buildLayer('tile', 'Custom Tiles', { type: 'tile_server' });
  });

  test('does not show the layer list until the button is clicked', () => {
    renderMapBaseLayerControl([tileLayer]);

    expect(screen.queryByRole('button', { name: /Custom Tiles$/ })).not.toBeInTheDocument();
  });

  test('shows the list of base layers when clicking the button', async () => {
    renderMapBaseLayerControl([mapboxLayer, tileLayer]);

    await openPopover();

    expect(getLayerButton('Mapbox Streets')).toBeVisible();
    expect(getLayerButton('Custom Tiles')).toBeVisible();
  });

  test('tracks the click on the button', async () => {
    renderMapBaseLayerControl([tileLayer]);

    expect(ReactGA4.event).not.toHaveBeenCalled();

    await openPopover();

    expect(ReactGA4.event).toHaveBeenCalledWith({
      action: 'Click Base Layer button',
      category: 'Map Interaction',
      label: null,
    });
  });

  test('does not list layers with an unsupported source type', async () => {
    renderMapBaseLayerControl([tileLayer, buildLayer('google', 'Google Maps', { type: 'google_map' })]);

    await openPopover();

    expect(getLayerButton('Custom Tiles')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Google Maps$/ })).not.toBeInTheDocument();
  });

  test('closes the popover when pressing Escape', async () => {
    renderMapBaseLayerControl([tileLayer]);

    await openPopover();

    expect(getLayerButton('Custom Tiles')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: /Custom Tiles$/ })).not.toBeInTheDocument();
  });

  test('closes the popover when clicking outside of it', async () => {
    renderMapBaseLayerControl([tileLayer]);

    await openPopover();

    expect(getLayerButton('Custom Tiles')).toBeVisible();

    await userEvent.click(document.body);

    expect(screen.queryByRole('button', { name: /Custom Tiles$/ })).not.toBeInTheDocument();
  });

  test('sets the base layer and tracks the selection when clicking a layer', async () => {
    renderMapBaseLayerControl([mapboxLayer, tileLayer]);

    await openPopover();

    expect(store.getActions()).toEqual([]);

    await userEvent.click(getLayerButton('Custom Tiles'));

    expect(store.getActions()).toEqual([setBaseLayer(tileLayer)]);
    expect(ReactGA4.event).toHaveBeenCalledWith({
      action: 'Select \'Custom Tiles\' Base Layer',
      category: 'Base Layer',
      label: null,
    });
  });

  test('marks the current base layer as active', async () => {
    renderMapBaseLayerControl([mapboxLayer, tileLayer], tileLayer);

    await openPopover();

    expect(getLayerButton('Custom Tiles')).toHaveClass('active');
    expect(getLayerButton('Mapbox Streets')).not.toHaveClass('active');
  });

  describe('layer logos', () => {
    test('shows the stored icon url when the layer defines one', async () => {
      renderMapBaseLayerControl([customIconLayer]);

      await openPopover();

      expect(screen.getByRole('img', { name: 'Custom Icon logo' })).toHaveAttribute(
        'src',
        'https://example.com/custom.png'
      );
    });

    test('keeps the stored icon url of an Esri layer when it loads', async () => {
      renderMapBaseLayerControl([esriLayer]);

      await openPopover();

      expect(screen.getByRole('img', { name: 'ESRI Satellite logo' })).toHaveAttribute(
        'src',
        esriLayer.attributes.icon_url
      );
    });

    test('shows the bundled Esri logo when the icon url of an Esri layer fails to load', async () => {
      renderMapBaseLayerControl([esriLayer]);

      await openPopover();
      fireEvent.error(screen.getByRole('img', { name: 'ESRI Satellite logo' }));

      expect(screen.getByRole('img', { name: 'ESRI Satellite logo' })).toHaveAttribute('src', esriLogoSrc);
    });

    test('detects Esri layers by their icon url when the name does not mention Esri', async () => {
      renderMapBaseLayerControl([
        buildLayer('esri-url', 'Satellite', {
          icon_url: 'https://cdn.worldvectorlogo.com/logos/esri-3.svg',
          type: 'tile_server',
        }),
      ]);

      await openPopover();
      fireEvent.error(screen.getByRole('img', { name: 'Satellite logo' }));

      expect(screen.getByRole('img', { name: 'Satellite logo' })).toHaveAttribute('src', esriLogoSrc);
    });

    test('does not treat names that merely contain esri inside a word as Esri layers', async () => {
      renderMapBaseLayerControl([
        buildLayer('lookalike', 'Jesrin Tiles', { icon_url: 'https://example.com/gone.png', type: 'tile_server' }),
      ]);

      await openPopover();
      fireEvent.error(screen.getByRole('img', { name: 'Jesrin Tiles logo' }));

      expect(screen.getByRole('img', { name: 'Jesrin Tiles logo' })).toHaveAttribute('src', 'generic-globe-logo.png');
    });

    test('shows the generic globe logo when the icon url of a tile layer fails to load', async () => {
      renderMapBaseLayerControl([customIconLayer]);

      await openPopover();
      fireEvent.error(screen.getByRole('img', { name: 'Custom Icon logo' }));

      expect(screen.getByRole('img', { name: 'Custom Icon logo' })).toHaveAttribute('src', 'generic-globe-logo.png');
    });

    test('keeps the default logo when it fails to load too', async () => {
      renderMapBaseLayerControl([customIconLayer]);

      await openPopover();
      fireEvent.error(screen.getByRole('img', { name: 'Custom Icon logo' }));
      fireEvent.error(screen.getByRole('img', { name: 'Custom Icon logo' }));

      expect(screen.getByRole('img', { name: 'Custom Icon logo' })).toHaveAttribute('src', 'generic-globe-logo.png');
    });

    test('shows the Mapbox logo for mapbox style layers', async () => {
      renderMapBaseLayerControl([mapboxLayer]);

      await openPopover();

      expect(screen.getByRole('img', { name: 'Mapbox Streets logo' })).toHaveAttribute('src', 'mapbox-logo.png');
    });

    test('shows the generic globe logo for tile layers without an icon url', async () => {
      renderMapBaseLayerControl([tileLayer]);

      await openPopover();

      expect(screen.getByRole('img', { name: 'Custom Tiles logo' })).toHaveAttribute('src', 'generic-globe-logo.png');
    });

    test('names the logo of the default layer, which has no name, after its translated name', async () => {
      renderMapBaseLayerControl([
        { attributes: { type: 'mapbox_style' }, id: 'default', nameKey: 'defaultMapLayerName' },
      ]);

      await openPopover();

      expect(screen.getByRole('img', { name: 'EarthRanger Terrain Map logo' })).toHaveAttribute(
        'src',
        'mapbox-logo.png'
      );
    });
  });
});
