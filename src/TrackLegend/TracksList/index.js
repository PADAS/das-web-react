import React from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CrossIcon } from '../../common/images/icons/cross.svg';

import * as styles from './styles.module.scss';

const TracksItem = ({ item, onRemove }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.tracksList.tracksItem' });

  return <li className={styles.tracksItem}>
    <div className={styles.leftColumn}>
      {item.icon}

      <p className={styles.title} title={item.title}>{item.title}</p>
    </div>

    <div className={styles.rightColumn}>
      <p className={styles.description}>{item.description}</p>

      <button
        aria-label={t('removeButtonLabel', { title: item.title })}
        className={styles.removeButton}
        onClick={() => onRemove(item.id)}
        type="button"
      >
        {t('removeButton')}
      </button>
    </div>
  </li>;
};

const TracksList = ({ items, itemsName, onClose, onRemoveItemTracks }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.tracksList' });

  return <div className={styles.tracksList}>
    <div className={styles.header}>
      <p className={styles.title}>{itemsName}</p>

      <button
        aria-label={t('closeButtonLabel', { itemsName })}
        className={styles.closeButton}
        onClick={() => onClose()}
        title={t('closeButtonLabel', { itemsName })}
        type="button"
      >
        <CrossIcon className={styles.crossIcon} />
      </button>
    </div>

    <ul className={styles.list}>
      {items.map((item) => <TracksItem item={item} key={item.id} onRemove={onRemoveItemTracks} />)}
    </ul>
  </div>;
};

export default TracksList;
