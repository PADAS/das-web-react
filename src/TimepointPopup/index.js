import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { fetchObservationsForSubject } from '../ducks/observations';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import AdditionalDeviceProperties from '../AdditionalDeviceProperties';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

// Track times serialize as UTC and `recorded_at` with the tenant's offset, so the same
// instant differs as a string; a zero-width since==until query also returns nothing.
const TIME_WINDOW_MS = 1000;
const CLOSEST_MATCH_TOLERANCE_MS = 1000;

const TimepointPopup = ({ data }) => {
  const dispatch = useDispatch();

  const subjectId = data.properties.id;
  const time = data.properties.time;

  const [deviceStatusProperties, setDeviceStatusProperties] = useState([]);

  useEffect(() => {
    if (!subjectId || !time) return undefined;

    const targetTime = new Date(time).getTime();
    if (Number.isNaN(targetTime)) return undefined;

    let ignore = false;

    (async () => {
      try {
        const { results } = await dispatch(fetchObservationsForSubject({
          subject_id: subjectId,
          since: new Date(targetTime - TIME_WINDOW_MS).toISOString(),
          until: new Date(targetTime + TIME_WINDOW_MS).toISOString(),
          page_size: 100,
        }));

        if (ignore) return;

        const observations = results ?? [];
        const exactMatch = observations.find(
          (observation) => new Date(observation.recorded_at).getTime() === targetTime
        );
        const closestMatch = observations.reduce((closest, observation) => {
          const distance = Math.abs(new Date(observation.recorded_at).getTime() - targetTime);
          if (!closest || distance < closest.distance) return { observation, distance };
          return closest;
        }, null);

        const closestMatchWithinTolerance = closestMatch?.distance <= CLOSEST_MATCH_TOLERANCE_MS
          ? closestMatch.observation
          : undefined;

        const matchedObservation = exactMatch ?? closestMatchWithinTolerance;
        setDeviceStatusProperties(matchedObservation?.device_status_properties ?? []);
      } catch (error) {
        console.warn('error fetching observation for track timepoint', error);

        if (!ignore) setDeviceStatusProperties([]);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [dispatch, subjectId, time]);

  return <>
    <h4>{data.properties.title || data.properties.name}</h4>

    {time && <DateTime date={time} />}

    <GpsFormatToggle
      lngLat={{ latitude: data.geometry.coordinates[1], longitude: data.geometry.coordinates[0] }}
      name="timepointPopup-gpsFormatToggle"
    />

    <AdditionalDeviceProperties
      className={styles.additionalProperties}
      deviceStatusProperties={deviceStatusProperties}
    />

    <hr />

    <AddItemButton
      analyticsMetadata={{ category: MAP_INTERACTION_CATEGORY, location: 'track timepoint' }}
      reportData={{
        location: {
          latitude: data.geometry.coordinates[1],
          longitude: data.geometry.coordinates[0],
        },
        reportedById: subjectId,
        time,
      }}
      showLabel={false}
    />
  </>;
};

export default TimepointPopup;
