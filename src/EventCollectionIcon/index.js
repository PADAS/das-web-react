import React, { memo } from 'react';
import EventIcon from '../EventIcon';
import PropTypes from 'prop-types';
import { calcTopRatedIconForEventTypes, calcIconColorByPriority } from '../utils/event-types';
import styles from './styles.module.scss';

const DasCollectionIcon = memo((props) => {
  const { reportTypes, className, ...rest } = props;
  return (
    <div className={`${styles.icon} ${className}`} {...rest}>
      <EventIcon className={styles.wrapper} iconId='incident_collection' />
      <EventIcon
        style={{
          fill: calcIconColorByPriority(calcTopRatedIconForEventTypes(reportTypes).default_priority)
        }}
        className={styles.content} iconId={calcTopRatedIconForEventTypes(reportTypes).icon_id} />
    </div>
  )
});

export default DasCollectionIcon;

DasCollectionIcon.propTypes = {
  reportTypes: PropTypes.array.isRequired,
};