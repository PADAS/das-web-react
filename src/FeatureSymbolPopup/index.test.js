import { useEffect } from 'react';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { http, HttpResponse } from 'msw/http';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { thunk } from 'redux-thunk';

import { FEATURE_API_URL, featureStoreReducer } from '../ducks/features';
import { GPS_FORMATS } from '../utils/location';
import { hidePopup } from '../ducks/popup';
import { render, screen, waitFor, within } from '../test-utils';

import AddItemButton from '../AddItemButton';

import FeatureSymbolPopup from './';

jest.mock('../AddItemButton', () => jest.fn());

jest.mock('../ducks/popup', () => ({
  ...jest.requireActual('../ducks/popup'),
  hidePopup: jest.fn(),
}));

const FEATURE_ID = 'feature-1';
const FEATURE_PROPERTIES = { id: FEATURE_ID, name: 'Water Point' };
const VIEW_STATE = {
  coordinateReferenceSystems: {
    selectedCoordinateRepresentations: Object.values(GPS_FORMATS),
    storedSystems: [],
  },
  userPreferences: {
    gpsFormat: GPS_FORMATS.DEG,
  },
};

const buildFeatureResponse = (attributes) => ({
  data: {
    features: [{
      geometry: null,
      id: FEATURE_ID,
      properties: { ...FEATURE_PROPERTIES, attributes },
      type: 'Feature',
    }],
    type: 'FeatureCollection',
  },
});

let featureHandler;
let requestedFeatureIds;

const server = setupServer(
  http.get(`${FEATURE_API_URL}:featureId/`, (info) => {
    requestedFeatureIds.push(info.params.featureId);

    return featureHandler(info);
  }),
);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());

