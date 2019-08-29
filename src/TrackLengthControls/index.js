import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import Form from 'react-bootstrap/Form';

import LogarithmicSlider from '../LogarithmicSlider';

import styles from './styles.module.scss';

const RANGE_MIN = 1;
const RANGE_MAX = 365;

const { Label, Control } = Form;

const RANGE_INPUT_ATTRS = {
  min: RANGE_MIN,
  max: RANGE_MAX,
};

const TrackLengthControls = (props) => {
  const [rangeValue, setRangeValue] = useState(14);
  const [selected, setSelected] = useState('filter');

  const onSelectChange = ({ target: { value } }) => setSelected(value);
  const focusRange = () => {
    if (selected !== 'custom-length') setSelected('custom-length');
  };
  const isSelected = val => val === selected;

  return <Form onSubmit={form => console.log('range change', form)} style={{padding: '1rem'}}>
    <h6>Track Length <em>(days)</em></h6>
    <Label htmlFor='filter' className={styles.label}>
      <Control onChange={onSelectChange} id='filter' checked={isSelected('filter')} className={styles.radio} value='filter' type='radio' name='track-length-method' />
      <span>Match report filter <em>(default)</em></span>
    </Label>
    <Label htmlFor='custom-length' className={styles.label}>
      <Control onChange={onSelectChange} id='custom-length' checked={isSelected('custom-length')} className={styles.radio} value='custom-length' type='radio' name='track-length-method' />
      <span>Custom length</span>
      <div className={styles.rangeControls}>
        <LogarithmicSlider onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={selected !== 'custom-length'} className={`${styles.rangeSlider} ${selected !== 'custom-length' ? styles.disabled : ''}`} value={rangeValue} min={RANGE_MIN} max={RANGE_MAX} onChange={value => setRangeValue(value)} />
        <input onTouchStart={focusRange} onMouseDown={focusRange} onFocus={focusRange} disabled={selected !== 'custom-length'} className={`${styles.rangeFreeformInput} ${selected !== 'custom-length' ? styles.disabled : ''}`} type='number' min={RANGE_MIN} max={RANGE_MAX} value={rangeValue} name='range-freeform-input'  onChange={({ target: { value } }) => setRangeValue(value)} />
      </div>
    </Label>
    {/*  <Label htmlFor='all' className={styles.label}>
      <Control onChange={onSelectChange} id='all' checked={isSelected('all')} className={styles.radio} value='all' type='radio' name='track-length-method' />
      <span>All available data <em>(may be slow)</em></span>
    </Label> */}
  </Form>;
};

export default memo(TrackLengthControls);