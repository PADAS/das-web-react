import React, { memo, Suspense, useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';

import ImageModal from '../ImageModal';
import { MapContext } from '../App';
import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const ModalRenderer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const canShowModals = useSelector((state) => state.view.modals.canShowModals);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const modals = useSelector((state) => state.view.modals.modals);

  return !!modals.length && <div
    className={styles.modalBackdrop}
    data-testid='modalsRenderer-container'
    >
    <Suspense fallback={null}>
      {modals.map((item) => {
        const { content: ContentComponent, backdrop = 'static', forceShowModal = false, id, modalProps, ...rest } = item;
        const showModal = forceShowModal || canShowModals;

        const onHideModal = () => {
          if (!isPickingLocation || forceShowModal) {
            dispatch(removeModal(id));
          }
        };

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
          onHide={onHideModal}
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
};

export default memo(ModalRenderer);
