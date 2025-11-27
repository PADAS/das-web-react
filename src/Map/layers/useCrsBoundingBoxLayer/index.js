import { bboxPolygon } from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { hidePopup, showPopup } from '../../../ducks/popup';
import { injectStylesToElement } from '../../../utils/styles';
import { safeRemoveMapLayer, safeRemoveMapSource } from '../../../utils/map';
import { LAYER_IDS, SOURCE_IDS } from '../../../constants';
import { MapContext } from '../../../App';

const BRIGHT_BLUE = '#006cd9';
// For hover effect.
const BRIGHT_BLUE_DARK = '#005fc0';

const CRS_BBOX_CONTROL_MARKER_STYLES = {
  CARET: (isControlMenuOpen) =>  ({
    borderLeft: '0.25rem solid transparent',
    borderRight: '0.25rem solid transparent',
    height: '0',
    marginLeft: '0.5rem',
    width: '0',
    ...(isControlMenuOpen ? { borderBottom: '0.25rem solid white' } : { borderTop: '0.25rem solid white' }),
  }),
  CONTAINER: {
    alignItems: 'center',
    backgroundColor: BRIGHT_BLUE,
    borderRadius: '0.25rem',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    fontSize: '0.875rem',
    padding: '0.25rem',
  },
};

// If the BBOX of a CRS covers over 85% of the latitude and the longitude of
// the Earth, we don't add the layer.
const AXIS_SPAN_THRESHOLD_PERCENTAGE = 0.85;
const LATITUDE_SPAN_THRESHOLD = 180 * AXIS_SPAN_THRESHOLD_PERCENTAGE;
const LONGITUDE_SPAN_THRESHOLD = 360 * AXIS_SPAN_THRESHOLD_PERCENTAGE;

const createCrsBboxControlMakerElement = (crsName, isControlMenuOpen, onClick) => {
  const containerElement = document.createElement('div');
  containerElement.onclick = onClick;
  injectStylesToElement(containerElement, CRS_BBOX_CONTROL_MARKER_STYLES.CONTAINER);
  // Hover effect.
  containerElement.onmouseenter = () => {
    containerElement.style.backgroundColor = BRIGHT_BLUE_DARK;
  };
  containerElement.onmouseleave = () => {
    containerElement.style.backgroundColor = BRIGHT_BLUE;
  };

  const nameElement = document.createElement('span');
  nameElement.textContent = crsName;
  containerElement.appendChild(nameElement);

  const caretElement = document.createElement('div');
  injectStylesToElement(caretElement, CRS_BBOX_CONTROL_MARKER_STYLES.CARET(isControlMenuOpen));
  containerElement.appendChild(caretElement);

  return containerElement;
};

const useCrsBoundingBoxLayer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);
  const popup = useSelector(state => state.view.popup);
  const storedCRS = useSelector((state) => state.view.coordinateReferenceSystems.storedSystems);

  const isControlMenuOpen = popup?.type === 'gps-format-toggle';

  const selectedCrs = useMemo(
    () => storedCRS.find((coordinateReferenceSystem) => coordinateReferenceSystem.code === gpsFormat),
    [gpsFormat, storedCRS]
  );

  // If the map is defined, there is a CRS selected with a BBOX and the bounds
  // don't cover the entirety of the Earth, the layer should be rendered.
  const shouldRenderCrsBoundingBoxLayer = useMemo(() => {
    if (map && selectedCrs?.bbox) {
      const longitudeSpan = Math.abs(selectedCrs.bbox[2] - selectedCrs.bbox[0]);
      const latitudeSpan = Math.abs(selectedCrs.bbox[3] - selectedCrs.bbox[1]);
      return longitudeSpan < LONGITUDE_SPAN_THRESHOLD || latitudeSpan < LATITUDE_SPAN_THRESHOLD;
    }
    return false;
  }, [map, selectedCrs?.bbox]);

  useEffect(() => {
    if (shouldRenderCrsBoundingBoxLayer) {
      // If the CRS BBOX polygon source is not defined yet add it, otherwise
      // update its data.
      const crsBboxSource = map.getSource(SOURCE_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX);
      const crsBboxPolygon = bboxPolygon(selectedCrs.bbox);
      if (!crsBboxSource) {
        map.addSource(
          SOURCE_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX,
          { data: crsBboxPolygon, type: 'geojson' }
        );
      } else {
        crsBboxSource.setData(crsBboxPolygon);
      }

      // Then add the CRS BBOX polygon layer if it is not defined.
      if (!map.getLayer(LAYER_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX)) {
        map.addLayer({
          id: LAYER_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX,
          paint: { 'line-color': BRIGHT_BLUE, 'line-width': 4 },
          source: SOURCE_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX,
          type: 'line',
        });
      }

      return () => {
        safeRemoveMapLayer(map, LAYER_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX);
        safeRemoveMapSource(map, SOURCE_IDS.COORDINATE_REFERENCE_SYSTEM_BBOX);
      };
    }
  }, [map, selectedCrs?.bbox, shouldRenderCrsBoundingBoxLayer]);

  useEffect(() => {
    if (shouldRenderCrsBoundingBoxLayer) {
      const onClick = (event) => {
        // Prevent its event and stop the propagation so other Map listeners
        // are not triggered.
        event.preventDefault();
        event.stopPropagation();

        if (isControlMenuOpen) {
          dispatch(hidePopup());
        } else {
          // If the control menu is closed, calculate the position depending on
          // the current size of the marker and open the menu.
          const markerElementRect = event.currentTarget.getBoundingClientRect();
          dispatch(showPopup('gps-format-toggle', {
            coordinates: [selectedCrs.bbox[0], selectedCrs.bbox[3]],
            popupAttrsOverride: {
              offset: [markerElementRect.width / 2, markerElementRect.height]
            }
          }));
        }
      };
      // Create the CRS BBOX control marker, set its position and add it to the
      // map.
      const crsBboxControlMarker = new mapboxgl.Marker({
        anchor: 'top-left',
        element: createCrsBboxControlMakerElement(selectedCrs.name, isControlMenuOpen, onClick),
      });
      crsBboxControlMarker.setLngLat([selectedCrs.bbox[0], selectedCrs.bbox[3]]).addTo(map);

      return () => {
        crsBboxControlMarker.remove();

        if (isControlMenuOpen) {
          dispatch(hidePopup());
        }
      };
    }
  }, [dispatch, isControlMenuOpen, map, selectedCrs?.bbox, selectedCrs?.name, shouldRenderCrsBoundingBoxLayer]);
};

export default useCrsBoundingBoxLayer;
