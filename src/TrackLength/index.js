import { length } from '@turf/turf';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod } from '../selectors/tracks';

const TrackLength = ({ className = '', trackId }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLength' });

  const tracks = useSelector(selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod);

  const trackFeature = tracks.find(({ track }) => track?.features[0].properties.id === trackId)?.track.features[0];

  return trackFeature ? <div className={className}>
    <span>
      <strong>{t('title')}</strong>
    </span>

    <span>{t('length', { length: length(trackFeature).toFixed(2) })}</span>
  </div> : null;
};

export default TrackLength;
