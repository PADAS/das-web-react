import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { EVENT_FORM_STATES } from '../../../../../constants';
import useMenuToggle from '../../../../../hooks/useMenuToggle';

import Menu from '../../../../../Menu';

import * as styles from './styles.module.scss';

const { ACTIVE, NEW_LEGACY, RESOLVED, REVIEW } = EVENT_FORM_STATES;

const STATES = [ACTIVE, REVIEW, RESOLVED];

const TRANSITIONS_BY_STATE = {
  [ACTIVE]: { [RESOLVED]: 'resolve', [REVIEW]: 'review' },
  [RESOLVED]: { [ACTIVE]: 'reopen', [REVIEW]: 'review' },
  [REVIEW]: { [ACTIVE]: 'activate', [RESOLVED]: 'resolve' },
};

const normalizeState = (state) => state === NEW_LEGACY ? ACTIVE : state;

const StatusSelect = ({ isDirty, onSelect, savedState, state }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.statusSelect' });

  const menuToggle = useMenuToggle();

  const currentState = normalizeState(state);
  const savedStateKey = normalizeState(savedState);

  // The saved state leads, as the one the rest are moves away from.
  const options = [savedStateKey, ...STATES.filter((option) => option !== savedStateKey)];

  return <>
    <button
      aria-label={`${t(`states.${currentState}`)}, ${t('statusSelectLabel')}`}
      className={`${styles.statusPill} ${styles[currentState]}`}
      title={t('statusSelectLabel')}
      type="button"
      {...menuToggle.toggleProps}
      >
      <span className={isDirty ? styles.unsavedLabel : undefined}>{t(`states.${currentState}`)}</span>

      <span aria-hidden="true" className={`${styles.caret} ${menuToggle.menuProps.show ? styles.open : ''}`} />
    </button>

    <Menu
      aria-label={t('statusMenuLabel')}
      className={styles.menu}
      placement="bottom-end"
      {...menuToggle.menuProps}
    >
      {options.map((option) => {
        // Only the saved state names itself; the rest are named after the
        // move that reaches them, which makes them commands.
        const transition = TRANSITIONS_BY_STATE[savedStateKey]?.[option];

        return <Menu.Option
          aria-current={option === currentState || undefined}
          key={option}
          onClick={() => onSelect(option)}
        >
          {transition ? t(`stateTransitions.${transition}`) : t(`states.${option}`)}
        </Menu.Option>;
      })}
    </Menu>
  </>;
};

export default memo(StatusSelect);
