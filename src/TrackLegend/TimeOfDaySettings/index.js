import React, { useId } from 'react';
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

  // Every track legend on the map holds a copy of these settings, so none of
  // them can name its own panel.
  const bodyId = useId();
  const informationTooltipId = useId();

  return <div className={styles.timeOfDaySettings}>
    <div className={styles.header}>
      <div className={styles.titleWrapper}>
        <h2 className={styles.title}>{t('title')}</h2>

        <OverlayTrigger overlay={<Tooltip id={informationTooltipId}>{t('informationTooltip')}</Tooltip>}>
          <InformationIcon className={styles.informationIcon} />
        </OverlayTrigger>
      </div>

      <button
        aria-controls={bodyId}
        aria-expanded={isExpanded}
        aria-label={t(`chevronButtonLabel.${isExpanded ? 'open' : 'closed'}`)}
        className={styles.chevronButton}
        onClick={() => isExpanded ? onCollapseTimeOfDaySettings() : onExpandTimeOfDaySettings()}
        title={t(`chevronButtonLabel.${isExpanded ? 'open' : 'closed'}`)}
        type="button"
      >
        {isExpanded
          ? <ArrowUpSimpleIcon aria-hidden="true" data-testid="timeOfDaySettings-collapseIcon" />
          : <ArrowDownSimpleIcon aria-hidden="true" data-testid="timeOfDaySettings-expandIcon" />}
      </button>
    </div>

    <Collapse id={bodyId} in={isExpanded}>
      <div className={styles.body}>
        <TimeZoneSelect />

        <div className={styles.coloringDescription}>
          <div className={styles.gradient} />

          <ol className={styles.coloredTimesList}>
            {COLORED_TIME_ITEMS.map((coloredTimeItem) => <li className={styles.item} key={coloredTimeItem.key}>
              <span
                aria-label={t(`coloredTimeSquareLabels.${coloredTimeItem.color}`)}
                className={`${styles.square} ${styles[coloredTimeItem.color]}`}
                role="img"
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
