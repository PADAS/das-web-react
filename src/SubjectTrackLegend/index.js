import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as DayNightIcon } from '../common/images/icons/day-night.svg';
import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { ReactComponent as TracksOffIcon } from '../common/images/icons/tracks_off.svg';

import { BOOTSTRAP_DEFAULTS } from '../constants';
import { getCurrentLocale } from '../utils/datetime';
import { MAP_INTERACTION_CATEGORY, trackEventFactory } from '../utils/analytics';
import { selectSubjectTracksTrimmedToTrackTimeEnvelope, selectTrackTimeEnvelope } from '../selectors/tracks';
import { setIsTimeOfDayColoringActive } from '../ducks/tracks';
import { updateTrackState } from '../ducks/map-ui';

import DelayedUnmount from '../DelayedUnmount';
import TimeOfDaySettings from './TimeOfDaySettings';
import TrackSettings from './TrackSettings';
import SubjectTracksList from './SubjectTracksList';

import styles from './styles.module.scss';

const MENUS = {
  SUBJECT_TRACKS_LIST: 'SUBJECT_TRACKS_LIST',
  TIME_OF_DAY_SETTINGS: 'TIME_OF_DAY_SETTINGS',
  TRACK_SETTINGS: 'TRACK_SETTINGS',
};

const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);

