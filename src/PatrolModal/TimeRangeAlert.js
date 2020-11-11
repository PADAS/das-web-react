import React, { useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { removeModal } from '../ducks/modals';
import { connect } from 'react-redux';
import styles from './styles.module.scss';
const { Title, Body, Footer } = Modal;

const TimeRangeAlert = (props) => {

  const { id, removeModal } = props;

  const onClickDone = useCallback(() => {
    removeModal(id);
  }, [id, removeModal]);


  return <Fragment>
    <Body className={styles.modal}>
      <div>
        <p>
          <strong>Invalid Patrol End Time</strong>
        </p>
        <p>
          This patrol can not be saved. The end time of a patrol must be set later than 
          the start time. Please correct the end patrol time.
        </p>
      </div>
    </Body>
    <Footer>
      <Button tabIndex={2} type="button" onClick={onClickDone} variant="primary">OK</Button>
    </Footer>
  </Fragment>;
};

export default connect(null, { removeModal })(TimeRangeAlert);

TimeRangeAlert.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
};