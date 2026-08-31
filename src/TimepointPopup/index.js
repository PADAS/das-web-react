import React, { useEffect, useState } from 'react';
import { isCancel } from 'axios';
import { useDispatch } from 'react-redux';

import { fetchObservationsForSubject } from '../ducks/observations';
import { MAP_INTERACTION_CATEGORY } from '../utils/analytics';

import AddItemButton from '../AddItemButton';
import AdditionalDeviceProperties from '../AdditionalDeviceProperties';
import DateTime from '../DateTime';
import GpsFormatToggle from '../GpsFormatToggle';

import * as styles from './styles.module.scss';

// Track times serialize as UTC and `recorded_at` with the tenant's offset, so the same
// instant differs as a string; a zero-width since==until query also returns nothing. The
// window is wider than the tolerance so a neighbouring observation can be rejected rather
// than being the only thing the query could have returned.
const OBSERVATION_QUERY_WINDOW_MS = 5000;
const MATCH_TOLERANCE_MS = 1000;

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
          since: new Date(targetTime - OBSERVATION_QUERY_WINDOW_MS).toISOString(),
          until: new Date(targetTime + OBSERVATION_QUERY_WINDOW_MS).toISOString(),
          page_size: 100,
        }));

        if (ignore) return;

        // An unparseable `recorded_at` measures as NaN, which compares false against every
        // distance and would otherwise hold the nearest slot against real candidates.
        const candidates = (results ?? [])
          .map((observation) => ({
            distance: Math.abs(new Date(observation.recorded_at).getTime() - targetTime),
            observation,
          }))
          .filter(({ distance }) => !Number.isNaN(distance));

        const nearest = candidates.reduce(
          (closest, candidate) => !closest || candidate.distance < closest.distance ? candidate : closest,
          null
        );

        // Observations equally close to the point give no basis to pick one of them.
        const isAmbiguous = !!nearest
          && candidates.filter(({ distance }) => distance === nearest.distance).length > 1;

        const matchedObservation = !!nearest && !isAmbiguous && nearest.distance <= MATCH_TOLERANCE_MS
          ? nearest.observation
          : undefined;

        setDeviceStatusProperties(matchedObservation?.device_status_properties ?? []);
      } catch (error) {
        if (ignore || isCancel(error)) return;

        console.warn('error fetching observation for track timepoint', error);

        setDeviceStatusProperties([]);
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
