import React, { memo } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import { connect } from 'react-redux';

import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const ModalRenderer = (props) => {
  const { canShowModals, map, modals, removeModal } = props;

  const style = {
    display: canShowModals ? 'block' : 'none',
    opacity: canShowModals ? '1' : '0',
    transition: 'opacity 0.3s linear, display 0 linear 0.3s,'
  };

  return !!modals.length &&
    <div className={styles.modalBackdrop}>
      {modals.map((item, index) => {
        const { content: ContentComponent, backdrop = 'static', id, modalProps, ...rest } = item;
        return (!!ContentComponent &&
          <Modal
            backdrop={backdrop}
            backdropClassName={canShowModals ? styles.show : styles.hide}
            centered
            dialogClassName={canShowModals ? styles.show : styles.hide}
            enforceFocus={false}
            key={id}
            show={true}
            style={style}
            {...modalProps}
            onHide={() => removeModal(id)}>

            <ContentComponent id={id} {...rest} map={map} />
          </Modal>
        );
      })}
    </div>;
};

const mapStateToProps = ({ view: { modals: { modals, canShowModals } } }) => ({ modals, canShowModals });

export default connect(mapStateToProps, { removeModal })(memo(ModalRenderer));

ModalRenderer.propTypes = {
  modals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.node,
    content: PropTypes.any.isRequired,
    footer: PropTypes.node,
    id: PropTypes.string.isRequired,
  })).isRequired,
};