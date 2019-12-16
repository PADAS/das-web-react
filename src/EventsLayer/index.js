import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';
import concave from '@turf/concave';
import buffer from '@turf/buffer';
import simplify from '@turf/simplify';
import { featureCollection } from '@turf/helpers';

import uniq from 'lodash/uniq';

import { addFeatureCollectionImagesToMap, addMapImage } from '../utils/map';

import { withMap } from '../EarthRangerMap';
import ClusterIcon from '../common/images/icons/cluster-icon.svg';

import { LAYER_IDS, DEFAULT_SYMBOL_PAINT } from '../constants';

import LabeledSymbolLayer from '../LabeledSymbolLayer';

const { EVENT_CLUSTERS_CIRCLES, SUBJECT_SYMBOLS, EVENT_SYMBOLS } = LAYER_IDS;

const clusterSymbolLayout = {
  'icon-image': 'event-cluster-icon',
  'icon-allow-overlap': true,
  'icon-pitch-alignment': 'map',
  'text-allow-overlap': true,
  'text-field': '{point_count_abbreviated}',
  'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
  'text-size': 12,
  'text-offset': [-0.8, -0.8],
};

const clusterSymbolPaint = {
  ...DEFAULT_SYMBOL_PAINT,
  'text-halo-color': 'rgba(255,255,255,1)',
  'text-halo-width': 3,
};

const clusterPolyPaint = {
  'fill-color': 'rgba(60, 120, 40, 0.4)',
  'fill-outline-color': 'rgba(20, 100, 25, 1)',
};

const layoutProps = {
  textLayout: {
    'text-field': '{display_title}',
  },
};

