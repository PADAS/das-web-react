import React, { memo, Suspense } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import { connect } from 'react-redux';

import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const ModalRenderer = ({ canShowModals, map, modals, removeModal }) => {
  const style = {
    display: canShowModals ? 'block' : 'none',
    opacity: canShowModals ? '1' : '0',
    transition: 'opacity 0.3s linear, display 0 linear 0.3s,'
  };

  return !!modals.length && <div className={styles.modalBackdrop} data-testid='modalsRenderer-container'>
    {/* Suspense for lazy loaded modals (avoid the page view suspense to handle them making the whole page blink) */}
    <Suspense fallback={null}>
      {modals.map((item) => {
        const { content: ContentComponent, backdrop = 'static', id, modalProps, ...rest } = item;

        return !!ContentComponent && <Modal
          backdrop={backdrop}
          backdropClassName={canShowModals ? styles.show : styles.hide}
          centered
          dialogClassName={canShowModals ? styles.show : styles.hide}
          enforceFocus={false}
          key={id}
          show
          style={style}
          {...modalProps}
          onHide={() => removeModal(id)}
        >
          <ContentComponent id={id} {...rest} map={map} />
        </Modal>;
      })}
    </Suspense>
  </div>;
};

ModalRenderer.propTypes = {
  modals: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.node,
    content: PropTypes.any.isRequired,
    footer: PropTypes.node,
    id: PropTypes.string.isRequired,
  })).isRequired,
};

const mapStateToProps = ({ view: { modals: { modals, canShowModals } } }) =>
  ({ modals, canShowModals });

export default connect(mapStateToProps, { removeModal })(memo(ModalRenderer));
