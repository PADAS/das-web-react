import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';


const MAP_EVENT_CLUSTER_SOURCE_OPTIONS = {
  cluster: true,
  // clusterMaxZoom: 20, // Max zoom to cluster points on
  clusterRadius: 40,
};

export default class EventsLayer extends Component {
  render() {
    const { events, onClusterClick, onEventClick, enableClustering, ...rest } = this.props;
    return (
      <Fragment>
        <GeoJSONLayer
          id="event_clusters"
          data={events}
          circleOnClick={onClusterClick}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['has', 'point_count'],
          }}
          circlePaint={{
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
          }} />
        <GeoJSONLayer
          id="event_cluster_count"
          data={events}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['has', 'point_count'],
          }}
          symbolLayout={{
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12
          }} />

        <GeoJSONLayer
          id="event_symbols"
          {...rest}
          data={events}
          symbolOnClick={onEventClick}
          sourceOptions={MAP_EVENT_CLUSTER_SOURCE_OPTIONS}
          layerOptions={{
            filter: ['!has', 'point_count'],
          }}
          symbolLayout={{
            'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
            'icon-anchor': 'bottom',
            'icon-image': ["get", "icon_id"],
            'text-allow-overlap': ["step", ["zoom"], false, 12, true],
            'text-anchor': 'top',
            'text-field': '{display_title}',
            'text-justify': 'center',
            'text-size': 12,
          }} />
      </Fragment>
    )
  }
};

EventsLayer.defaultProps = {
  onClusterClick() {
    console.log('cluster click');
  },
  onEventClick() {
    console.log('event click');
  },
  enableClustering: true,
};

EventsLayer.propTypes = {
  events: PropTypes.object.isRequired,
  onEventClick: PropTypes.func,
  onClusterClick: PropTypes.func,
  enableClustering: PropTypes.bool,
}