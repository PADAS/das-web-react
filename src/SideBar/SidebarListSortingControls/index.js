import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';
import { ReactComponent as SortLinesIcon } from '../../common/images/icons/sort-lines.svg';

import { MAP_LAYER_SORT_OPTIONS, MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../constants';
import {
  setMapLayersGrouped,
  setMapLayersSortBy,
  setMapLayersSortDirection,
} from '../../ducks/map-layer-filter';
import useMenuToggle from '../../hooks/useMenuToggle';

import Menu from '../../Menu';

import * as styles from './styles.module.scss';

const SidebarListSortingControls = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'mapLayerFilter' });

  const menuToggle = useMenuToggle();

  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  return <div className={styles.sortingButtons}>
    <button
      aria-label={t(`groupButtonLabel.${mapLayerFilter.grouped ? 'grouped' : 'ungrouped'}`)}
      aria-pressed={!mapLayerFilter.grouped}
      className={`${styles.sortingButton} ${mapLayerFilter.grouped ? '' : styles.active}`}
      onClick={() => dispatch(setMapLayersGrouped(!mapLayerFilter.grouped))}
      type="button"
    >
      <span className={styles.sortingButtonLabel}>
        {t(`groupButton.${mapLayerFilter.grouped ? 'grouped' : 'ungrouped'}`)}
      </span>
    </button>

    <button
      aria-label={t('setSortByButtonLabel')}
      className={`${styles.sortingButton} ${
        mapLayerFilter.sortBy === MAP_LAYER_SORT_VALUES.LAST_UPDATE ? '' : styles.active
      }`}
      type="button"
      {...menuToggle.toggleProps}
    >
      <SortLinesIcon aria-hidden="true" className={styles.sortingButtonIcon} />

      <span className={styles.sortingButtonLabel}>{t(`setSortByButton.${mapLayerFilter.sortBy}`)}</span>
    </button>

    <Menu
      aria-label={t('sortByMenuLabel')}
      className={styles.sortByMenu}
      placement="bottom"
      {...menuToggle.menuProps}
    >
      {MAP_LAYER_SORT_OPTIONS.map((option) => <Menu.Option
        aria-checked={mapLayerFilter.sortBy === option.value}
        aria-label={t(`sortByMenuOptionLabel.${option.key}`)}
        key={option.value}
        onClick={() => dispatch(setMapLayersSortBy(option.value))}
        role="menuitemradio"
      >
        {t(`sortByMenuOption.${option.key}`)}
      </Menu.Option>)}
    </Menu>

    <button
      aria-pressed={mapLayerFilter.sortDirection === SORT_DIRECTION.up}
      aria-label={t(`sortDirectionButtonLabel.${mapLayerFilter.sortDirection}`)}
      className={`${styles.sortDirectionButton} ${mapLayerFilter.sortDirection === SORT_DIRECTION.up ? styles.active : ''}`}
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
