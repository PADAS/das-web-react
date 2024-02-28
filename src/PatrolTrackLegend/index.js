import React, { memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import length from '@turf/length';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as InfoIcon } from '../common/images/icons/information.svg';

import { displayTitleForPatrol, iconTypeForPatrol } from '../utils/patrols';
import { updatePatrolTrackState } from '../ducks/patrols';
import { visibleTrackedPatrolData } from '../selectors/patrols';

import DasIcon from '../DasIcon';
import MapLegend from '../MapLegend';
import PatrolDistanceCovered from '../Patrols/DistanceCovered';

import styles from '../TrackLegend/styles.module.scss';

const TitleElement = ({ displayTitle, iconId, onRemovePatrolClick, patrolData }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'patrolTrackLegend.titleElement' });

  const convertPatrolTrackToDetailItem = useCallback(({ patrol, trackData, leader }) => {
    const iconId = iconTypeForPatrol(patrol);
    const title = displayTitleForPatrol(patrol, leader);

    return <li key={patrol.id}>
      <DasIcon className={styles.svgIcon} iconId={iconId} title={t('icon', { title })} type="events" />

      <div className={styles.listItemDetails}>
        <span>{title}</span>

        <small>{t('lengthCovered', { length: `${trackData ? length(trackData.track).toFixed(2): 0.00}km` })}</small>
      </div>

      <Button onClick={onRemovePatrolClick} value={patrol.id} variant="secondary">{t('removeButton')}</Button>
    </li>;
  }, [onRemovePatrolClick, t]);

  return <div className={styles.titleWrapper}>
    {iconId && <DasIcon className={styles.svgIcon} iconId={iconId} type="events" />}

    <div className={styles.innerTitleWrapper}>
      <h6>
        {displayTitle}

        {patrolData.length > 1 && <OverlayTrigger
          overlay={<Popover className={styles.popover} id="track-details">
            <ul>
              {patrolData.map(convertPatrolTrackToDetailItem)}
            </ul>
          </Popover>}
          placement="right"
          rootClose
          trigger="click"
        >
          <button className={styles.infoButton} type="button">
            <InfoIcon className={styles.infoIcon} />
          </button>
        </OverlayTrigger>}
      </h6>

      <span>
        <PatrolDistanceCovered patrolsData={patrolData} />

        {t('coveredSpan')}
      </span>
    </div>
  </div>;
};

const PatrolTrackLegend = (props) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'patrolTrackLegend' });

  const patrolData = useSelector(visibleTrackedPatrolData);
  const trackState = useSelector((state) => state.view.patrolTrackState);

  const hasData = !!patrolData.length;
  const isMulti = patrolData.length > 1;

  let displayTitle;
  if (!hasData) {
    displayTitle = null;
  } else if (!isMulti) {
    displayTitle = t('singlePatrolTitle', {
      patrolDisplayTitle: displayTitleForPatrol(patrolData[0].patrol, patrolData[0].leader),
    });
  } else {
    displayTitle = t('multiplePatrolsTitle', { count: patrolData.length });
  }

  const iconId = !isMulti && hasData ? iconTypeForPatrol(patrolData[0].patrol) : null;

  return hasData ? <MapLegend
    {...props}
    titleElement={<TitleElement
      displayTitle={displayTitle}
      iconId={iconId}
      onRemovePatrolClick={(event) => dispatch(updatePatrolTrackState({
        visible: trackState.visible.filter((value) => value !== event.target.value),
        pinned: trackState.pinned.filter((value) => value !== event.target.value),
      }))}
      patrolData={patrolData}
    />}
  /> : null;
};

export default memo(PatrolTrackLegend);
