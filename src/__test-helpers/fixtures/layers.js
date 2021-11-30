const layers = [
  {
    'id': '1e1735dd-4598-4f2d-b707-55df31ba472b',
    'name': 'ESRI Bathymetry',
    'attributes': {
      'url': 'https://server.arcgisonline.com/arcgis/rest/services/Seafloor_Bathymetry/MapServer/tile/{z}/{y}/{x}',
      'type': 'tile_server',
      'title': 'ESRI Bathymetry',
      'icon_url': 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/assets/images/esri-logo-color-6c1dbc86c0f28b9278d38cdf5c768e72.png',
      'configuration': {
        'maxZoom': 19,
        'maxNativeZoom': 17,
        'minZoom': 5,
      }
    },
    'ordernum': null
  },
  {
    'id': 'd958fc5e-c451-438b-a3e2-5bab6dc2a2f2',
    'name': 'ESRI Satellite',
    'attributes': {
      'url': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      'type': 'tile_server',
      'title': 'ESRI Satellite',
      'icon_url': 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/assets/images/esri-logo-color-6c1dbc86c0f28b9278d38cdf5c768e72.png',
      'configuration': {
        'maxZoom': 19,
      }
    },
    'ordernum': null
  },
  {
    'id': 'f3a14b19-456a-42d0-afa6-c9b89343eb2d',
    'name': 'ESRI Topographic',
    'attributes': {
      'url': 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      'type': 'tile_server',
      'title': 'ESRI Topographic',
      'icon_url': 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/assets/images/esri-logo-color-6c1dbc86c0f28b9278d38cdf5c768e72.png',
      'configuration': {
        'minZoom': 19,
      }
    },
    'ordernum': null
  },
  {
    'id': '0cc83fed-2b1c-407d-8fe1-ce9f949a4e46',
    'name': 'ESRI World Oceans',
    'attributes': {
      'url': 'https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      'type': 'tile_server',
      'title': 'ESRI World Oceans',
      'icon_url': 'https://d1iq7pbacwn5rb.cloudfront.net/opendata-ui/assets/assets/images/esri-logo-color-6c1dbc86c0f28b9278d38cdf5c768e72.png',
    },
    'ordernum': null
  },
  {
    'id': 'd57ea783-dbf6-4e2f-aa35-89d24b9ed30a',
    'name': 'Google Satellite Map',
    'attributes': {
      'url': 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      'type': 'tile_server',
      'title': 'Google Satellite',
      'icon_url': 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
    },
    'ordernum': null
  },
  {
    'id': 'fb3ccdc5-f29e-4211-9baa-cb53f1a958b6',
    'name': 'Howdy',
    'attributes': {
      'url': 'https://cdn.shopify.com/s/files/1/0323/6410/1676/products/cowboy-costume-kids.jpg',
      'type': 'tile_server',
      'title': 'Howdy There'
    },
    'ordernum': null
  },
  {
    'id': '422bb0e3-c22d-4843-9af1-1c7b39de10f4',
    'name': 'Mapbox Bathymetry',
    'attributes': {
      'url': 'mapbox://styles/vjoelm/cko39fmaw01cd18oaujy3baus',
      'type': 'mapbox_style',
      'title': 'Mapbox Bathymetry'
    },
    'ordernum': null
  },
  {
    'id': '8b297282-164d-4604-a144-ceedefef605a',
    'name': 'Mapbox Satellite Map',
    'attributes': {
      'url': 'https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidmpvZWxtIiwiYSI6ImNpZ3RzNXdmeDA4cm90N2tuZzhsd3duZm0ifQ.YcHUz9BmCk2oVOsL48VgVQ',
      'type': 'tile_server',
      'title': 'Mapbox Satellite Map'
    },
    'ordernum': null
  },
  {
    'id': 'b349d203-98af-4f64-a1f2-eabfbf9d2bd4',
    'name': 'Mapbox Skylight MDA',
    'attributes': {
      'url': 'mapbox://styles/vjoelm/cjm13kah01hoi2smwh3mrk78p',
      'type': 'mapbox_style',
      'title': 'Mapbox Skylight MDA',
      'styleUrl': 'mapbox://styles/vjoelm/cjm13kah01hoi2smwh3mrk78p'
    },
    'ordernum': null
  },
  {
    'id': '6b249e15-bc31-42f6-bbb9-08b225d14ded',
    'name': 'Planet',
    'attributes': {
      'url': 'https://tiles0.planet.com/basemaps/v1/planet-tiles/planet_medres_normalized_analytic_2020-12_mosaic/{z}/{x}/{y}.png?api_key=6e61aec534084a4abf97526670822444',
      'type': 'tile_server',
      'title': 'Planet'
    },
    'ordernum': null
  }
];

export const withMaxMinAndMaxNativeZoom = layers[0];
export const withMaxZoom = layers[1];
export const withMinZoom = layers[2];
export const withNoZoomConfig = layers[3];

export default layers;