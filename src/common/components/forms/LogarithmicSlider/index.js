import React, { memo } from 'react';

const start_position = 0;
const end_position = 100;

const LogarithmicSlider = (props) => {

  const { onChange, min, max, value, ...rest } = props;

  const minimumLog = Math.log(min);
  const maximumLog = Math.log(max);
  const scale = (maximumLog - minimumLog) / (end_position - start_position);

  const calcLogarithmicPositionForValue = value => Math.round((Math.log(value) - minimumLog) / scale);
  const calcLogarithmicValueForPosition = position => Math.round(Math.exp(minimumLog + scale * (position - start_position)));

  const positionValue = calcLogarithmicPositionForValue(value);

  const onSliderChange = ({ target: { value } }) => onChange(calcLogarithmicValueForPosition(value));

  return <input {...rest} type='range' onChange={onSliderChange} min={start_position} max={end_position} value={positionValue} />;

};

export default memo(LogarithmicSlider);