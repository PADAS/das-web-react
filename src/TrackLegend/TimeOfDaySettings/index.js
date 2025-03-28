import React from 'react';
import Collapse from 'react-bootstrap/Collapse';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as InformationIcon } from '../../common/images/icons/information.svg';

import TimeZoneSelect from './TimeZoneSelect';

import { TIME_OF_DAY_PERIODS } from '../../constants';

import * as styles from './styles.module.scss';

const COLORED_TIME_ITEMS = [
  {
    color: 'titaniumYellow',
    key: 0,
    text: TIME_OF_DAY_PERIODS[0].rangeString
  },
  {
    color: 'americanYellow',
    key: 1,
    text: TIME_OF_DAY_PERIODS[1].rangeString
  },
  {
    color: 'fandangoPink',
    key: 2,
    text: TIME_OF_DAY_PERIODS[2].rangeString
  },
  {
    color: 'purplePlum',
    key: 3,
    text: TIME_OF_DAY_PERIODS[3].rangeString
  },
  {
    color: 'majorelleBlue',
    key: 4,
    text: TIME_OF_DAY_PERIODS[4].rangeString
  },
  {
    color: 'lapisLazuli',
    key: 5,
    text: TIME_OF_DAY_PERIODS[5].rangeString
  },
  {
    color: 'spanishGreen',
    key: 6,
    text: TIME_OF_DAY_PERIODS[6].rangeString
  },
  {
    color: 'green',
    key: 7,
    text: TIME_OF_DAY_PERIODS[7].rangeString
  },
  {
    color: 'titaniumYellow',
    key: 8,
    text: TIME_OF_DAY_PERIODS[0].rangeString
  },
];

const TimeOfDaySettings = ({ isExpanded, onCollapseTimeOfDaySettings, onExpandTimeOfDaySettings }) => {
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend.timeOfDaySettings' });

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
        <TimeZoneSelect />

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
