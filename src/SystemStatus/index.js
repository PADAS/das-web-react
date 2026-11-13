import { useCallback, useId, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../common/images/icons/arrow-down-small.svg';

import { calcPrimaryStatusIndicator } from '../utils/system-status';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import { STATUSES, TOP_BAR_POPOVER_POPPER_CONFIG } from '../constants';

import Badge from '../Badge';
import StatusPopover from './StatusPopover';

import * as styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const SystemStatus = () => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'systemStatus' });

  const systemStatus = useSelector((state) => state.data.systemStatus);

  const popoverId = useId();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [systemStatusElement, setSystemStatusElement] = useState(null);
  const [toggleButton, setToggleButton] = useState(null);

  const statusSummary = calcPrimaryStatusIndicator(systemStatus) ?? STATUSES.UNHEALTHY_STATUS;

  const hidePopover = useCallback(() => {
    setIsPopoverOpen(false);

    mainToolbarTracker.track('Close Status Summary Display');
  }, []);

  const onToggleClick = () => {
    setIsPopoverOpen(!isPopoverOpen);

    mainToolbarTracker.track(`${isPopoverOpen ? 'Close' : 'Open'} Status Summary Display`);
  };

  // The popover hangs from a wrapper as tall as the other top bar buttons, so it
  // lines up with their popups rather than sitting under the shorter pill.
  return <div className={styles.systemStatus} ref={setSystemStatusElement}>
    <button
      aria-controls={isPopoverOpen ? popoverId : undefined}
      aria-expanded={isPopoverOpen}
      aria-haspopup="dialog"
      aria-label={t('toggleLabel', { status: t(statusSummary) })}
      className={styles.toggle}
      onClick={onToggleClick}
      ref={setToggleButton}
      title={t('toggleTitle')}
      type="button"
    >
      <Badge aria-hidden="true" className={styles.toggleBadge} status={statusSummary} />

      <span className={styles.statusLabel}>{t(statusSummary)}</span>

      <ArrowDownSmallIcon aria-hidden="true" className={styles.arrow} />
    </button>

    <Overlay
      placement="bottom-end"
      popperConfig={TOP_BAR_POPOVER_POPPER_CONFIG}
      show={isPopoverOpen}
      target={systemStatusElement}
    >
      <StatusPopover id={popoverId} onClose={hidePopover} trigger={toggleButton} />
    </Overlay>
  </div>;
};

export default SystemStatus;
