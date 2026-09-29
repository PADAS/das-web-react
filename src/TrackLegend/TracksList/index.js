import React, { useId, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as EyeIcon } from '../../common/images/icons/eye.svg';
import { ReactComponent as EyeOffIcon } from '../../common/images/icons/eye-off.svg';

import * as styles from './styles.module.scss';

const TracksChildItem = ({ child, onToggleTracks, showTrackColor }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.tracksList.tracksChildItem' });

  return <li className={styles.tracksChildItem}>
    <div className={styles.leftColumn}>
      <span className={styles.icon}>{child.icon}</span>

      <p className={styles.title} title={child.title}>{child.title}</p>
    </div>

    <div className={styles.rightColumn}>
      {showTrackColor && !!child.trackColor && <span
        aria-hidden="true"
        className={styles.trackColor}
        data-testid="tracksList-trackColor"
        style={{ backgroundColor: child.trackColor }}
      />}

      {!!child.description && <p className={styles.description}>{child.description}</p>}

      <button
        aria-label={t(`toggleTracksButtonLabel.${child.isHidden ? 'hidden' : 'shown'}`, { title: child.title })}
        aria-pressed={!child.isHidden}
        className={`${styles.toggleTracksButton} ${child.isHidden ? '' : styles.active}`}
        onClick={() => onToggleTracks(child.id)}
        title={t(`toggleTracksButtonLabel.${child.isHidden ? 'hidden' : 'shown'}`, { title: child.title })}
        type="button"
      >
        {child.isHidden ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
      </button>
    </div>
  </li>;
};

const TracksItem = ({ item, onClear, onToggleChildTracks, showTrackColors }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.tracksList.tracksItem' });

  const childrenListId = useId();

  const [isExpanded, setIsExpanded] = useState(true);

  const hasChildren = !!item.children?.length;

  return <li className={styles.tracksItem}>
    <div className={styles.itemRow}>
      <div className={styles.leftColumn}>
        <span className={styles.icon}>{item.icon}</span>

        <p className={styles.title} title={item.title}>{item.title}</p>
      </div>

      <div className={styles.rightColumn}>
        {!!item.description && <p className={styles.description}>{item.description}</p>}

        <button
          aria-label={t('clearButtonLabel', { title: item.title })}
          className={styles.clearButton}
          onClick={() => onClear(item.id)}
          type="button"
        >
          {t('clearButton')}
        </button>

        {hasChildren && <button
          aria-controls={childrenListId}
          aria-expanded={isExpanded}
          aria-label={t(`expandButtonLabel.${isExpanded ? 'open' : 'closed'}`, { title: item.title })}
          className={styles.expandButton}
          onClick={() => setIsExpanded((wasExpanded) => !wasExpanded)}
          title={t(`expandButtonLabel.${isExpanded ? 'open' : 'closed'}`, { title: item.title })}
          type="button"
        >
          {isExpanded ? <ArrowUpSimpleIcon aria-hidden="true" /> : <ArrowDownSimpleIcon aria-hidden="true" />}
        </button>}
      </div>
    </div>

    {hasChildren && <Collapse in={isExpanded}>
      <div>
        <ul className={styles.childrenList} id={childrenListId}>
          {item.children.map((child) => <TracksChildItem
            child={child}
            key={child.id}
            onToggleTracks={(childId) => onToggleChildTracks(item.id, childId)}
            showTrackColor={showTrackColors}
          />)}
        </ul>
      </div>
    </Collapse>}
  </li>;
};

const TracksList = ({ items, onClearItemTracks, onToggleItemChildTracks, showTrackColors }) => {
  // The row of a lone item would only repeat the title above it, so its rows
  // take over the list. One with no rows has nothing left to list.
  const loneItem = items.length === 1 ? items[0] : null;

  return <ul className={styles.tracksList}>
    {loneItem
      ? (loneItem.children ?? []).map((child) => <TracksChildItem
        child={child}
        key={child.id}
        onToggleTracks={(childId) => onToggleItemChildTracks(loneItem.id, childId)}
        showTrackColor={showTrackColors}
      />)
      : items.map((item) => <TracksItem
        item={item}
        key={item.id}
        onClear={onClearItemTracks}
        onToggleChildTracks={onToggleItemChildTracks}
        showTrackColors={showTrackColors}
      />)}
  </ul>;
};

export default TracksList;
