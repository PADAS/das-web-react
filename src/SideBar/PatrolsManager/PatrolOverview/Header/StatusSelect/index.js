import { memo, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import getPatrolStatusOptions from '../../../utils/getPatrolStatusOptions';
import getPatrolStatusTransition from '../../../utils/getPatrolStatusTransition';
import { TrackerContext } from '../../../../../utils/analytics';
import useMenuToggle from '../../../../../hooks/useMenuToggle';
import { usePatrolsPermissions } from '../../../../../hooks/usePermissions';

import Menu from '../../../../../Menu';
import StatusPill from '../../../StatusPill';

import * as styles from './styles.module.scss';

const StatusSelect = ({ isDirty, onSelect, patrol, patrolState, state }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.header' });
  const { t: tStatusPill } = useTranslation('patrols', { keyPrefix: 'statusPill' });
  const { t: tStatusTransitions } = useTranslation('patrols', { keyPrefix: 'statusTransitions' });

  const menuToggle = useMenuToggle();
  const { hasPatrolsUpdatePermission } = usePatrolsPermissions();

  const tracker = useContext(TrackerContext);

  const options = getPatrolStatusOptions(patrol, patrolState);

  const onOptionClick = (option) => {
    onSelect(option);

    tracker.track('Select a status from patrol overview', option.key);
  };

  if (!hasPatrolsUpdatePermission || options.length < 2) {
    return <StatusPill isDirty={isDirty} state={state} />;
  }

  return <>
    <StatusPill
      aria-label={`${tStatusPill(`uiStateTitles.${state.key}`)}, ${t('statusSelectLabel')}`}
      as="button"
      className={styles.statusPillButton}
      isDirty={isDirty}
      state={state}
      title={t('statusSelectLabel')}
      type="button"
      {...menuToggle.toggleProps}
      >
      <span aria-hidden="true" className={`${styles.caret} ${menuToggle.menuProps.show ? styles.open : ''}`} />
    </StatusPill>

    <Menu
      aria-label={t('statusMenuLabel')}
      className={styles.menu}
      placement="bottom-end"
      {...menuToggle.menuProps}
    >
      {options.map((option) => {
        // Only the state the patrol is in already names itself; the rest
        // are named after the move that reaches them, which makes them
        // commands rather than a set to choose one of.
        const transition = getPatrolStatusTransition(patrolState, option);

        return <Menu.Option
          aria-current={option === state || undefined}
          key={option.key}
          onClick={() => onOptionClick(option)}
        >
          {transition ? tStatusTransitions(transition) : tStatusPill(`uiStateTitles.${option.key}`)}
        </Menu.Option>;
      })}
    </Menu>
  </>;
};

export default memo(StatusSelect);
