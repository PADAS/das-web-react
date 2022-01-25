import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Source } from 'react-mapbox-gl';

import useSubjectsLayer from '../hooks/useSubjectsLayer';

import { withMap } from '../EarthRangerMap';
import withMapViewConfig from '../WithMapViewConfig';

const SubjectsLayer = ({ onSubjectIconClick }) => {
  const { mapSubjectFeatures, renderedSubjectsLayer } = useSubjectsLayer(null, onSubjectIconClick);

  const sourceData = {
    type: 'geojson',
    data: mapSubjectFeatures,
  };

  return <Fragment>
    <Source id='subject-symbol-source' geoJsonSource={sourceData} />
    {renderedSubjectsLayer}
  </Fragment>;
};

SubjectsLayer.propTypes = {
  subjects: PropTypes.object.isRequired,
  onSubjectIconClick: PropTypes.func,
};

export default withMap(memo(withMapViewConfig(SubjectsLayer)));
