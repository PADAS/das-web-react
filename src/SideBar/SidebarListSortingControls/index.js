import React, { useEffect, useId, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';
import { ReactComponent as CheckIcon } from '../../common/images/icons/check-light.svg';
import { ReactComponent as SortLinesIcon } from '../../common/images/icons/sort-lines.svg';

import { MAP_LAYER_SORT_OPTIONS, MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../constants';
import {
  setMapLayersGrouped,
  setMapLayersSortBy,
  setMapLayersSortDirection,
} from '../../ducks/map-layer-filter';

import * as styles from '../MapLayersTab/Filters/styles.module.scss';

/**
 * Group / sort-by / sort-direction controls shared by Map Layers → Subjects and Gear tab.
 * Reads and updates {@link state.data.mapLayerFilter} (persisted).
 */
const SidebarListSortingControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'mapLayerFilter' });

  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const sortByMenuItemOptionRefs = useRef([]);

  const sortByMenuPopoverId = useId();

  const [isSortByMenuOpen, setIsSortByMenuOpen] = useState(false);
  const [sortByMenuAnchorEl, setSortByMenuAnchorEl] = useState(null);

  const onMenuClose = () => {
    setIsSortByMenuOpen(false);
    sortByMenuAnchorEl?.focus();
  };

  const onMenuKeyDown = (event) => {
    const currentIndex = sortByMenuItemOptionRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );

    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      {
        const nextIndex = (currentIndex + 1) % sortByMenuItemOptionRefs.current.length;
        sortByMenuItemOptionRefs.current[nextIndex]?.focus();
      }

      break;

    case 'ArrowUp':
      event.preventDefault();

      {
        const prevIndex = (currentIndex - 1 + sortByMenuItemOptionRefs.current.length)
          % sortByMenuItemOptionRefs.current.length;
        sortByMenuItemOptionRefs.current[prevIndex]?.focus();
      }

      break;

    case 'End':
      event.preventDefault();

      sortByMenuItemOptionRefs.current[sortByMenuItemOptionRefs.current.length - 1]?.focus();

      break;

    case 'Home':
      event.preventDefault();

      sortByMenuItemOptionRefs.current[0]?.focus();

      break;

    case 'Tab':
    case 'Escape':
      event.preventDefault();

      onMenuClose();

      break;

    default:
    }
  };

  const onSortByMenuOptionClick = (sortBy) => {
    dispatch(setMapLayersSortBy(sortBy));
    onMenuClose();
  };

  useEffect(() => {
    if (isSortByMenuOpen) {
      const selectedSortByMenuItemOptionIndex = MAP_LAYER_SORT_OPTIONS.findIndex(
        (option) => option.value === mapLayerFilter.sortBy
      );
      sortByMenuItemOptionRefs.current[selectedSortByMenuItemOptionIndex]?.focus();
    }
  }, [isSortByMenuOpen, mapLayerFilter.sortBy]);

  return <div className={styles.sortingButtons}>
    <button
      aria-label={t(`groupButtonLabel.${mapLayerFilter.grouped ? 'grouped' : 'ungrouped'}`)}
      aria-pressed={!mapLayerFilter.grouped}
      className={`${styles.sortingButton} ${mapLayerFilter.grouped ? styles.inactive : styles.active}`}
      onClick={() => dispatch(setMapLayersGrouped(!mapLayerFilter.grouped))}
      title={t(`groupButtonLabel.${mapLayerFilter.grouped ? 'grouped' : 'ungrouped'}`)}
      type="button"
    >
      {t(`groupButton.${mapLayerFilter.grouped ? 'grouped' : 'ungrouped'}`)}
    </button>

    <button
      aria-controls={sortByMenuPopoverId}
      aria-expanded={isSortByMenuOpen}
      aria-haspopup="menu"
      aria-label={t('setSortByButtonLabel')}
      className={`${styles.sortingButton} ${
        mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE ? styles.inactive : styles.active
      }`}
      onClick={() => setIsSortByMenuOpen(true)}
      ref={setSortByMenuAnchorEl}
      title={t('setSortByButtonLabel')}
      type="button"
    >
      <SortLinesIcon className={styles.sortingButtonIcon} />

      {t(`setSortByButton.${mapLayerFilter.sortBy}`)}
    </button>

    <Overlay
      placement="bottom"
      onHide={() => setIsSortByMenuOpen(false)}
      rootClose
      show={isSortByMenuOpen}
      target={sortByMenuAnchorEl}
    >
      <Popover className={styles.sortByMenuPopover} id={sortByMenuPopoverId}>
        <ul aria-label={t('sortByMenuLabel')} className={styles.sortByMenu} onKeyDown={onMenuKeyDown} role="menu">
          {MAP_LAYER_SORT_OPTIONS.map((option, index) => <li
            className={styles.sortByMenuItem}
            key={option.value}
          >
            <button
              aria-label={t(`sortByMenuOptionLabel.${option.key}`)}
              aria-checked={mapLayerFilter.sortBy === option.value}
              className={styles.sortByMenuItemOption}
              onClick={() => onSortByMenuOptionClick(option.value)}
              ref={(element) => {
                sortByMenuItemOptionRefs.current[index] = element;
              }}
              role="menuitemradio"
              tabIndex={-1}
              title={t(`sortByMenuOptionLabel.${option.key}`)}
              type="button"
            >
              {mapLayerFilter.sortBy === option.value && <CheckIcon className={styles.checkIcon} />}

              {t(`sortByMenuOption.${option.key}`)}
            </button>
          </li>)}
        </ul>
      </Popover>
    </Overlay>

    <button
      aria-pressed={mapLayerFilter.sortDirection === SORT_DIRECTION.up}
      aria-label={t(`sortDirectionButtonLabel.${mapLayerFilter.sortDirection}`)}
      className={`${styles.sortingButton} ${mapLayerFilter.sortDirection === SORT_DIRECTION.up ? styles.active : styles.inactive}`}
      onClick={() => dispatch(setMapLayersSortDirection(
        mapLayerFilter.sortDirection === SORT_DIRECTION.up ? SORT_DIRECTION.down : SORT_DIRECTION.up
      ))}
      title={t(`sortDirectionButtonLabel.${mapLayerFilter.sortDirection}`)}
      type="button"
    >
      {mapLayerFilter.sortDirection === SORT_DIRECTION.down
        ? <ArrowDownIcon data-testid="arrow-down-icon" />
        : <ArrowUpIcon data-testid="arrow-up-icon" />}
    </button>
  </div>;
};

export default SidebarListSortingControls;
