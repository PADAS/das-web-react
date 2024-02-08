import React, { useEffect, useState } from 'react';
import length from '@turf/length';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { trimmedVisibleTrackData } from '../selectors/tracks';

const TrackLength = ({ className, trackId }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLength' });

  const tracks = useSelector(trimmedVisibleTrackData);

  const [trackFeature, setTrackFeature] = useState();

  useEffect(() => {
    const match = tracks.find(({ track }) => track?.features[0].properties.id === trackId);

    if (match) {
      setTrackFeature(match.track.features[0]);
    }
  }, [trackId, tracks]);

  return trackFeature ? <div className={className}>
    <span>
      <strong>{t('title')}</strong>
    </span>

    <span>{t('length', { length: length(trackFeature).toFixed(2) })}</span>
  </div> : null;
};

TrackLength.defaultProps = {
  className: '',
};

TrackLength.propTypes = {
  className: PropTypes.string,
  trackId: PropTypes.string.isRequired,
};

export default TrackLength;
