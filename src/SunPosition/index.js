import React, { useEffect, useMemo } from 'react'; /* eslint-disable-line no-unused-vars */
import { connect } from 'react-redux';

import { getSunPosition, updateSunPosition } from '../utils/sky';

const SunPosition = (props) => {
  const { map /* sunPositionDate, virtualizeSunPosition */ } = props;

  const sunPosition = useMemo(() => {
    /* if (!virtualizeSunPosition)  */return [0, 0];

    // return getSunPosition(map, sunPositionDate || new Date());
  }, []);
  
  useEffect(() => {
  /*   const updateSun = () => {
      const position = getSunPosition(map, new Date(sunPositionDate));
      updateSunPosition(map, position);
    }; */

    if (!map.getLayer('sky')) {
      map.addLayer({
        'id': 'sky',
        'type': 'sky',
        'paint': {
          'sky-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0,
            0,
            5,
            0.3,
            8,
            1
          ],
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': sunPosition,
          'sky-atmosphere-sun-intensity': 5
        }
      });
    } /* else {
      updateSunPosition(map, sunPosition);
    } */

    /*  map.on('moveend', updateSun);

    return () => {
      map.off('moveend', updateSun);
    }; */
    
  }, [map, sunPosition]);

  return null;
};

/* const mapStateToProps = (({ view: { timeSliderState, userPreferences } }) => ({
  sunPositionDate: timeSliderState.virtualDate,
  virtualizeSunPosition: userPreferences.virtualizeSunPosition,
})); */
export default connect(/* mapStateToProps */ null, null)(SunPosition);