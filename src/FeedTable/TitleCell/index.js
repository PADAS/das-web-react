import { useCallback, useContext, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import FeedTableContext from '../FeedTableContext';

import SelectionCheckbox from '../SelectionCheckbox';

import * as styles from './styles.module.scss';

const isPlainClick = (event) => event.button === 0
  && !event.altKey
  && !event.ctrlKey
  && !event.metaKey
  && !event.shiftKey;

// The row's checkbox, icon and title: the controls the keyboard reaches.
const TitleCell = ({ data, node, renderIcon, value }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.titleCell' });

  const feedTable = useContext(FeedTableContext);

  const subscribeToSelection = useCallback((onChange) => {
    node.addEventListener('rowSelected', onChange);

    return () => node.removeEventListener('rowSelected', onChange);
  }, [node]);
  const isSelected = useSyncExternalStore(subscribeToSelection, () => !!node.isSelected());

  // A modified click opens a new tab as links do; a plain one opens the row
  // the way a row click does, which asks first about unsaved changes.
  const onClickTitle = (event) => {
    if (isPlainClick(event)) {
      event.preventDefault();

      feedTable.onOpenRow(data);
    }
  };

  return <span className={styles.titleCell}>
    {feedTable.isSelectable && <SelectionCheckbox
      aria-label={t('rowCheckboxLabel', { title: value })}
      checked={isSelected}
      onChange={() => node.setSelected(!isSelected)}
    />}

    <span aria-hidden="true" className={styles.icon}>{renderIcon(data)}</span>

    <Link className={styles.titleLink} onClick={onClickTitle} title={value} to={feedTable.getRowPath(data)}>
      {value}
    </Link>
  </span>;
};

export default TitleCell;
