import React, { useEffect, useMemo } from 'react'; /* eslint-disable-line no-unused-vars */
import { connect } from 'react-redux';

export const DEFAULT_TERRAIN_CONFIG = {'source': 'mapbox-dem', 'exaggeration': 1.5};

const MapTerrain = (props) => {
  const { enable3D, map } = props;

  useEffect(() => {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
      });
    }

    if (enable3D) {
      map.setTerrain(DEFAULT_TERRAIN_CONFIG);
    } else {
      map.setTerrain();
    }

  }, [enable3D, map]);

  return null;
};

const mapStateToProps = ({ view: { userPreferences } }) => ({
  enable3D: userPreferences.enable3D,
});

export default connect(mapStateToProps, null)(MapTerrain);