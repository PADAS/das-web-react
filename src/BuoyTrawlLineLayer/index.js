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

const TRAWL_SOURCE_ID = 'trawl-lines-source';
const TRAWL_LAYER_ID = 'trawl-lines-layer';

const subjectIsBuoyLineEligible = (subjectFeature = {}, _index, allSubjects = []) => {
  const subject = subjectFeature.properties;

  const isBuoy = subject.subject_subtype === 'ropeless_buoy_device';
  if (!isBuoy) return false;

  const devices = subject.additional?.devices ?? [];
  const isLine = devices.length > 1;

  if (!isLine) return false;

  const lineContainsValidSubjects = devices.every(({ device_id }) => allSubjects.find(({ properties }) => properties.name === device_id));

  return lineContainsValidSubjects;
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

  useMapSources([{ id: TRAWL_SOURCE_ID, data: trawlLineGeoJSON }]);
  useMapLayers([{
    id: TRAWL_LAYER_ID,
    type: 'line',
    sourceId: TRAWL_SOURCE_ID,
    layout: lineLayout,
    paint: linePaint,
  }]);

  return null;

};

export default BuoyLineLayer;
