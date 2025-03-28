import React, { useCallback, useEffect, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DayNightIcon } from '../common/images/icons/day-night.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as TracksOffIcon } from '../common/images/icons/tracks_off.svg';

import { BOOTSTRAP_DEFAULTS, FEATURE_FLAG_LABELS } from '../constants';
import { setIsTimeOfDayColoringActive } from '../ducks/tracks';
import { useFeatureFlag } from '../hooks';

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
  itemsName,
  onClickClearTracks,
  onRemoveItemTracks,
  showTimeOfDaySettings = true,
  showTrackSettings = true,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'trackLegend' });

  const timeOfDayTrackingEnabled = useFeatureFlag(FEATURE_FLAG_LABELS.TIME_OF_DAY_TRACKING);

  const isTimeOfDayColoringActive = useSelector((state) => state.view.trackSettings.isTimeOfDayColoringActive);

  // This variable tracks if a menu is expanded, which one it is. There can be only one menu expanded at a time.
  const [expandedMenu, setExpandedMenu] = useState(null);
  // The component starts hidden so the slide in transition effect kicks.
  const [show, setShow] = useState(false);

  const isTimeOfDaySettingsExpanded = expandedMenu === MENUS.TIME_OF_DAY_SETTINGS;
  const isTrackSettingsExpanded = expandedMenu === MENUS.TRACK_SETTINGS;
  const isTracksListExpanded = expandedMenu === MENUS.TRACKS_LIST;

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
    // If there were multiple tracked items, the user could have expanded the tracks list menu. If then the user
    // removes all tracked items but one, we collapse it automatically.
    if (items.length === 1 && isTracksListExpanded) {
      onCollapseMenu();
    }
  }, [dispatch, isTracksListExpanded, items.length]);

  useEffect(() => {
    // If there are tracked items, show the legend. If not, hide it. The state variable is used so the transition
    // effects kick.
    if (!show && items.length > 0) {
      setShow(true);
    } else if (show && items.length === 0) {
      setShow(false);
    }
  }, [items.length, show]);

  return <div
      className={`${styles.trackLegendWrapper} ${show ? styles.show : ''}`}
      data-testid="trackLegend"
    >
    <div className={styles.trackLegend}>
      <div className={styles.row}>
        <div className={styles.titleWrapper} data-testid="trackLegend-titleWrapper">
          {items.length === 1
            ? <>
              {items[0].icon}

              <p className={styles.title} title={items[0].title}>{items[0].title}</p>
            </>
            : <>
              <TracksOffIcon className={styles.tracksOffIcon} />

              <button
                aria-controls="tracksListCollapse"
                aria-expanded={isTracksListExpanded}
                aria-label={t(`tracksListButtonLabel.${isTracksListExpanded ? 'open' : 'closed'}`, { itemsName })}
                className={styles.tracksListButton}
                onClick={() => isTracksListExpanded ? onCollapseMenu() : onExpandMenu(MENUS.TRACKS_LIST)}
                title={t(`tracksListButtonLabel.${isTracksListExpanded ? 'open' : 'closed'}`, { itemsName })}
                type="button"
              >
                {`${items.length} ${itemsName}`}
              </button>
            </>}
        </div>

        <div>
          {timeOfDayTrackingEnabled && showTimeOfDaySettings && <button
            aria-controls="timeOfDaySettings"
            aria-expanded={isTimeOfDayColoringActive}
            aria-label={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            className={`${styles.settingsButton} ${isTimeOfDayColoringActive ? styles.open : ''}`}
            onClick={() => isTimeOfDayColoringActive ? onDeactivateTimeOfDayColoring() : onActivateTimeOfDayColoring()}
            title={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            type="button"
          >
            <DayNightIcon className={styles.icon} />
          </button>}

          {showTrackSettings && <button
            aria-controls="trackSettingsCollapse"
            aria-expanded={isTrackSettingsExpanded}
            aria-label={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            className={`${styles.settingsButton} ${isTrackSettingsExpanded ? styles.open : ''}`}
            onClick={() => isTrackSettingsExpanded ? onCollapseMenu() : onExpandMenu(MENUS.TRACK_SETTINGS)}
            title={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            type="button"
          >
            <GearIcon className={styles.icon} />
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

    <Collapse id="tracksListCollapse" in={isTracksListExpanded}>
      <div>
        <TracksList
          items={items}
          itemsName={itemsName}
          onClose={onCollapseMenu}
          onRemoveItemTracks={onRemoveItemTracks}
        />
      </div>
    </Collapse>

    {showTrackSettings && <Collapse id="trackSettingsCollapse" in={isTrackSettingsExpanded}>
      <div>
        <TrackSettings onClose={onCollapseMenu} />
      </div>
    </Collapse>}

    {timeOfDayTrackingEnabled && showTimeOfDaySettings && <Collapse
      id="timeOfDaySettings"
      in={isTimeOfDayColoringActive}
    >
      <div>
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
