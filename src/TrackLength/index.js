import React, { useEffect, useState } from 'react';
import { length } from '@turf/turf';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod } from '../selectors/tracks';

const TrackLength = ({ className = '', trackId }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLength' });

  const tracks = useSelector(selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod);

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

export default TrackLength;
