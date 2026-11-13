import { useId } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as InformationIcon } from '../../common/images/icons/information.svg';

import TimeZoneSelect from './TimeZoneSelect';

import { TIME_OF_DAY_PERIODS } from '../../constants';
import { tokenVar } from '../../utils/colors';

import * as styles from './styles.module.scss';

const COLORED_TIME_ITEMS = [
  {
    colorName: 'titaniumYellow',
    key: 0,
    period: TIME_OF_DAY_PERIODS[0],
  },
  {
    colorName: 'americanYellow',
    key: 1,
    period: TIME_OF_DAY_PERIODS[1],
  },
  {
    colorName: 'fandangoPink',
    key: 2,
    period: TIME_OF_DAY_PERIODS[2],
  },
  {
    colorName: 'purplePlum',
    key: 3,
    period: TIME_OF_DAY_PERIODS[3],
  },
  {
    colorName: 'majorelleBlue',
    key: 4,
    period: TIME_OF_DAY_PERIODS[4],
  },
  {
    colorName: 'lapisLazuli',
    key: 5,
    period: TIME_OF_DAY_PERIODS[5],
  },
  {
    colorName: 'spanishGreen',
    key: 6,
    period: TIME_OF_DAY_PERIODS[6],
  },
  {
    colorName: 'green',
    key: 7,
    period: TIME_OF_DAY_PERIODS[7],
  },
  {
    colorName: 'titaniumYellow',
    key: 8,
    period: TIME_OF_DAY_PERIODS[0],
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
                aria-label={t(`coloredTimeSquareLabels.${coloredTimeItem.colorName}`)}
                className={styles.square}
                role="img"
                style={{ backgroundColor: tokenVar(coloredTimeItem.period.colorToken) }}
              />

              <span>{coloredTimeItem.period.rangeString}</span>
            </li>)}
          </ol>
        </div>
      </div>
    </Collapse>
  </div>;
};

export default TimeOfDaySettings;
