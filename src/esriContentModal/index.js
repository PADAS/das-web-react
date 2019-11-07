import axios from 'axios';
import React, { memo, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { REACT_APP_ARCGIS_CLIENT_ID, REACT_APP_ARCGIS_CLIENT_SECRET } from '../constants';
import { removeModal } from '../ducks/modals';


const { Header, Title, Body, Footer } = Modal;
const { post, get } = axios;


const TOKEN_URL = 'https://www.arcgis.com/sharing/rest/oauth2/token/';
const SEARCH_URL = 'https://www.arcgis.com/sharing/rest/search?f=json&q=owner%3Ajesl_vulcanTD&num=20&sortField=numViews&sortOrder=desc&start=1&token=37tyuFCsO_lv4PQsA9ICrR4NT_1x_xbgC4dmVq6lwa1EqhFtmg2t0xr6vs30kOAus-RdgrD78DoKrjC9uW32_c-RGZRyNce8zfKIuds7eg0iovR1Q7wEwEmuSp3NnAt0xAdmK6hH_1gNF6UZRTekfOIxjFfPIRkkKq0TeWjODA9ZfEhsBRHGeY-4lvpbovuEW1EPOZX-TA2fZu5hVCszJOC_qtqhHSZ3drr80UvWuS8.';
const SEARCH_PARAMS = {
  f: 'json',
  q: 'owner=Ajesl_vulcanTD&num=20&sortField=numViews&sortOrder=desc&start=1',
};

const ESRI_REQUEST_SANITIZATION = [function (data, headers) {
  delete headers.common.Authorization;
  return data;
}];

const EsriContentModal = (props) => {
  const [token, setToken] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [featureServerLayers, setFeatureServerLayers] = useState([]);

  useEffect(() => {
    post(TOKEN_URL, {}, {
      params: {
        client_id: REACT_APP_ARCGIS_CLIENT_ID,
        client_secret: REACT_APP_ARCGIS_CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      transformRequest: ESRI_REQUEST_SANITIZATION,
    }).then(({ data }) => {
      console.log('ESRI token', data);
      setToken(data);
    })
      .catch((error) => {
        console.log('ESRI token error', error);
      });
  }, []);

  useEffect(() => {
    if (token) {
      get(SEARCH_URL, {
        params: {
          ...SEARCH_PARAMS,
          token: token.access_token,
        },
        transformRequest: ESRI_REQUEST_SANITIZATION,
      }).then(({ data }) => {
        setSearchResults(
          data.results.filter(item => item.type === 'Feature Service')
        );
      }).catch((error) => {
        console.log('ESRI search error', error);
      });
    }
  }, [token]);

  useEffect(() => {
    const getLayers = async () => {
      const results = await Promise.all(searchResults.map(({ url }) => get(`${url}/layers`, {
        params: {
          token: token.access_token,
          f: 'json',
        },
        transformRequest: ESRI_REQUEST_SANITIZATION,
      }).then(response => {
        return {
          url: response.config.url,
          layerIDs: response.data.layers.map(l => l.id),
        };
      })));
      setFeatureServerLayers(results);
    };
    getLayers();
  }, [searchResults, token]);

  useEffect(() => {
    const getLayerGeoJson = async () => {
      const results = await Promise.all(featureServerLayers.map(({ url, layerIDs }) => {
        return Promise.all(layerIDs.map(id => get(`${url.replace('/layers', '')}/${id}/query`, {
          params: {
            where: '1=1',
            outFields: '*',
            returnGeometry: true,
            f: 'pgeojson',
            token: token.access_token,
          },
          transformRequest: ESRI_REQUEST_SANITIZATION,
        })));
      }));
      console.log('getLayerGeoJson results', results);
    };
    getLayerGeoJson();
  }, [featureServerLayers]);

  return !!searchResults.length && <ul style={{ position: 'fixed', zIndex: 1000, top: 0, left: 0, height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', flexFlow: 'column', justifyContent: 'center' }}>
    {searchResults.map(item => <li key={item.id}>{item.title}</li>)}
  </ul>;
};


export default connect(null, { removeModal })(memo(EsriContentModal));
