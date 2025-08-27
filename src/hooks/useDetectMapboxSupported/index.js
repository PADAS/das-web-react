import mapboxgl from 'mapbox-gl';

const useDetectMapboxSupported = () => {
  return !!mapboxgl.supported();
};

export default useDetectMapboxSupported;