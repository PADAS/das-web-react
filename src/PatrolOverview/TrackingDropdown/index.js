import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import SettingsInputAntennaOutlinedIcon from '@mui/icons-material/SettingsInputAntennaOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import FlightOutlinedIcon from '@mui/icons-material/FlightOutlined';

import { ReactComponent as PlaceIcon } from '../../common/images/icons/place.svg';
import { ReactComponent as TracksOffIcon } from '../../common/images/icons/tracks_off.svg';
import { ReactComponent as TracksOnIcon } from '../../common/images/icons/tracks_on.svg';

import useJumpToLocation from '../../hooks/useJumpToLocation';
import { getPatrolTracks } from '../patrolTracksStore';
import { isEntityVisible, setEntityVisible, subscribeVisibility } from '../trackVisibilityStore';

import * as styles from './styles.module.scss';

// Pick a tracking-device icon based on the entity's name.
//   "<Name> (Garmin)" → radio-antenna (handheld tracker)
//   "Helicopter…" / aerial assets → aircraft icon
//   Asset names like "KTN-123" → vehicle icon
//   Team member → smartphone (phone-tracked)
const Icon = ({ name, isAsset }) => {
  const n = name.toLowerCase();
  if (/helicopter|heli|aircraft|h-\d+/.test(n)) return <FlightOutlinedIcon />;
  if (/garmin|radio|gps/.test(n)) return <SettingsInputAntennaOutlinedIcon />;
  if (isAsset) return <DirectionsCarOutlinedIcon />;
  return <PhoneIphoneOutlinedIcon />;
};

const TrackingDropdown = ({ leg, patrolId }) => {
  const [open, setOpen] = useState(false);
  const [, setVisVersion] = useState(0);
  const wrapRef = useRef(null);
  const jumpToLocation = useJumpToLocation();

  // Re-render when global visibility changes (e.g. the global header toggle).
  useEffect(() => subscribeVisibility(() => setVisVersion((v) => v + 1)), []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Combine team members + assets into one flat list. `tracked` controls
  // whether the entity carries a tracking device.
  const entries = [
    ...((leg.teamMembers || []).map((m) => ({
      id: `m-${m.id || m.name}`,
      name: m.name,
      isAsset: false,
      tracked: !!m.tracked,
    }))),
    ...((leg.assets || []).map((a) => ({
      id: `a-${a.id || a.name}`,
      name: a.name,
      isAsset: true,
      tracked: a.tracked !== false,
    }))),
  ];

  const onJump = useCallback((name) => {
    const tracks = getPatrolTracks(patrolId);
    const pts = tracks[name];
    if (!pts?.length) return;
    const last = pts[pts.length - 1];
    jumpToLocation([last.lng, last.lat]);
  }, [patrolId, jumpToLocation]);

  const onToggleTrack = useCallback((name, e) => {
    e.stopPropagation();
    setEntityVisible(patrolId, name, !isEntityVisible(patrolId, name));
  }, [patrolId]);

  return <span
    ref={wrapRef}
    className={styles.wrap}
    onClick={(e) => e.stopPropagation()}
    >
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setOpen((v) => !v)}
      aria-haspopup="true"
      aria-expanded={open}
      aria-label="Show tracking"
    >
      <span className={styles.summary}>{leg.teamSummary}</span>
      <KeyboardArrowDownOutlinedIcon className={styles.chevron} />
    </button>

    {open && <div className={styles.menu} role="menu">
      {entries.length === 0 && (
        <div className={styles.empty}>Nothing being tracked</div>
      )}
      {entries.map((entry) => {
        const vis = isEntityVisible(patrolId, entry.name);
        const tracks = getPatrolTracks(patrolId);
        const hasPosition = (tracks[entry.name]?.length ?? 0) > 0;
        return <div key={entry.id} className={styles.row} role="menuitem">
          <span className={styles.rowIcon}>
            <Icon name={entry.name} isAsset={entry.isAsset} />
          </span>
          <span className={styles.rowName}>{entry.name}</span>
          {entry.tracked && <>
            {hasPosition && <button
              type="button"
              className={styles.actionButton}
              aria-label="Jump to location"
              onClick={(e) => { e.stopPropagation(); onJump(entry.name); }}
            >
              <PlaceIcon />
            </button>}
            <button
              type="button"
              className={`${styles.actionButton} ${vis ? styles.trackButton : ''}`}
              aria-label={vis ? 'Hide tracks' : 'Show tracks'}
              onClick={(e) => onToggleTrack(entry.name, e)}
            >
              {vis ? <TracksOnIcon /> : <TracksOffIcon />}
            </button>
          </>}
        </div>;
      })}
    </div>}
  </span>;
};

export default memo(TrackingDropdown);
