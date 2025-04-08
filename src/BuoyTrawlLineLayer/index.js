import React from 'react';
import { useSelector } from 'react-redux';

import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { lineString } from '@turf/turf';
import useMapLayers from '../hooks/useMapLayers';
import useMapSources from '../hooks/useMapSources';

const lineLayout = {
  'line-join': 'round',
  'line-cap': 'round',
};

const linePaint = {
  'line-color': 'black',
  'line-opacity': 0.7,
  'line-gap-width': 1,
  'line-width': 2,
};

const subjectIsBuoyLineEligible = (subjectFeature = {}, _index, allSubjects = []) => {
  const subject = subjectFeature.properties;

  const is_buoy = subject.subject_subtype === 'ropeless_buoy_device';
  if (!is_buoy) return false;

  const devices = subject.additional?.devices ?? [];
  const is_line = devices.length > 1;

  if (!is_line) return false;

  const line_contains_valid_subjects = devices.every(({ device_id }) => allSubjects.find(({ properties }) => properties.name === device_id));

  return line_contains_valid_subjects;
};

const createTrawlLineGeoJSON = (buoySubjectFeatures) => {
  return buoySubjectFeatures.reduce((accumulator, { properties }) => {
    const coordinates =
      properties.additional.devices.map(({ device_id }) =>
        buoySubjectFeatures.find(({ properties }) =>
          properties.name === device_id)?.geometry?.coordinates ?? []
      );

    accumulator.features.push(lineString(coordinates));
    return accumulator;

  }, { type: 'FeatureCollection', features: [] });
};

const BuoyLineLayer = (_props) => {
  const mapSubjects = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const buoySubjects = mapSubjects.features.filter(subjectIsBuoyLineEligible);
  const trawlLineGeoJSON = createTrawlLineGeoJSON(buoySubjects);

  useMapSources([{ id: 'trawl-lines-source', data: trawlLineGeoJSON }]);
  useMapLayers([{
    id: 'trawl-lines-layer',
    type: 'line',
    sourceId: 'trawl-lines-source',
    layout: lineLayout,
    paint: linePaint,
  }]);

  return null;

};

export default BuoyLineLayer;
