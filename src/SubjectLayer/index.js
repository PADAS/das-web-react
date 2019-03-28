import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

const getSubjectLayer = (e, map) => map.queryRenderedFeatures(e.point).filter(item => item.layer.type === 'symbol')[0];

export default class SubjectsLayer extends Component {
  constructor(props) {
    super(props);

    this.onIconClick = this.onIconClick.bind(this);
  }
  onIconClick(e) {
    this.props.onSubjectIconClick(getSubjectLayer(e, this.props.map));
  }
  render() {
    const { onSubjectIconClick, subjects, ...rest } = this.props;
    return (
      <GeoJSONLayer
        id="subject_symbols"
        {...rest}
        symbolOnClick={this.onIconClick}
        data={subjects}
        symbolLayout={{
          'icon-allow-overlap': ["step", ["zoom"], false, 12, true],
          'icon-anchor': 'center',
          'icon-image': ["get", "icon_id"],
          'text-allow-overlap': ["step", ["zoom"], false, 12, true],
          'text-anchor': 'top',
          'text-offset': [0, .5],
          'text-field': '{name}',
          'text-justify': 'center',
          'text-size': 12,
        }} />
    );
  }
}

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  map: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};