import React, { memo, Suspense, useContext } from 'react';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';

import ImageModal from '../ImageModal';
import { MapContext } from '../MapContext';
import { removeModal } from '../ducks/modals';

import * as styles from './styles.module.scss';

const ModalRenderer = () => {
  const dispatch = useDispatch();

  const map = useContext(MapContext);

  const canShowModals = useSelector((state) => state.view.modals.canShowModals);
  const isPickingLocation = useSelector((state) => state.view.mapLocationSelection.isPickingLocation);
  const modals = useSelector((state) => state.view.modals.modals);

  return modals.length > 0 ? <div data-testid="modalsRenderer-container">
    <Suspense fallback={null}>
      {modals.map((item) => {
        const { content: ContentComponent, backdrop = 'static', id, modalProps, ...rest } = item;

        return !!ContentComponent && <Modal
          backdrop={backdrop}
          backdropClassName={canShowModals ? '' : styles.hide}
          centered
          dialogClassName={canShowModals ? '' : styles.hide}
          enforceFocus={false}
          key={id}
          show
          style={{
            display: canShowModals ? 'block' : 'none',
            opacity: canShowModals ? '1' : '0',
            transition: 'opacity 0.3s linear, display 0 linear 0.3s,'
          }}
          {...modalProps}
          onHide={() => !isPickingLocation && dispatch(removeModal(id))}
          {...(ContentComponent === ImageModal
            ? { className: `${modalProps?.className || ''} ${styles.modalImageBackground}` }
            : {}
          )}
        >
          <ContentComponent id={id} {...rest} map={map} />
        </Modal>;
      })}
    </Suspense>
  </div> : null;
};

export default memo(ModalRenderer);
