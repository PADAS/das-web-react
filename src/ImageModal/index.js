import React, { memo, Fragment, useState } from 'react';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

import LoadingOverlay from '../LoadingOverlay';

import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const ImageModal = (props) => {

  const [loaded, setLoadState] = useState(false);
  const { src, title } = props;

  return <Fragment>
    <Header closeButton>
      <Title>
        {title}
      </Title>
    </Header>
    <Body className={styles.body}>
      {!loaded && <LoadingOverlay />}
      <img style={{ display: loaded ? 'block' : 'none' }} onLoad={() => setLoadState(true)} src={src} alt={title} />
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