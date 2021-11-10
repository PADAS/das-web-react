import React, { memo, useEffect, useState } from 'react';
import { getAttributionStringForBaseLayer } from '../../utils/map';


const EarthRangerMapAttribution = (props) => {
  const { currentBaseLayer, ...rest } = props;
  const [attribution, setAttribution] = useState('');

  useEffect(() => {
    if (currentBaseLayer) {
      getAttributionStringForBaseLayer(currentBaseLayer)
        .then(attributionString => setAttribution(attributionString));
    }
  }, [currentBaseLayer]);


  return <div {...rest}>
    <p>{attribution}</p>
  </div>;
};

export default memo(EarthRangerMapAttribution);