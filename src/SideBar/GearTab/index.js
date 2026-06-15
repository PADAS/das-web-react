import React, { memo, useCallback, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import MoonLoader from 'react-spinners/MoonLoader';
import Collapsible from 'react-collapsible';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchAllGear, hideGearOnMap, showGearOnMap } from '../../ducks/gear';
import { showPopup } from '../../ducks/popup';
import {
  gearHumanReadableLabel,
  gearMatchesSearchQuery,
  getGearRepresentativeCoordinates,
  groupGearByManufacturer,
  sortGearGroupsForSidebar,
  sortGearListForSidebar,
} from '../../utils/gear';
import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../utils/analytics';

import CheckMark from '../../Checkmark';
import CheckableList from '../../CheckableList';
import DateTime from '../../DateTime';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import LocationJumpButton from '../../LocationJumpButton';
import SearchBar from '../../SearchBar';
import SidebarListSortingControls from '../SidebarListSortingControls';

import * as filterStyles from '../MapLayersTab/Filters/styles.module.scss';
import * as mapLayersStyles from '../MapLayersTab/styles.module.scss';
import * as styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};

const manufacturerStateKey = (manufacturerKey) => (manufacturerKey === '' ? '__other' : manufacturerKey);

const gearGroupTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const GEAR_JUMP_ZOOM = 14;
// Approximate downward screen-space offset (px) applied when jumping, so the bottom-anchored gear
// popup has room to open below the gear without clipping the top of the viewport. The value is
// approximate; tall popups (many devices) may still clip.
const GEAR_POPUP_CENTER_OFFSET = [0, 175];

const GearListItem = memo(({ ...gear }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const coordinates = getGearRepresentativeCoordinates(gear);
  const rowTitle = gearHumanReadableLabel(gear) || '—';

  const onJumpClick = useCallback(() => {
    if (!coordinates) return;
    jumpToLocation(coordinates, GEAR_JUMP_ZOOM, { offset: GEAR_POPUP_CENTER_OFFSET });
    window.setTimeout(() => {
      dispatch(showPopup('gear', {
        coordinates,
        geometry: { type: 'Point', coordinates },
        properties: { id: gear.id },
      }));
    }, 0);
  }, [coordinates, dispatch, gear.id, jumpToLocation]);

  return <>
    {coordinates ? (
      <button
        className={`${mapLayersStyles.itemTitle} ${styles.displayId} ${styles.displayIdClickable}`}
        data-testid="gear-item-name"
        onClick={onJumpClick}
        type="button"
      >
        {rowTitle}
      </button>
    ) : (
      <span className={`${mapLayersStyles.itemTitle} ${styles.displayId}`} data-testid="gear-item-name">
        {rowTitle}
      </span>
    )}

    {gear.last_updated && <DateTime
      className={styles.gearDateTime}
      date={gear.last_updated}
    />}

    <div className={mapLayersStyles.controls}>
      {coordinates && <LocationJumpButton
        clickAnalytics={[
          MAP_LAYERS_CATEGORY,
          'Click Jump To Gear Location',
          `Gear:${gear.type || 'unknown'}`,
        ]}
        coordinates={coordinates}
        onClick={onJumpClick}
        zoom={GEAR_JUMP_ZOOM}
      />}
    </div>
  </>;
});

GearListItem.displayName = 'GearListItem';

