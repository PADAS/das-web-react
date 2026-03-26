import React, { memo, useCallback, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import MoonLoader from 'react-spinners/MoonLoader';
import Collapsible from 'react-collapsible';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchAllGear, hideGearOnMap, showGearOnMap } from '../../ducks/gear';
import {
  gearHumanReadableLabel,
  gearMatchesSearchQuery,
  getGearRepresentativeCoordinates,
  groupGearByManufacturer,
} from '../../utils/gear';
import { MAP_LAYERS_CATEGORY } from '../../utils/analytics';

import CheckableList from '../../CheckableList';
import LocationJumpButton from '../../LocationJumpButton';
import SearchBar from '../../SearchBar';

import * as mapLayersStyles from '../MapLayersTab/styles.module.scss';
import * as styles from './styles.module.scss';

const COLLAPSIBLE_LIST_DEFAULT_PROPS = {
  lazyRender: false,
  transitionTime: 1,
};

const manufacturerStateKey = (manufacturerKey) => (manufacturerKey === '' ? '__other' : manufacturerKey);

const GearListItem = memo(({ type, ...gear }) => {
  const coordinates = getGearRepresentativeCoordinates(gear);
  const metaParts = [type].filter(Boolean);
  const rowTitle = gearHumanReadableLabel(gear) || '—';
  return <>
    <p className={mapLayersStyles.itemTitle} data-testid="gear-item-name">
      <span className={styles.displayId}>{rowTitle}</span>
      {metaParts.length > 0 && <span className={styles.metaLine}>{metaParts.join(' · ')}</span>}
    </p>
    <div className={mapLayersStyles.controls}>
      {coordinates && <LocationJumpButton
        clickAnalytics={[
          MAP_LAYERS_CATEGORY,
          'Click Jump To Gear Location',
          `Gear:${type || 'unknown'}`,
        ]}
        coordinates={coordinates}
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
  const fetchError = useSelector((state) => state.data.gear.error);
  const hiddenGearIds = useSelector((state) => state.data.gear.hiddenGearIds);
  const loading = useSelector((state) => state.data.gear.loading);
  const initialLoadInProgress = useSelector((state) => state.data.gear.initialLoadInProgress);

  const errorMessage = useMemo(() => {
    if (!fetchError) return null;
    const data = fetchError.response?.data;
    const detail = data?.detail ?? data?.message;
    if (detail != null) return String(detail);
    return String(fetchError.message || t('loadErrorFallback'));
  }, [fetchError, t]);

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

  const gearGroups = useMemo(
    () => groupGearByManufacturer(filteredGear),
    [filteredGear],
  );

  const searchActive = filterText.trim().length > 0;

  const isMfrOpen = useCallback((manufacturerKey) => {
    if (searchActive) return true;
    return mfrExpanded[manufacturerStateKey(manufacturerKey)] !== false;
  }, [mfrExpanded, searchActive]);

  const isGearVisible = useCallback(
    (gear) => !hiddenGearIds.includes(gear.id),
    [hiddenGearIds],
  );

  const onGearCheckClick = useCallback((gear) => {
    dispatch(isGearVisible(gear) ? hideGearOnMap(gear.id) : showGearOnMap(gear.id));
  }, [dispatch, isGearVisible]);

  const onRetry = useCallback(() => {
    dispatch(fetchAllGear());
  }, [dispatch]);

  const showNoSearchResults = filterText.trim() && filteredGear.length === 0 && gearItems.length > 0;

  const showInitialLoader = loading && gearItems.length === 0 && !errorMessage;
  const showPaginatingHint = loading && gearItems.length > 0 && initialLoadInProgress;
  const showRefreshHint = loading && gearItems.length > 0 && !initialLoadInProgress;

  return <div className={styles.gearTab}>
    <SearchBar
      className={styles.search}
      disabled={showInitialLoader}
      onChange={(event) => setFilterText(event.target.value)}
      onClear={() => setFilterText('')}
      placeholder={t('searchPlaceholder')}
      value={filterText}
    />

    {!!errorMessage && !loading && <div className={styles.errorBanner} role="alert">
      <p>{t('loadErrorIntro')}</p>
      <p className={styles.errorDetail}>{errorMessage}</p>
      <Button onClick={onRetry} size="sm" type="button" variant="outline-secondary">
        {t('retryButton')}
      </Button>
    </div>}

    {showInitialLoader && <div className={styles.loaderWrapper}>
      <MoonLoader aria-hidden size={40} />
      <p className={styles.loadingHint}>{t('loadingInitial')}</p>
    </div>}

    {!showInitialLoader && <>
      {gearItems.length > 0 && <p className={styles.summary}>
        {t('gearCount', { count: gearItems.length })}
      </p>}

      {showPaginatingHint && <p className={styles.loadingList}>{t('loadingList')}</p>}

      {showRefreshHint && <p className={styles.loadingList}>{t('loading')}</p>}

      {showNoSearchResults && <p className={styles.emptyFilter}>{t('noSearchResults')}</p>}

      {!showNoSearchResults && gearItems.length > 0 && <div className={styles.gearListScroll}>
        <ul className={`${mapLayersStyles.list} ${styles.gearManufacturerList}`}>
          {gearGroups.map(({ manufacturerKey, items }) => {
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
        </ul>
      </div>}
    </>}
  </div>;
};

export default GearTab;
