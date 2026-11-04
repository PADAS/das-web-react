import { memo, useContext } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useTranslation } from 'react-i18next';

import { LINK_TYPES, TAB_KEYS } from '../../../../../constants';
import { TrackerContext } from '../../../../../utils/analytics';

import Link from '../../../../../Link';
import PatrolListItem from '../../../../../PatrolListItem';
import ReportListItem from '../../../../../ReportListItem';

import * as styles from './styles.module.scss';

const REMOVE_LOADER_SIZE = 14;

const REMOVE_BUTTON_LABEL_KEY_BY_LINK_TYPE = {
  [LINK_TYPES.EVENT]: 'removeFromIncidentButtonLabel',
  [LINK_TYPES.PATROL]: 'removeFromPatrolButtonLabel',
};

const LinkItem = ({ isRemoveDisabled = false, isRemoving = false, item, onRemove = null, to, type }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportManager.linksSection.linkItem' });

  const tracker = useContext(TrackerContext);

  // The button stays focusable while a removal runs, so presses are ignored
  // here: disabling the focused button would drop the keyboard focus.
  const onClickRemove = () => {
    if (!isRemoveDisabled) {
      onRemove();
    }
  };

  return <li className={styles.linkItem}>
    {type === LINK_TYPES.PATROL && <Link className={styles.link} to={`/${TAB_KEYS.PATROLS}/${item.id}`}>
      <PatrolListItem
        className={styles.item}
        Component="div"
        patrol={item}
        showControls={false}
        showStateTitle={false}
        showTitleDetails={false}
      />
    </Link>}

    {type === LINK_TYPES.EVENT && <Link
      className={styles.link}
      onClick={() => tracker?.track(`Navigate to ${type} from links section`)}
      to={to}
    >
      <ReportListItem
        className={styles.item}
        Component="div"
        report={item}
        showElapsedTime={false}
        showJumpButton={false}
      />
    </Link>}

    {!!onRemove && <button
      aria-busy={isRemoving}
      aria-disabled={isRemoveDisabled}
      aria-label={t(REMOVE_BUTTON_LABEL_KEY_BY_LINK_TYPE[type], { serialNumber: item.serial_number })}
      className={styles.removeButton}
      onClick={onClickRemove}
      title={t(REMOVE_BUTTON_LABEL_KEY_BY_LINK_TYPE[type], { serialNumber: item.serial_number })}
      type="button"
    >
      <span className={styles.removeButtonLabel}>{t('removeButton')}</span>

      {isRemoving && <MoonLoader aria-hidden color="currentColor" size={REMOVE_LOADER_SIZE} />}
    </button>}
  </li>;
};

export default memo(LinkItem);
