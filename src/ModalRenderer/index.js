import React, { memo, Suspense } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import { connect } from 'react-redux';

import ImageModal from '../ImageModal';
import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const ModalRenderer = ({ canShowModals, map, modals, removeModal }) => !!modals.length && <div
  className={styles.modalBackdrop}
  data-testid='modalsRenderer-container'
  >
  {/* Suspense for lazy loaded modals (avoid the page view suspense to handle them making the whole page blink) */}
  <Suspense fallback={null}>
    {modals.map((item) => {
      const { content: ContentComponent, backdrop = 'static', forceShowModal = false, id, modalProps, ...rest } = item;
      const showModal = forceShowModal || canShowModals;

      console.log(modalProps);

      return !!ContentComponent && <Modal
        backdrop={backdrop}
        backdropClassName={showModal ? styles.show : styles.hide}
        centered
        dialogClassName={showModal ? styles.show : styles.hide}
        enforceFocus={false}
        key={id}
        show
        style={{
          display: showModal ? 'block' : 'none',
          opacity: showModal ? '1' : '0',
          transition: 'opacity 0.3s linear, display 0 linear 0.3s,'
        }}
        {...modalProps}
        onHide={() => removeModal(id)}
        {...(ContentComponent.type?.name === ImageModal.type.name
          ? { className: `${modalProps?.className || ''} ${styles.modalImageBackground}` }
          : {}
        )}
      >
        <ContentComponent id={id} {...rest} map={map} />
      </Modal>;
    })}
  </Suspense>
</div>;

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
