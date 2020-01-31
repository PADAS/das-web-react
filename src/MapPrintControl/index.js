import React, { memo, useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';
import Button from 'react-bootstrap/Button';

import { setPrintTitle } from '../ducks/map-ui';

import { ReactComponent as PrinterIcon } from '../common/images/icons/printer-icon.svg';

import styles from './styles.module.scss';


const MapPrintControl = (props) => {
  const { printTitle, setPrintTitle } = props;
  const closeFormAfterPrint = () => setActiveState(false);

  const [active, setActiveState] = useState(false);
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const onAfterPrint = useRef(closeFormAfterPrint);

  const toggleActiveState = () => setActiveState(!active);
  const onInputChange = ({ target: { value } }) => setPrintTitle(value);

  const onPrintFormSubmit = (e) => {
    e.preventDefault();
    window.print();
    toggleActiveState();
  };

  useEffect(() => {
    window.addEventListener('afterprint', onAfterPrint.current);
    return () => {
      window.removeEventListener('afterprint', onAfterPrint.current);
    };
  }, []);


  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        console.log('time to escape');
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      }
    };
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        toggleActiveState();
      }
    };
    if (active) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  
  }, [active]); // eslint-disable-line
  
  return <div className={styles.wrapper} ref={wrapperRef}>
    <button onClick={toggleActiveState} ref={buttonRef}
      type='button' title='Print map' 
      className={`${styles.button} ${active ? styles.active : ''}`} >
      <PrinterIcon />
    </button>
    <Overlay show={active} target={buttonRef.current} container={wrapperRef.current} placement='right'>
      <Popover placement='right'>

        <Popover.Content>
          <form className={styles.form} onSubmit={onPrintFormSubmit}>
            <label>
              <span>Document Title:</span>
              <input type='text' value={printTitle} onChange={onInputChange} />
            </label>
            <Button size='sm' variant='dark' type='submit'>
            Print map
            </Button>
            <small>Adjust the &quot;scale&quot; setting when printing for best results</small>
          </form>
        </Popover.Content>
      </Popover>
    </Overlay>
  </div>;
};

const mapStateToProps = ({ view: { printTitle } }) => ({ printTitle });

export default connect(mapStateToProps, { setPrintTitle })(memo(MapPrintControl));