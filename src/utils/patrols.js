import { store } from '../';
import { addModal } from '../ducks/modals';

import PatrolModal from '../PatrolModal';

export const openModalForPatrol = (patrol, map, config = {}) => {
  const { onSaveSuccess, onSaveError, relationshipButtonDisabled } = config;

  return store.dispatch(
    addModal({
      content: PatrolModal,
      patrol,
      map,
      onSaveSuccess,
      onSaveError,
      relationshipButtonDisabled,
      modalProps: {
        className: 'patrol-form-modal',
        // keyboard: false,
      },
    }));
};