describe('FeatureSymbolPopup', () => {
  let AddItemButtonMock, hidePopupMock, store;
  beforeEach(() => {
    AddItemButtonMock = jest.fn(() => <button data-testid="addItemButton-button" type="button" />);
    AddItemButton.mockImplementation(AddItemButtonMock);
    hidePopupMock = jest.fn(() => () => {});
    hidePopup.mockImplementation(hidePopupMock);

    featureHandler = () => HttpResponse.json(buildFeatureResponse({}));
    requestedFeatureIds = [];

    store = createStore(
      combineReducers({ data: combineReducers({ featureStore: featureStoreReducer }), view: () => VIEW_STATE }),
      applyMiddleware(thunk)
    );
  });

  const waitForFeatureResponse = async () => {
    await waitFor(() => expect(store.getState().data.featureStore[FEATURE_ID]?.isLoading).toBeUndefined());
  };

  const renderFeatureSymbolPopup = (data = {}) => render(<Provider store={store}>
    <FeatureSymbolPopup
      data={{
        coordinates: [0, 0],
        geometryType: 'Point',
        properties: { name: 'Water Point' },
        ...data,
      }}
      id="123"
    />
  </Provider>);

  test('shows the coordinates the popup opened at', () => {
    renderFeatureSymbolPopup({ coordinates: [10, 20], geometryType: 'LineString' });

    expect(screen.getByText('20.000000°, 10.000000°')).toBeVisible();
  });

  test('creates events at the coordinates the popup opened at', () => {
    renderFeatureSymbolPopup({ coordinates: [10, 20], geometryType: 'LineString' });

    expect(AddItemButtonMock.mock.calls.at(-1)[0].reportData).toEqual({ location: { latitude: 20, longitude: 10 } });
  });

  test.each([
    ['Point', 'point'],
    ['MultiPoint', 'point'],
    ['LineString', 'line'],
    ['MultiLineString', 'line'],
    ['Polygon', 'polygon'],
    ['MultiPolygon', 'polygon'],
  ])('shows the %s geometry type as a %s icon beside the feature name', (geometryType, shape) => {
    renderFeatureSymbolPopup({ geometryType });

    const heading = screen.getByRole('heading', { name: 'Water Point' });

    expect(within(heading).getByTestId(`featureGeometryIcon-${shape}Icon`)).toHaveAttribute('aria-hidden', 'true');
  });

  test('shows the geometry type icon before the feature has loaded', async () => {
    renderFeatureSymbolPopup({ geometryType: 'Polygon', properties: FEATURE_PROPERTIES });

    expect(screen.getByRole('status')).toHaveTextContent('Loading attributes…');
    expect(within(screen.getByRole('heading', { name: 'Water Point' })).getByTestId('featureGeometryIcon-polygonIcon'))
      .toBeInTheDocument();

    await waitForFeatureResponse();
  });

  test('does not show a geometry icon without a geometry type', async () => {
    renderFeatureSymbolPopup({ geometryType: undefined, properties: FEATURE_PROPERTIES });

    await screen.findByRole('heading', { name: 'Water Point' });
    await waitForFeatureResponse();

    expect(screen.queryByTestId(/^featureGeometryIcon-/)).toBeNull();
  });

  test('hides the popup once the addition of a report completes', async () => {
    AddItemButtonMock = ({ formProps }) => { /* eslint-disable-line react/display-name */
      useEffect(() => {
        formProps.onSaveSuccess();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null;
    };
    AddItemButton.mockImplementation(AddItemButtonMock);

    expect(hidePopup).toHaveBeenCalledTimes(0);

    renderFeatureSymbolPopup();

    expect(hidePopup).toHaveBeenCalledTimes(1);
  });

  test('shows a loading status while the attributes load', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({ status: 'Open' }));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    expect(screen.getByRole('status')).toHaveTextContent('Loading attributes…');

    expect(await screen.findByRole('region', { name: 'Feature attributes' })).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
    expect(requestedFeatureIds).toEqual([FEATURE_ID]);
  });

  test('shows the attributes of a feature opened before without requesting it again', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({ status: 'Open' }));

    const { unmount } = renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    await screen.findByRole('region', { name: 'Feature attributes' });
    unmount();

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    expect(screen.getByRole('region', { name: 'Feature attributes' })).toBeVisible();
    expect(screen.queryByRole('status')).toBeNull();
    expect(requestedFeatureIds).toEqual([FEATURE_ID]);
  });

  test('shows each attribute of the feature as a term and its value', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({
      capacity: 2500,
      isSeasonal: false,
      material: 'Concrete',
      notes: '',
      owner: null,
      rangers: ['Amina', 'Joseph'],
      survey: { year: 2024 },
    }));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    const attributesRegion = await screen.findByRole('region', { name: 'Feature attributes' });
    const terms = Array.from(attributesRegion.querySelectorAll('dt')).map((term) => term.textContent);
    const definitions = Array.from(attributesRegion.querySelectorAll('dd')).map((definition) => definition.textContent);

    expect(terms).toEqual(['capacity', 'isSeasonal', 'material', 'notes', 'owner', 'rangers', 'survey']);
    expect(definitions).toEqual(['2500', 'No', 'Concrete', '—', '—', 'Amina, Joseph', '{\n  "year": 2024\n}']);
  });

  test('groups each attribute term with its value in a row of the list', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({ material: 'Concrete', status: 'Open' }));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    const attributesRegion = await screen.findByRole('region', { name: 'Feature attributes' });
    const rows = Array.from(attributesRegion.querySelector('dl').children);

    expect(rows.map((row) => row.tagName)).toEqual(['DIV', 'DIV']);
    expect(rows.map((row) => Array.from(row.children).map((child) => child.textContent))).toEqual([
      ['material', 'Concrete'],
      ['status', 'Open'],
    ]);
  });

  test('gives nested attribute values a row layout of their own', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({
      rangers: ['Amina', 'Joseph'],
      status: 'Open',
      survey: { year: 2024 },
    }));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    const attributesRegion = await screen.findByRole('region', { name: 'Feature attributes' });
    const rows = Array.from(attributesRegion.querySelector('dl').children);

    expect(rows[0]).not.toHaveClass('structured');
    expect(rows[1]).not.toHaveClass('structured');
    expect(rows[2]).toHaveClass('structured');
  });

  test('shows true attributes as yes', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse({ isSeasonal: true }));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    expect(await screen.findByText('Yes')).toBeVisible();
  });

  test('does not show the attributes of a feature without any', async () => {
    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    await waitForFeatureResponse();

    expect(screen.queryByRole('region', { name: 'Feature attributes' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('does not show attributes that are not a key and value dictionary', async () => {
    featureHandler = () => HttpResponse.json(buildFeatureResponse(['Open']));

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    await waitForFeatureResponse();

    expect(screen.queryByRole('region', { name: 'Feature attributes' })).toBeNull();
  });

  test('announces when the attributes could not be loaded', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    featureHandler = () => new HttpResponse(null, { status: 500 });

    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    expect(await screen.findByText('Could not load the feature\'s attributes.')).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('region', { name: 'Feature attributes' })).toBeNull();
    expect(screen.getByTestId('addItemButton-button')).toBeInTheDocument();
  });

  test('requests the attributes again when a feature that failed to load is opened again', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    featureHandler = () => new HttpResponse(null, { status: 500 });

    const { unmount } = renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    await screen.findByText('Could not load the feature\'s attributes.');
    unmount();

    featureHandler = () => HttpResponse.json(buildFeatureResponse({ status: 'Open' }));
    renderFeatureSymbolPopup({ properties: FEATURE_PROPERTIES });

    expect(await screen.findByRole('region', { name: 'Feature attributes' })).toBeVisible();
    expect(requestedFeatureIds).toEqual([FEATURE_ID, FEATURE_ID]);
  });

  test('does not fetch a feature without an id', () => {
    renderFeatureSymbolPopup();

    expect(store.getState().data.featureStore).toEqual({});
    expect(screen.queryByRole('status')).toBeNull();
  });
});
