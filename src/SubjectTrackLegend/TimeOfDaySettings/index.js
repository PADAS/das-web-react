import React from 'react';
import Collapse from 'react-bootstrap/Collapse';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as InformationIcon } from '../../common/images/icons/information.svg';

import { TIME_OF_DAY_RANGE_LEVELS, TIME_OF_DAY_RANGES } from '../constants';

import styles from './styles.module.scss';

const COLORED_TIME_ITEMS = [
  {
    color: 'titaniumYellow',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_1,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_1]
  },
  {
    color: 'americanYellow',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_2,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_2]
  },
  {
    color: 'fandangoPink',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_3,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_3]
  },
  {
    color: 'purplePlum',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_4,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_4]
  },
  {
    color: 'majorelleBlue',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_5,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_5]
  },
  {
    color: 'lapisLazuli',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_6,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_6]
  },
  {
    color: 'spanishGreen',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_7,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_7]
  },
  {
    color: 'green',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_8,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_8]
  },
  {
    color: 'titaniumYellow',
    key: TIME_OF_DAY_RANGE_LEVELS.LEVEL_9,
    text: TIME_OF_DAY_RANGES[TIME_OF_DAY_RANGE_LEVELS.LEVEL_9]
  },
];

const TimeOfDaySettings = ({ isExpanded, onCollapseTimeOfDaySettings, onExpandTimeOfDaySettings }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend.timeOfDaySettings' });

  return <div className={styles.timeOfDaySettings}>
    <div className={styles.header}>
      <div className={styles.titleWrapper}>
        <p className={styles.title}>{t('title')}</p>

        <OverlayTrigger overlay={<Tooltip id="time-of-day-information-tootltip">{t('informationTooltip')}</Tooltip>}>
          <InformationIcon className={styles.informationIcon} />
        </OverlayTrigger>
      </div>

      <button
        aria-controls="timeOfDaySettingsBody"
        aria-expanded={isExpanded}
        aria-label={t(`chevronButtonLabel.${isExpanded ? 'open' : 'closed'}`)}
        className={styles.chevronButton}
        onClick={() => isExpanded ? onCollapseTimeOfDaySettings() : onExpandTimeOfDaySettings()}
        title={t(`chevronButtonLabel.${isExpanded ? 'open' : 'closed'}`)}
        type="button"
      >
        {isExpanded
          ? <ArrowUpSimpleIcon className={styles.arrowIcon} />
          : <ArrowDownSimpleIcon className={styles.arrowIcon} />}
      </button>
    </div>

    <Collapse id="timeOfDaySettingsBody" in={isExpanded}>
      <div>
        <div className={styles.coloringDescription}>
          <div className={styles.gradient} />

          <ol className={styles.coloredTimesList}>
            {COLORED_TIME_ITEMS.map((coloredTimeItem) => <li className={styles.item} key={coloredTimeItem.key}>
              <div
                aria-label={t(`coloredTimeSquarLabels.${coloredTimeItem.color}`)}
                className={`${styles.square} ${styles[coloredTimeItem.color]}`}
              />

              <span>{coloredTimeItem.text}</span>
            </li>)}
          </ol>
        </div>
      </div>
    </Collapse>
  </div>;
};

export default TimeOfDaySettings;
