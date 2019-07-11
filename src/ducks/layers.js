import { get } from 'axios';
import { API_URL, REACT_APP_BASE_MAP_STYLES } from '../constants';

const FETCH_BASE_LAYERS_START = 'FETCH_BASE_LAYERS_START';
const FETCH_BASE_LAYERS_SUCCESS = 'FETCH_BASE_LAYERS_SUCCESS';
const FETCH_BASE_LAYERS_ERROR = 'FETCH_BASE_LAYERS_ERROR';

const SET_BASE_LAYER = 'SET_BASE_LAYER';

const BASE_LAYER_API_URL = `${API_URL}layers`;

export const fetchBaseLayers = () => async (dispatch) => {
  dispatch({
    type: FETCH_BASE_LAYERS_START,
  });

  try {
    const { data: { data:results } } = await get(BASE_LAYER_API_URL);
    dispatch({
      type: FETCH_BASE_LAYERS_SUCCESS,
      payload: results,
    });

  } catch (e) {
    dispatch({
      type: FETCH_BASE_LAYERS_ERROR,
      payload: e,
    });
    throw new Error(e);
  }
};

export const setBaseLayer = (layer) => ({
  type: SET_BASE_LAYER,
  payload: layer,
});

const DEFAULT_BASE_LAYER = {
  name: 'EarthRanger Terrain Map',
  id: 'earthranger-terrain-map',
  attributes: {
    url: REACT_APP_BASE_MAP_STYLES,
    type: 'mapbox_style',
  },
};

const INITIAL_BASE_LAYERS_STATE = [DEFAULT_BASE_LAYER];
const baseLayersReducer = (state = INITIAL_BASE_LAYERS_STATE, { type, payload }) => {
  if (type === FETCH_BASE_LAYERS_SUCCESS) return [DEFAULT_BASE_LAYER, ...payload];
  return state;
};

export default baseLayersReducer;

export const currentBaseLayerReducer = (state = DEFAULT_BASE_LAYER, { type, payload }) => {
  if (type === SET_BASE_LAYER) {
    return payload;
  }
  return state;
};



/* srvc.getBaseLayers = () => get(`${ENV.apiEndpoint}/layers`)
      .then(({ data: { data } }) => {
        if (data && data.length) {
          const mapboxAccessToken = getMapboxTokenFromResponse(...data);
          if (mapboxAccessToken) {
            L.mapbox.accessToken = mapboxAccessToken;
          }
          customLeafletControls.defineDasLayerControl();
          return srvc.convertLayerResponseToLayers(data);
        }
        return [];
      });

    srvc.convertLayerResponseToLayers = data => $q.all((data)
      .filter(layer => VALID_SOURCE_TYPES.includes(layer.attributes.type))
      .map((layerData) => {
        const {
          id,
          ordernum,
          attributes: {
            type, title, url, configuration, icon_url,
          },
        } = layerData;

        const deferred = $q.defer();

        const result = { id, ordernum };

      
        switch (type) { // eslint-disable-line default-case
          case 'mapbox_style': { //
            deferred.resolve({
                ...result,
                layer: L.mapbox.styleLayer(url, configuration),
                layer_label: `<img src="${icon_url || 'assets/images/icons/mapbox-logo.png'}" /> <span>${title}</span>`,
              });
            break;
          }
          case 'mapbox_tiles': {
            deferred.resolve({
              ...result,
              layer: L.mapbox.tileLayer(url, configuration),
              layer_label: `<img src="${icon_url || 'assets/images/icons/mapbox-logo.png'}" /> <span>${title}</span>`,
            });
            break;
          }
          case 'tile_server': {
            deferred.resolve({
              ...result,
              layer: L.tileLayer(url, configuration),
              layer_label: `<img src="${icon_url || 'assets/images/icons/generic-globe-logo.png'}" /> <span>${title}</span>`,
            });
            break;
          }
          case 'google_map': {
            $window.createGoogleMapLayer = () => { // eslint-disable-line no-param-reassign
              customLeafletControls.defineGoogleMapLayer();
              deferred.resolve({
                ...result,
                layer: new L.Google('SATELLITE'),
                layer_label: `<img src="${icon_url || 'assets/images/icons/google-maps-logo.png'}" /> <span>${title}</span>`,
              });
              delete $window.createGoogleMapLayer; // eslint-disable-line no-param-reassign
            };

            const mapApiScriptEl = document.querySelector('#google-map-api-script');

            if (mapApiScriptEl && ($window.google && $window.google.maps)) {
              delete $window.google.maps; // eslint-disable-line no-param-reassign
              mapApiScriptEl.parentNode.removeChild(mapApiScriptEl);
            }

            const script = document.createElement('script');
            script.id = 'google-map-api-script';
            script.src = `https://maps.googleapis.com/maps/api/js?key=${configuration.accessToken}&callback=createGoogleMapLayer`;

            document.body.appendChild(script);

            break;
          }
        }
        return deferred.promise;
      })); */