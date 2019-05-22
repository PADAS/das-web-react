import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';

import { hideModal } from '../ducks/modals';

import styles from './styles.module.scss';

const ModalRenderer = memo((props) => {
  const { modals, hideModal } = props;

  return !!modals.length &&
    <div className={styles.wrapper}>
      {modals.map((item, index) => {
        const { content: ContentComponent, id, modalProps, ...rest } = item;
        return (!!ContentComponent &&
          <Modal
            backdrop={index === 0}
            centered show={true}
            key={id}
            {...modalProps}
            onHide={() => hideModal(id)}>

            <ContentComponent id={id} {...rest} />
          </Modal>
        );
      })}
    </div>
});

const mapStateToProps = ({ view: { modals } }) => ({ modals });

export default connect(mapStateToProps, { hideModal })(ModalRenderer);

ModalRenderer.propTypes = {
  modals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.node,
    content: PropTypes.any.isRequired,
    footer: PropTypes.node,
    id: PropTypes.string.isRequired,
  })).isRequired,
};