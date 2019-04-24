import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';


const MAP_EVENT_CLUSTER_SOURCE_OPTIONS = {
  cluster: true,
  clusterMaxZoom: 17, // Max zoom to cluster points on
  clusterRadius: 40,
};

const clusterLayerOptions = {
  filter: ['has', 'point_count'],
};

const clusterSymbolLayout = {
  'icon-pitch-alignment': 'map',
};

const clusterPaint = {
  "circle-color": [
    "step",
    ["get", "point_count"],
    "#51bbd6",
    25,
    "#f28cb1"
  ],
  "circle-radius": [
    "case",
    ['<', ['get', 'point_count'], 10], 15,
    ['>', ['get', 'point_count'], 10], 25,
    15,
  ]
};

const clusterCountSymbolLayout = {
  "text-field": "{point_count_abbreviated}",
  "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
  "text-size": 12
};


const eventSymbolLayerOptions = {
  filter: ['!has', 'point_count'],
};

const eventSymbolLayerLayout = {
  'icon-allow-overlap': ["step", ["zoom"], false, 10, true],
  'icon-anchor': 'center',
  'icon-image': ["get", "icon_id"],
  'text-allow-overlap': ["step", ["zoom"], false, 10, true],
  'text-anchor': 'top',
  'text-offset': [0, .5],
  'text-field': '{display_title}',
  'text-justify': 'center',
  'text-size': 12,
};

const getEventLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.type === 'symbol')[0];
export default class EventsLayer extends Component {
  constructor(props) {
    super(props);

    this.onEventClick = this.onEventClick.bind(this);
  }
  onEventClick(e) {
    this.props.onEventClick(getEventLayer(e, this.props.map));
  }
  render() {
    const { events, onClusterClick, onEventClick, enableClustering, ...rest } = this.props;
    return (
      <Fragment>
        <GeoJSONLayer
          id="event_clusters"
          data={events}
          circleOnClick={onClusterClick}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={clusterLayerOptions}
          symbolLayout={clusterSymbolLayout}
          circlePaint={clusterPaint} />
        <GeoJSONLayer
          id="event_cluster_count"
          data={events}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={clusterLayerOptions}
          symbolLayout={clusterCountSymbolLayout} />

        <GeoJSONLayer
          id="event_symbols"
          {...rest}
          data={events}
          symbolOnClick={this.onEventClick}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={eventSymbolLayerOptions}
          symbolLayout={eventSymbolLayerLayout} />
      </Fragment>
    )
  }
};

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
}