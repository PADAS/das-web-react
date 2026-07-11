import { createContext, useContext } from 'react';
import { featureCollection } from '@turf/turf';

export const EMPTY_TILE_EVENT_FEATURES = featureCollection([]);

export const TileEventFeaturesContext = createContext(EMPTY_TILE_EVENT_FEATURES);

const useTileEventFeatures = () => useContext(TileEventFeaturesContext);

export default useTileEventFeatures;
