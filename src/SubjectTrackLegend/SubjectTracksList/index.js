import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../common/images/icons/cross.svg';

import styles from './styles.module.scss';

const SubjectTracksItem = ({ onRemove, track }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.subjectTrackList.subjectTracksItem' });

  const subjectId = track.features[0].properties.id;

  const subject = useSelector((state) => state.data.subjectStore[subjectId]);

  const image = track.features[0].properties.image;
  const pointCount = track.features[0].geometry?.coordinates.length || 0;
  const title = track.features[0].properties.title;

  const subjectLastPositionImage = subject?.last_position?.properties?.image;

  return <li className={styles.subjectTracksItem}>
    <div className={styles.leftColumn}>
      <img alt={t('icon', { title })} className={styles.icon} src={subjectLastPositionImage || image} />

      <p className={styles.title} title={title}>{title}</p>
    </div>

    <div className={styles.rightColumn}>
      <p className={styles.pointCount}>{t('pointCount', { count: pointCount })}</p>

      <button
        aria-label={t('removeButtonLabel', { title })}
        className={styles.removeButton}
        onClick={() => onRemove(subjectId)}
        type="button"
      >
        {t('removeButton')}
      </button>
    </div>
  </li>;
};

const SubjectTracksList = ({ onClose, onRemoveSubjectTracks, subjectTracks }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.subjectTrackList' });

  return <div className={styles.subjectTracksList}>
    <div className={styles.header}>
      <p className={styles.title}>{t('title')}</p>

      <button
        aria-label={t('closeButtonLabel')}
        className={styles.closeButton}
        onClick={() => onClose()}
        title={t('closeButtonLabel')}
        type="button"
      >
        <CrossIcon className={styles.crossIcon} />
      </button>
    </div>

    <ul className={styles.list}>
      {subjectTracks.map((subjectTracks) => <SubjectTracksItem
        key={subjectTracks.track.features[0].properties.id}
        onRemove={onRemoveSubjectTracks}
        track={subjectTracks.track}
      />)}
    </ul>
  </div>;
};

export default SubjectTracksList;