const SubjectTrackLegend = ({ onClearTracks, subjectTracksCount }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('tracks', { keyPrefix: 'subjectTrackLegend' });

  const isTimeOfDayColoringActive = useSelector((state) => state.view.trackSettings.isTimeOfDayColoringActive);
  const subjectStore = useSelector((state) => state.data.subjectStore);
  const subjectTracksTrimmedToTrackTimeEnvelope = useSelector(selectSubjectTracksTrimmedToTrackTimeEnvelope);
  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);
  const trackTimeEnvelope = useSelector(selectTrackTimeEnvelope);

  // This variable tracks if a menu is expanded, which one it is. There can be only one menu expanded at a time.
  const [expandedMenu, setExpandedMenu] = useState(null);
  // The component starts hidden so the slide in transition effect kicks.
  const [show, setShow] = useState(false);

  const isSubjectTracksListExpanded = expandedMenu === MENUS.SUBJECT_TRACKS_LIST;
  const isTimeOfDaySettingsExpanded = expandedMenu === MENUS.TIME_OF_DAY_SETTINGS;
  const isTrackSettingsExpanded = expandedMenu === MENUS.TRACK_SETTINGS;

  const hasTracksToShow = !!subjectTracksTrimmedToTrackTimeEnvelope.length;

  let title = null;
  let titleIconSrc = null;
  if (subjectTracksCount && hasTracksToShow) {
    if (subjectTracksCount === 1) {
      // If there is a single subject being tracked, we use set its title and image in the legend.
      title = subjectTracksTrimmedToTrackTimeEnvelope[0].track.features[0].properties.title;

      const tracksSubjectId = subjectTracksTrimmedToTrackTimeEnvelope[0].track.features[0].properties.id;
      const tracksImage = subjectTracksTrimmedToTrackTimeEnvelope[0].track.features[0].properties.image;
      const tracksSubjectLastPositionImage = subjectStore[tracksSubjectId]?.last_position?.properties?.image;
      titleIconSrc = tracksSubjectLastPositionImage || tracksImage;
    } else if (subjectTracksCount > 1) {
      // If there are multiple subjects selected, we set a generic title and image.
      title = t('multipleSubjectTracksTitle', { count: subjectTracksCount });
    }
  }

  const trackTimeEnvelopeFormatted = useMemo(
    () => trackTimeEnvelope.until
      ? formatDistance(
        new Date(trackTimeEnvelope.from),
        new Date(trackTimeEnvelope.until),
        { locale: getCurrentLocale() }
      )
      : formatDistanceToNow(new Date(trackTimeEnvelope.from), { locale: getCurrentLocale() }),
    [trackTimeEnvelope.from, trackTimeEnvelope.until]
  );

  const subjectTrackPointCount = useMemo(
    () => subjectTracksTrimmedToTrackTimeEnvelope.reduce(
      (accumulator, subjectTracks) => accumulator + subjectTracks.points.features.length,
      0
    ),
    [subjectTracksTrimmedToTrackTimeEnvelope]
  );

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

  const onDectivateTimeOfDayColoring = useCallback(() => {
    dispatch(setIsTimeOfDayColoringActive(false));

    // When deactivating the time of day coloring, we collapse its menu if it was expanded.
    if (expandedMenu === MENUS.TIME_OF_DAY_SETTINGS) {
      onCollapseMenu();
    }
  }, [dispatch, expandedMenu]);

  const onRemoveSubjectTracks = (subjectId) => {
    dispatch(updateTrackState({
      pinned: subjectTrackState.pinned.filter((pinnedSubjectTracksId) => pinnedSubjectTracksId !== subjectId),
      visible: subjectTrackState.visible.filter((visibleSubjectTracksId) => visibleSubjectTracksId !== subjectId),
    }));

    mapInteractionTracker.track('Remove Subject Tracks Via Track Legend Popover');
  };

  useEffect(() => {
    // If there were multiple subjects, the user could have expanded the subject tracks list menu. If then the user
    // removes all tracked subjects but one, we collapse it automatically.
    if (subjectTracksCount === 1 && expandedMenu === MENUS.SUBJECT_TRACKS_LIST) {
      onCollapseMenu();
    }
  }, [dispatch, expandedMenu, subjectTracksCount]);

  useEffect(() => {
    // If there are tracked subjects, show the legend. If not, hide it. The state variable is used so the transition
    // effects kick.
    if (!show && subjectTracksCount > 0) {
      setShow(true);
    } else if (show && subjectTracksCount === 0) {
      setShow(false);
    }
  }, [show, subjectTracksCount]);

  return <div className={`${styles.subjectTrackLegendWrapper} ${show ? styles.show : ''}`}>
    <div className={styles.subjectTrackLegend}>
      <div className={styles.row}>
        <div className={styles.titleWrapper}>
          {titleIconSrc
            ? <img alt={t('icon', { title })} className={styles.icon} src={titleIconSrc} />
            : <TracksOffIcon className={styles.tracksOffIcon} />}

          {subjectTracksCount > 1
            ? <button
              aria-controls="subjectTracksListCollapse"
              aria-expanded={isSubjectTracksListExpanded}
              aria-label={t(`subjectTracksListButtonLabel.${isSubjectTracksListExpanded ? 'open' : 'closed'}`)}
              className={styles.subjectTracksListButton}
              onClick={() => isSubjectTracksListExpanded ? onCollapseMenu() : onExpandMenu(MENUS.SUBJECT_TRACKS_LIST)}
              title={t(`subjectTracksListButtonLabel.${isSubjectTracksListExpanded ? 'open' : 'closed'}`)}
              type="button"
            >
              {title}
            </button>
            : <p className={styles.title} title={title}>{title}</p>}
        </div>

        <div>
          <button
            aria-controls="timeOfDaySettings"
            aria-expanded={isTimeOfDayColoringActive}
            aria-label={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            className={`${styles.settingsButton} ${isTimeOfDayColoringActive ? styles.open : ''}`}
            onClick={() => isTimeOfDayColoringActive ? onDectivateTimeOfDayColoring() : onActivateTimeOfDayColoring()}
            title={t(`timeOfDaySettingsButtonLabel.${isTimeOfDayColoringActive ? 'active' : 'inactive'}`)}
            type="button"
          >
            <DayNightIcon className={styles.icon} />
          </button>

          <button
            aria-controls="trackSettingsCollapse"
            aria-expanded={isTrackSettingsExpanded}
            aria-label={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            className={`${styles.settingsButton} ${isTrackSettingsExpanded ? styles.open : ''}`}
            onClick={() => isTrackSettingsExpanded ? onCollapseMenu() : onExpandMenu(MENUS.TRACK_SETTINGS)}
            title={t(`trackSettingsButtonLabel.${isTrackSettingsExpanded ? 'open' : 'closed'}`)}
            type="button"
          >
            <GearIcon className={styles.icon} />
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <p className={styles.pointsOverTime}>
          {t('pointsOverTime', { pointCount: subjectTrackPointCount, trackTime: trackTimeEnvelopeFormatted })}
        </p>

        <button className={styles.clearTracksButton} onClick={() => onClearTracks()} type="button">
          {t('clearTracksButton')}
        </button>
      </div>
    </div>

    <Collapse id="subjectTracksListCollapse" in={isSubjectTracksListExpanded}>
      <div>
        <SubjectTracksList
          onClose={onCollapseMenu}
          onRemoveSubjectTracks={onRemoveSubjectTracks}
          subjectTracks={subjectTracksTrimmedToTrackTimeEnvelope}
        />
      </div>
    </Collapse>

    <Collapse id="trackSettingsCollapse" in={isTrackSettingsExpanded}>
      <div>
        <TrackSettings onClose={onCollapseMenu} />
      </div>
    </Collapse>

    <Collapse id="timeOfDaySettings" in={isTimeOfDayColoringActive}>
      <div>
        <TimeOfDaySettings
          isExpanded={isTimeOfDaySettingsExpanded}
          onCollapseTimeOfDaySettings={onCollapseMenu}
          onExpandTimeOfDaySettings={() => onExpandMenu(MENUS.TIME_OF_DAY_SETTINGS)}
        />
      </div>
    </Collapse>
  </div>;
};

// Wrap the component with a delayed unmount so the slide out transition ends before unmounting.
const SubjectTrackLegendDelayedUnmount = ({ onClearTracks }) => {
  const subjectTrackState = useSelector((state) => state.view.subjectTrackState);

  const subjectTracksCount = useMemo(
    () => uniq([...subjectTrackState.visible, ...subjectTrackState.pinned]).length,
    [subjectTrackState.pinned, subjectTrackState.visible]
  );

  // We unmount the component after the collapse transition ends when there are no more subject tracks.
  return <DelayedUnmount delay={BOOTSTRAP_DEFAULTS.COLLAPSE_TRANSITION_TIME} isMounted={subjectTracksCount > 0}>
    <SubjectTrackLegend onClearTracks={onClearTracks} subjectTracksCount={subjectTracksCount} />
  </DelayedUnmount>;
};

export default SubjectTrackLegendDelayedUnmount;