const EventsLayer = (props) => {
  const { events, onEventClick, onClusterClick, enableClustering, map, ...rest } = props;

  const handleClusterClick = (e) => {
    setClusterBufferPolygon(featureCollection([]));
    onClusterClick(e);
  };

  const [clusterBufferPolygon, setClusterBufferPolygon] = useState(featureCollection([]));

  const getEventLayer = (e) => map.queryRenderedFeatures(e.point, { layers: layerIdRef.current })[0];

  const addIdsToEventLayerIds = (ids) => {
    layerIdRef.current = uniq([...layerIdRef.current, ...ids]);
  };

  const timeoutRef = useRef(null);
  const layerIdRef = useRef([]);

  const clusterGeometryIsSet = !!clusterBufferPolygon
    && !!clusterBufferPolygon.geometry
    && !!clusterBufferPolygon.geometry.coordinates
    && !!clusterBufferPolygon.geometry.coordinates.length;

  const onClusterMouseEnter = (e) => {
    if (!clusterGeometryIsSet) {
      const cluster = map.queryRenderedFeatures(e.point, { layers: [EVENT_CLUSTERS_CIRCLES] })[0];
      const clusterID = cluster && cluster.id;

      if (clusterID) {
        const clusterSource = map.getSource('events-data-clustered');
        clusterSource.getClusterLeaves(clusterID, 999, 0, (_err, results = []) => {
          if (results && results.length > 2) {
            try {
              const concaved = concave(featureCollection(results));

              if (!concaved) return;

              const buffered = buffer(concaved, 0.2);
              const simplified = simplify(buffered, { tolerance: 0.005 });
              // const tenPixelBufferSize = metersPerPixel(lat, zoom) / 100;

              setClusterBufferPolygon(simplified);
            } catch (e) {
              /* there are plenty of reasons a feature collection, coerced through this chain of transformations, may error. it may make an illegal shape, create a
              non-closed/invalid LinearRing, etc etc. try/catch is a bad choice most of the time but it fits the bill for error swallowing here. */
            }
          }
        });
      } else {
        setClusterBufferPolygon(featureCollection([]));
      }
    }
  };

  const onClusterMouseLeave = () => {
    window.clearTimeout(timeoutRef.current);
    // console.log('mouse leave, should be clearing the polygon');
    setClusterBufferPolygon(featureCollection([]));
  };

  const handleEventClick = (e) => {
    e.preventDefault();

    const clickedLayer = getEventLayer(e, layerIdRef.current);

    onEventClick(clickedLayer);
  };

  useEffect(() => {
    const addClusterIconToMap = async () => {
      if (!map.hasImage('event-cluster-icon')) {
        addMapImage(ClusterIcon, 'event-cluster-icon');
      }
    };
    !!events && addFeatureCollectionImagesToMap(events, map);
    addClusterIconToMap();
  }, [events, map]);

  const clusterConfig = {
    cluster: true,
    clusterMaxZoom: 17, // Max zoom to cluster points on
    clusterRadius: 70,
  };

  const sourceData = {
    type: 'geojson',
    data: events,
  };

  const clusteredSourceData = {
    ...sourceData,
    ...clusterConfig,
  };

  const clusterBufferData = {
    type: 'geojson',
    data: clusterBufferPolygon,
  };

  const unclusteredLayoutProps = {
    layout: {
      'icon-allow-overlap': true,
      visibility: enableClustering ? 'none' : 'visible',
    },
    textLayout: {
      ...layoutProps.textLayout,
      'text-allow-overlap': true,
      visibility: enableClustering ? 'none' : 'visible',
    },
    textPaint: {
      'text-halo-color': ['case',
        ['has', 'distanceFromVirtualDate'],
        ['interpolate', ['linear'], ['abs', ['get', 'distanceFromVirtualDate']], 0, 'rgba(255, 255, 126, 1)', .225, 'rgba(255,255,255,0.7)'],
        'rgba(255,255,255,0.7)',
      ],
    }
  };

  const clusteredLayoutProps = {
    layout: {
      visibility: enableClustering ? 'visible' : 'none',
    },
    textLayout: {
      ...layoutProps.textLayout,
      visibility: enableClustering ? 'visible' : 'none',
    },
  };

  const eventLayerProps = {
    before: SUBJECT_SYMBOLS,
    id: EVENT_SYMBOLS,
    onClick: handleEventClick,
    onInit: addIdsToEventLayerIds,
    filter: ['!has', 'point_count'],
  };

  const finalClusteredProps = {
    ...eventLayerProps,
    ...clusteredLayoutProps,
  };

  const finalUnclusteredProps = {
    ...eventLayerProps,
    ...unclusteredLayoutProps,
  };

  return <Fragment>
    <Source id='events-data-clustered' geoJsonSource={clusteredSourceData} />
    <Source id='events-data-unclustered' geoJsonSource={sourceData} />
    <Source id='cluster-buffer-polygon-data' geoJsonSource={clusterBufferData} />

    {<LabeledSymbolLayer sourceId='events-data-unclustered' {...finalUnclusteredProps} id='whatever-layer-1' />}
    {<LabeledSymbolLayer sourceId='events-data-clustered' {...finalClusteredProps} id='whatever-layer-2' />}

    {enableClustering && <Fragment>
      {/* <LabeledSymbolLayer {...layerProps} /> */}
      <Layer before={SUBJECT_SYMBOLS} sourceId='events-data-clustered' id={EVENT_CLUSTERS_CIRCLES} type='symbol'
        filter={['has', 'point_count']} onClick={handleClusterClick} layout={clusterSymbolLayout} paint={clusterSymbolPaint}
        onMouseEnter={onClusterMouseEnter} onMouseLeave={onClusterMouseLeave}
      />

      <Layer before={EVENT_CLUSTERS_CIRCLES} sourceId='cluster-buffer-polygon-data' id='cluster-polygon' type='fill' paint={clusterPolyPaint} />
    </Fragment>}
  </Fragment>;
};

export default withMap(memo(EventsLayer));

EventsLayer.defaultProps = {
  onClusterClick() {
  },
  onEventClick() {
  },
  enableClustering: true,
};

EventsLayer.propTypes = {
  events: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onEventClick: PropTypes.func,
  onClusterClick: PropTypes.func,
  enableClustering: PropTypes.bool,
};
