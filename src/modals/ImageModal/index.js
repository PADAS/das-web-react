import React, { memo, Fragment, useState } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';

import LoadingOverlay from '../../common/components/LoadingOverlay';

import { removeModal } from '../../ducks/modals';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const ImageModal = (props) => {

  const [loaded, setLoadState] = useState(false);
  const [error, setErrorState] = useState(false);

  const setImageLoaded = () => setLoadState(true);
  const setImageError = () => {
    setErrorState(true);
    setImageLoaded();
  };

  const { src, title } = props;

  return <Fragment>
    <Header closeButton>
      <Title>
        {title}
      </Title>
    </Header>
    <Body className={styles.body}>
      {!loaded && <LoadingOverlay />}
      {!error && <img style={{ display: loaded ? 'block' : 'none' }} onError={setImageError} onLoad={setImageLoaded} src={src} alt={title} />}
      {error && <Fragment>
        <h5>Error loading image.</h5>
        <h6>If you uploaded this file recently, please wait a minute and try again.</h6>
      </Fragment>}
    </Body>
  </Fragment>;
};

export default connect(null, { removeModal })(memo(ImageModal));

ImageModal.defaultProps = {
  title: 'View image:',
};


ImageModal.propTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string,
};