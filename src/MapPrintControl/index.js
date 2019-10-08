import React, { Fragment, memo, useState } from 'react';
import Button from 'react-bootstrap/Button';

import styles from './styles.module.scss';


const MapPrintControl = (props) => {
  const [active, setActiveState] = useState(false);
  const [title, setTitle] = useState('');

  const toggleActiveState = () => setActiveState(!active);
  const onInputChange = ({ target: { value } }) => setTitle(value);

  const onPrintFormSubmit = () => {
    console.log('printing with this title', title);
  }
  
  return <Fragment>
    <div className={styles.buttons}>
      <button type='button' title='Map ruler' 
        className={`${styles.button} ${active ? 'active' : ''}`} 
        onClick={toggleActiveState}>
        {/* <PrinterIcon /> */}
      </button>
      {active && <form onSubmit={onPrintFormSubmit}>
        <label>
          <input type='text' onChange={onInputChange} />
        </label>
      </form>}
    </div>
  </Fragment>;
};

export default memo(MapPrintControl);