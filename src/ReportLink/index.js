import React from 'react';
import icon from './icon.svg';
import styles from './styles.module.scss';
import { REPORT_LINK_TYPES } from '../constants';
import { PATROL_STATUS_THEME_COLOR_MAP, PRIORITY_STATUS_THEME_COLOR_MAP } from '../common/styles/themeColorMaps';


const ReportLink = ({ title, count, date, linkType, status }) => {
  const theme = linkType === REPORT_LINK_TYPES.patrol ? PATROL_STATUS_THEME_COLOR_MAP: PRIORITY_STATUS_THEME_COLOR_MAP;
  const { base, altBackground } = theme[status];
  const containerBackground = {
    backgroundColor: altBackground
  };
  const iconBackground = {
    backgroundColor: base
  };
  return (
    <div style={containerBackground} className={`${styles.container} ${styles.flexWrapper}`}>
      <img src={icon} style={iconBackground} className={styles.icon} />
      <div className={`${styles.info} ${styles.flexWrapper}`}>
        <p className={styles.count}>
          {count}
        </p>
        <p className={styles.title}>
          {title}
        </p>
      </div>
      <p className={styles.date}>
        {date}
      </p>
    </div>
  );
};

export default ReportLink;