const GearTab = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('components', { keyPrefix: 'sideBar.gearTab' });
  const { t: tLayerList } = useTranslation('layers', { keyPrefix: 'layerList' });

  const allIds = useSelector((state) => state.data.gear.allIds);
  const byId = useSelector((state) => state.data.gear.byId);
  const gearErrorMessage = useSelector((state) => state.data.gear.error);
  const hiddenGearIds = useSelector((state) => state.data.gear.hiddenGearIds);
  const loading = useSelector((state) => state.data.gear.loading);
  const initialLoadInProgress = useSelector((state) => state.data.gear.initialLoadInProgress);
  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const [filterText, setFilterText] = useState('');
  const [mfrExpanded, setMfrExpanded] = useState({});

  const gearItems = useMemo(
    () => allIds.map((gid) => byId[gid]).filter(Boolean),
    [allIds, byId],
  );

  const filteredGear = useMemo(() => {
    if (!filterText.trim()) return gearItems;
    return gearItems.filter((g) => gearMatchesSearchQuery(g, filterText));
  }, [filterText, gearItems]);

  const sortedFlatGear = useMemo(
    () => sortGearListForSidebar(
      filteredGear,
      mapLayerFilter.sortBy,
      mapLayerFilter.sortDirection,
    ),
    [filteredGear, mapLayerFilter.sortBy, mapLayerFilter.sortDirection],
  );

  const sortedGearGroups = useMemo(
    () => sortGearGroupsForSidebar(
      groupGearByManufacturer(filteredGear),
      mapLayerFilter.sortBy,
      mapLayerFilter.sortDirection,
    ),
    [filteredGear, mapLayerFilter.sortBy, mapLayerFilter.sortDirection],
  );

  const searchActive = filterText.trim().length > 0;

  const isMfrOpen = useCallback((manufacturerKey) => {
    if (searchActive) return true;
    return mfrExpanded[manufacturerStateKey(manufacturerKey)] !== false;
  }, [mfrExpanded, searchActive]);

  const hiddenGearIdSet = useMemo(
    () => new Set(hiddenGearIds || []),
    [hiddenGearIds],
  );

  const isGearVisible = useCallback(
    (gear) => !hiddenGearIdSet.has(gear.id),
    [hiddenGearIdSet],
  );
  const onGearCheckClick = useCallback((gear) => {
    dispatch(isGearVisible(gear) ? hideGearOnMap(gear.id) : showGearOnMap(gear.id));
  }, [dispatch, isGearVisible]);

  const isManufacturerGroupFullyVisible = useCallback((items) => {
    if (!items?.length) return true;
    return items.every((g) => !hiddenGearIdSet.has(g.id));
  }, [hiddenGearIdSet]);

  const isManufacturerGroupPartiallyVisible = useCallback((items) => {
    if (!items?.length) return false;
    const someVisible = items.some((g) => !hiddenGearIdSet.has(g.id));
    const someHidden = items.some((g) => hiddenGearIdSet.has(g.id));
    return someVisible && someHidden;
  }, [hiddenGearIdSet]);

  const onManufacturerGroupCheckClick = useCallback((items, groupTitleForAnalytics) => {
    const ids = items.map((g) => g.id).filter(Boolean);
    if (ids.length === 0) return;
    if (isManufacturerGroupFullyVisible(items)) {
      dispatch(hideGearOnMap(...ids));
      gearGroupTracker.track('Uncheck Group Map Layer checkbox', `GearManufacturer:${groupTitleForAnalytics}`);
    } else {
      dispatch(showGearOnMap(...ids));
      gearGroupTracker.track('Check Group Map Layer checkbox', `GearManufacturer:${groupTitleForAnalytics}`);
    }
  }, [dispatch, isManufacturerGroupFullyVisible]);

  const onRetry = useCallback(() => {
    dispatch(fetchAllGear());
  }, [dispatch]);

  const showNoSearchResults = filterText.trim() && filteredGear.length === 0 && gearItems.length > 0;

  const showInitialLoader = loading && gearItems.length === 0 && !gearErrorMessage;
  const showPaginatingHint = loading && gearItems.length > 0 && initialLoadInProgress;
  const showRefreshHint = loading && gearItems.length > 0 && !initialLoadInProgress;

  return <div className={styles.gearTab}>
    <div aria-label={t('searchFormAriaLabel')} className={`${filterStyles.form} ${styles.filterBar}`} role="search">
      <SearchBar
        className={filterStyles.searchBar}
        disabled={showInitialLoader}
        onChange={(event) => setFilterText(event.target.value)}
        onClear={() => setFilterText('')}
        placeholder={t('searchPlaceholder')}
        value={filterText}
      />

      <SidebarListSortingControls />
    </div>

    {!!gearErrorMessage && !loading && <div className={styles.errorBanner} role="alert">
      <p>{t('loadErrorIntro')}</p>
      <p className={styles.errorDetail}>{gearErrorMessage}</p>
      <Button onClick={onRetry} size="sm" type="button" variant="outline-secondary">
        {t('retryButton')}
      </Button>
    </div>}

    {showInitialLoader && <div className={styles.loaderWrapper}>
      <MoonLoader aria-hidden size={40} />
      <p className={styles.loadingHint}>{t('loadingInitial')}</p>
    </div>}

    {!showInitialLoader && <>
      {showPaginatingHint && <p className={styles.loadingList}>{t('loadingList')}</p>}

      {showRefreshHint && <p className={styles.loadingList}>{t('loading')}</p>}

      {showNoSearchResults && <p className={styles.emptyFilter}>{t('noSearchResults')}</p>}

      {!showNoSearchResults && gearItems.length > 0 && <div className={styles.gearListScroll}>
        {mapLayerFilter.grouped ? <ul className={`${mapLayersStyles.list} ${styles.gearManufacturerList}`}>
          {sortedGearGroups.map(({ manufacturerKey, items }) => {
            const stateKey = manufacturerStateKey(manufacturerKey);
            const open = isMfrOpen(manufacturerKey);
            const groupTitle = manufacturerKey || t('unknownManufacturer');
            return <li key={stateKey}>
              <Collapsible
                {...COLLAPSIBLE_LIST_DEFAULT_PROPS}
                onClosing={() => setMfrExpanded((prev) => ({ ...prev, [stateKey]: false }))}
                onOpening={() => setMfrExpanded((prev) => ({ ...prev, [stateKey]: true }))}
                open={open}
                trigger={<div className={mapLayersStyles.trigger}>
                  <CheckMark
                    fullyChecked={isManufacturerGroupFullyVisible(items)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onManufacturerGroupCheckClick(items, groupTitle);
                    }}
                    partiallyChecked={isManufacturerGroupPartiallyVisible(items)}
                  />
                  <h6>{groupTitle}</h6>
                </div>}
                triggerElementProps={{
                  label: tLayerList(open ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel'),
                  title: tLayerList(open ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle'),
                }}
              >
                <CheckableList
                  className={`${mapLayersStyles.list} ${mapLayersStyles.itemList} ${styles.gearFlatList}`}
                  itemComponent={GearListItem}
                  itemFullyChecked={isGearVisible}
                  items={items}
                  onCheckClick={onGearCheckClick}
                />
              </Collapsible>
            </li>;
          })}
        </ul> : <CheckableList
          className={`${mapLayersStyles.flatCheckableList} ${styles.gearFlatList}`}
          itemComponent={GearListItem}
          itemFullyChecked={isGearVisible}
          items={sortedFlatGear}
          onCheckClick={onGearCheckClick}
        />}
      </div>}
    </>}
  </div>;
};

export default GearTab;
