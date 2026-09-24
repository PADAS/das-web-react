import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../../../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../../../../common/images/icons/arrow-up.svg';
import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';
import { ReactComponent as SortLinesIcon } from '../../../../../common/images/icons/sort-lines.svg';

import { DEFAULT_EVENT_SORT, EVENT_SORT_OPTIONS, SORT_DIRECTION } from '../../../../../constants';
import navigateMenuWithKeyboard from '../../../../utils/navigateMenuWithKeyboard';
import { TrackerContext } from '../../../../../utils/analytics';
import { updateEventFilter } from '../../../../../ducks/event-filter';

import * as styles from './styles.module.scss';

const NEXT_SORT_DIRECTION_BY_SORT_DIRECTION = {
  [SORT_DIRECTION.down]: SORT_DIRECTION.up,
  [SORT_DIRECTION.up]: SORT_DIRECTION.down,
};

const SortControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'eventFilters.sortControls' });

  const eventSort = useSelector((state) => state.data.eventFilter.filter.sort);

  const tracker = useContext(TrackerContext);

  const sortByMenuItemOptionRefs = useRef([]);

  const sortByMenuPopoverId = useId();

  const [isSortByMenuOpen, setIsSortByMenuOpen] = useState(false);
  const [sortByMenuAnchorEl, setSortByMenuAnchorEl] = useState(null);

  const sortDirection = eventSort[0];
  const sortOption = eventSort[1];

  const isSortAscending = sortDirection === SORT_DIRECTION.up;

  const closeMenu = () => {
    setIsSortByMenuOpen(false);

    sortByMenuAnchorEl?.focus();
  };

  const onMenuKeyDown = (event) => navigateMenuWithKeyboard(
    event,
    sortByMenuItemOptionRefs.current.filter(Boolean),
    closeMenu
  );

  const onSortByMenuOptionClick = (option) => {
    dispatch(updateEventFilter({ filter: { sort: [sortDirection, option] } }));

    tracker.track(`Sort the feed by ${option.value}`);

    closeMenu();
  };

  const onSortDirectionClick = () => {
    const nextSortDirection = NEXT_SORT_DIRECTION_BY_SORT_DIRECTION[sortDirection];

    dispatch(updateEventFilter({ filter: { sort: [nextSortDirection, sortOption] } }));

    tracker.track(`Sort the feed in ${nextSortDirection === SORT_DIRECTION.up ? 'ascending' : 'descending'} order`);
  };

  useEffect(() => {
    if (isSortByMenuOpen) {
      const selectedSortByMenuItemOptionIndex = EVENT_SORT_OPTIONS.findIndex(
        (option) => option.value === sortOption.value
      );
      sortByMenuItemOptionRefs.current[selectedSortByMenuItemOptionIndex]?.focus();
    }
  }, [isSortByMenuOpen, sortOption.value]);

  return <>
    <button
      aria-controls={sortByMenuPopoverId}
      aria-expanded={isSortByMenuOpen}
      aria-haspopup="menu"
      aria-label={t('setSortByButtonLabel', { sortBy: t(`sortByMenuOption.${sortOption.key}`) })}
      className={`${styles.sortingButton} ${sortOption.value === DEFAULT_EVENT_SORT[1].value ? '' : styles.active}`}
      onClick={() => setIsSortByMenuOpen(true)}
      ref={setSortByMenuAnchorEl}
      type="button"
      >
      <SortLinesIcon aria-hidden="true" className={styles.sortingButtonIcon} />

      <span className={styles.sortingButtonLabel}>{t(`sortByMenuOption.${sortOption.key}`)}</span>
    </button>

    <Overlay
      onHide={() => setIsSortByMenuOpen(false)}
      placement="bottom"
      rootClose
      show={isSortByMenuOpen}
      target={sortByMenuAnchorEl}
      >
      <Popover className={styles.sortByMenuPopover} id={sortByMenuPopoverId} role="presentation">
        <ul aria-label={t('sortByMenuLabel')} className={styles.sortByMenu} onKeyDown={onMenuKeyDown} role="menu">
          {EVENT_SORT_OPTIONS.map((option, index) => <li className={styles.sortByMenuItem} key={option.value} role="none">
            <button
              aria-checked={sortOption.value === option.value}
              className={styles.sortByMenuItemOption}
              onClick={() => onSortByMenuOptionClick(option)}
              ref={(element) => {
                sortByMenuItemOptionRefs.current[index] = element;
              }}
              role="menuitemradio"
              tabIndex={-1}
              type="button"
            >
              {sortOption.value === option.value && <CheckIcon aria-hidden="true" className={styles.checkIcon} />}

              {t(`sortByMenuOption.${option.key}`)}
            </button>
          </li>)}
        </ul>
      </Popover>
    </Overlay>

    <button
      aria-label={t(`sortDirectionButtonLabel.${sortDirection}`)}
      className={`${styles.sortDirectionButton} ${isSortAscending ? styles.active : ''}`}
      onClick={onSortDirectionClick}
      title={t(`sortDirectionButtonLabel.${sortDirection}`)}
      type="button"
      >
      {isSortAscending ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />}
    </button>
  </>;
};

export default SortControls;
