import React, { useCallback, useMemo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import getYear from 'date-fns/get_year';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

import { CLIENT_BUILD_VERSION } from '../../constants';
import { removeModal } from '../../ducks/modals';

import EarthRangerLogo from '../../common/components/EarthRangerLogo';

import styles from './styles.module.scss';

const { Body, Footer } = Modal;

const AboutModal = (props) => {
  const { id, removeModal, serverData } = props;

  const onClickDone = useCallback(() => {
    removeModal(id);
  }, [id, removeModal]);

  const currentYear = useMemo(() => getYear(new Date()), []);


  return <Fragment>
    <Body className={styles.modal}>
      <EarthRangerLogo type='vertical' />
      <div>
        <p>
          <small><strong>Server version</strong>: {serverData.version}</small>
        </p>
        <p>
          <small><strong>Web client version</strong>: {CLIENT_BUILD_VERSION}</small>
        </p>
      </div>
      <br />
      <small>&copy;{currentYear} EarthRanger</small>
    </Body>
    <Footer>
      <Button tabIndex={2} type="button" onClick={onClickDone} variant="primary">Close</Button>
    </Footer>
  </Fragment>;
};

const mapStateToProps = ({ data: { systemStatus } }) => ({
  serverData: systemStatus.server,
});

export default connect(mapStateToProps, { removeModal })(AboutModal);

AboutModal.propTypes = {
  id: PropTypes.string.isRequired,
  removeModal: PropTypes.func.isRequired,
};