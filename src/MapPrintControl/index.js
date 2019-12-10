import React, { memo, useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import Button from 'react-bootstrap/Button';

import { setPrintTitle } from '../ducks/map-ui';

import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-icon.svg';

import styles from './styles.module.scss';


const MapPrintControl = (props) => {
  const { printTitle, setPrintTitle } = props;
  const closeFormAfterPrint = () => setActiveState(false);

  const [active, setActiveState] = useState(false);
  const onAfterPrint = useRef(closeFormAfterPrint);

  const toggleActiveState = () => setActiveState(!active);
  const onInputChange = ({ target: { value } }) => setPrintTitle(value);

  const onPrintFormSubmit = (e) => {
    e.preventDefault();
    window.print();
  };

  useEffect(() => {
    window.addEventListener('afterprint', onAfterPrint.current);
    return () => {
      window.removeEventListener('afterprint', onAfterPrint.current);
    };
  }, []);
  
  return <div className={styles.wrapper}>
    <button type='button' title='Print map' 
      className={`${styles.button} ${active ? styles.active : ''}`} 
      onClick={toggleActiveState}>
      <PrinterIcon />
    </button>
    {active && <form className={styles.form} onSubmit={onPrintFormSubmit}>
      <label>
        <span>Document Title:</span>
        <input type='text' value={printTitle} onChange={onInputChange} />
      </label>
      <Button size='sm' variant='dark' type='submit'>
          Print map
      </Button>
      <small>Adjust the "scale" setting when printing for best results</small>
    </form>}
  </div>;
};

const mapStateToProps = ({ view: { printTitle } }) => ({ printTitle });

export default connect(mapStateToProps, { setPrintTitle })(memo(MapPrintControl));