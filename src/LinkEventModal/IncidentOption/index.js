import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { EVENT_FORM_STATES } from '../../constants';
import { PRIORITY_COLOR_MAP } from '../../utils/events';
import useReport from '../../hooks/useReport';

import DateTime from '../../DateTime';
import EventIcon from '../../EventIcon';

import * as styles from './styles.module.scss';

const ADD_LOADER_SIZE = 14;

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

const IncidentOption = ({ incident, isAdding = false, isDisabled = false, onAdd }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'linkEventModal.incidentOption' });
  const { t: tModal } = useTranslation('reports', { keyPrefix: 'linkEventModal' });

  const { displayPriority, displayTitle } = useReport(incident);

  const priorityKey = (PRIORITY_COLOR_MAP[displayPriority] ?? PRIORITY_COLOR_MAP[0]).key;
  const stateKey = STATE_KEY_BY_EVENT_STATE[incident.state];

  return <li className={`${styles.incidentOption} ${styles[priorityKey]}`}>
    <span aria-hidden="true" className={styles.icon}>
      <EventIcon report={incident} />
    </span>

    <span className={styles.serialNumber}>{incident.serial_number}</span>

    <span className={styles.title} title={displayTitle}>{displayTitle}</span>

    <p className={styles.details}>{t('eventCountLabel', { count: incident.contains?.length ?? 0 })}</p>

    <div className={styles.status}>
      {!!stateKey && <span className={`${styles.statusTitle} ${styles[stateKey]}`}>{t(`states.${stateKey}`)}</span>}

      <DateTime className={styles.statusDate} date={incident.updated_at} showElapsed={false} />
    </div>

    <button
      aria-busy={isAdding}
      aria-disabled={isDisabled}
      aria-label={t('addButtonLabel', { serialNumber: incident.serial_number, title: displayTitle })}
      className={styles.addButton}
      onClick={() => onAdd(incident)}
      title={t('addButtonLabel', { serialNumber: incident.serial_number, title: displayTitle })}
      type="button"
    >
      {isAdding ? <MoonLoader aria-hidden color="currentColor" size={ADD_LOADER_SIZE} /> : tModal('addButton')}
    </button>
  </li>;
};

export default IncidentOption;
