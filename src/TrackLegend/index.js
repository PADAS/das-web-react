import React, { useCallback, useEffect, useId, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as DayNightIcon } from '../common/images/icons/day-night.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as TracksOffIcon } from '../common/images/icons/tracks_off.svg';

import { BOOTSTRAP_DEFAULTS } from '../constants';
import { setIsTimeOfDayColoringActive } from '../ducks/tracks';

import DelayedUnmount from '../DelayedUnmount';
import TimeOfDaySettings from './TimeOfDaySettings';
import TrackSettings from './TrackSettings';
import TracksList from './TracksList';

import * as styles from './styles.module.scss';

const MENUS = {
  TIME_OF_DAY_SETTINGS: 'TIME_OF_DAY_SETTINGS',
  TRACK_SETTINGS: 'TRACK_SETTINGS',
  TRACKS_LIST: 'TRACKS_LIST',
};

const TrackLegend = ({
  description,
  items,
  itemsIcon = <TracksOffIcon className={styles.tracksOffIcon} data-testid="trackLegend-tracksOffIcon" />,
  itemsName,
  onClearItemTracks,
  onClickClearTracks,
  onToggleItemChildTracks,
  showTimeOfDaySettings = true,
  showTrackSettings = true,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend' });

  const isTimeOfDayColoringActive = useSelector((state) => state.view.trackSettings.isTimeOfDayColoringActive);

  // The map holds a legend per kind of track, each with a menu of its own, so
  // no panel here can name itself.
  const timeOfDaySettingsId = useId();
  const trackSettingsId = useId();
  const tracksListId = useId();

  // This variable tracks if a menu is expanded, which one it is. There can be only one menu expanded at a time.
  const [expandedMenu, setExpandedMenu] = useState(null);
  // The component starts hidden so the slide in transition effect kicks.
  const [show, setShow] = useState(false);

  // A lone item still has a list worth opening when it owns rows of its own.
  const hasNestedItems = items.some((item) => !!item.children?.length);
  // The legend outlives its items: clearing the tracks leaves it sliding out
  // with nothing left to take an icon or a title from.
  const hasItems = items.length > 0;
  const hasSingleItem = items.length === 1;
  const hasTracksList = items.length > 1 || hasNestedItems;

  const legendTitle = hasSingleItem ? items[0].title : `${items.length} ${itemsName}`;

  const isTimeOfDaySettingsExpanded = expandedMenu === MENUS.TIME_OF_DAY_SETTINGS;
  const isTrackSettingsExpanded = expandedMenu === MENUS.TRACK_SETTINGS;
  // A list the legend has stopped offering closes itself.
  const isTracksListExpanded = hasTracksList && expandedMenu === MENUS.TRACKS_LIST;

  const onCollapseMenu = () => setExpandedMenu(null);

  const onExpandMenu = (menu) => {
    if (!expandedMenu) {
      // If no menu is currently expanded, we just expand the requested one.
      setExpandedMenu(menu);
    } else {
      // If there is a menu expanded, we first collapse it and then expand the new one.
      onCollapseMenu();
      setTimeout(() => setExpandedMenu(menu), BOOTSTRAP_DEFAULTS.COLLAPSE_TRANSITION_TIME);
    }
  };

  const onActivateTimeOfDayColoring = () => {
    // When activating the time of day coloring, we also expand its menu.
    dispatch(setIsTimeOfDayColoringActive(true));
    onExpandMenu(MENUS.TIME_OF_DAY_SETTINGS);
  };

  const onDeactivateTimeOfDayColoring = useCallback(() => {
    dispatch(setIsTimeOfDayColoringActive(false));

    // When deactivating the time of day coloring, we collapse its menu if it was expanded.
    if (isTimeOfDaySettingsExpanded) {
      onCollapseMenu();
    }
  }, [dispatch, isTimeOfDaySettingsExpanded]);

  useEffect(() => {
    if (!hasItems) {
      return undefined;
    }

    // The legend slides in, so it has to paint hidden once before it shows.
    const frame = requestAnimationFrame(() => setShow(true));

    return () => {
      cancelAnimationFrame(frame);

      setShow(false);
    };
  }, [hasItems]);

  return <div
    className={`${styles.trackLegendWrapper} ${show ? styles.show : ''}`}
    data-testid="trackLegend"
    >
    <div className={styles.trackLegend}>
      <div className={styles.row}>
        <div className={styles.titleWrapper} data-testid="trackLegend-titleWrapper">
          <span className={styles.itemIcon}>
            {hasSingleItem ? items[0].icon : itemsIcon}
          </span>

          <p className={styles.title}>{legendTitle}</p>
        </div>

        <div className={styles.settingsButtons}>
          {showTimeOfDaySettings && <button
            aria-controls={timeOfDaySettingsId}
            aria-expanded={isTimeOfDayColoringActive}
            aria-label={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            className={`${styles.settingsButton} ${isTimeOfDayColoringActive ? styles.active : ''}`}
            onClick={() => isTimeOfDayColoringActive ? onDeactivateTimeOfDayColoring() : onActivateTimeOfDayColoring()}
            title={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            type="button"
          >
            <DayNightIcon aria-hidden="true" />
          </button>}

          {showTrackSettings && <button
            aria-controls={trackSettingsId}
            aria-expanded={isTrackSettingsExpanded}
            aria-label={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            className={`${styles.settingsButton} ${isTrackSettingsExpanded ? styles.active : ''}`}
            onClick={() => isTrackSettingsExpanded ? onCollapseMenu() : onExpandMenu(MENUS.TRACK_SETTINGS)}
            title={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            type="button"
          >
            <GearIcon aria-hidden="true" />
          </button>}

          {hasTracksList && <button
            aria-controls={tracksListId}
            aria-expanded={isTracksListExpanded}
            aria-label={t(`tracksListButtonLabel.${isTracksListExpanded ? 'open' : 'closed'}`, { itemsName })}
            className={`${styles.settingsButton} ${isTracksListExpanded ? styles.active : ''}`}
            onClick={() => isTracksListExpanded ? onCollapseMenu() : onExpandMenu(MENUS.TRACKS_LIST)}
            title={t(`tracksListButtonLabel.${isTracksListExpanded ? 'open' : 'closed'}`, { itemsName })}
            type="button"
          >
            {isTracksListExpanded
              ? <ArrowUpSimpleIcon aria-hidden="true" />
              : <ArrowDownSimpleIcon aria-hidden="true" />}
          </button>}
        </div>
      </div>

      <div className={styles.row}>
        <p className={styles.pointsOverTime}>{description}</p>

        <button className={styles.clearTracksButton} onClick={onClickClearTracks} type="button">
          {t('clearTracksButton')}
        </button>
      </div>
    </div>

    {/* Each menu holds collapses of its own, and a nested one still animating
        is one the height of this transition measures too short, opening the
        menu in two steps. Unmounting a closed menu has its collapses mount
        open instead, at their full height. The wrapper carries the gap for the
        same reason: a margin on the panel collapses out of that measurement. */}
    <Collapse id={tracksListId} in={isTracksListExpanded} unmountOnExit>
      <div className={styles.collapseWrapper}>
        <TracksList
          items={items}
          onClearItemTracks={onClearItemTracks}
          onToggleItemChildTracks={onToggleItemChildTracks}
          showTrackColors={!isTimeOfDayColoringActive}
        />
      </div>
    </Collapse>

    {showTrackSettings && <Collapse id={trackSettingsId} in={isTrackSettingsExpanded} unmountOnExit>
      <div className={styles.collapseWrapper}>
        <TrackSettings />
      </div>
    </Collapse>}

    {showTimeOfDaySettings && <Collapse
      id={timeOfDaySettingsId}
      in={isTimeOfDayColoringActive}
      unmountOnExit
    >
      <div className={styles.collapseWrapper}>
        <TimeOfDaySettings
          isExpanded={isTimeOfDaySettingsExpanded}
          onCollapseTimeOfDaySettings={onCollapseMenu}
          onExpandTimeOfDaySettings={() => onExpandMenu(MENUS.TIME_OF_DAY_SETTINGS)}
        />
      </div>
    </Collapse>}
  </div>;
};

// Wrap the component with a delayed unmount so the slide out transition ends before unmounting.
const TrackLegendDelayedUnmount = ({ items, ...otherProps }) => <DelayedUnmount
  delay={BOOTSTRAP_DEFAULTS.COLLAPSE_TRANSITION_TIME}
  isMounted={items.length > 0}
  >
  <TrackLegend items={items} {...otherProps} />
</DelayedUnmount>;

export default TrackLegendDelayedUnmount;
