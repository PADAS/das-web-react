import React from 'react';
import PropTypes from 'prop-types';

import EditableItemModal from './Modal';
import EditableItemHeader from './Header';
import EditableItemAttachmentControls from './AttachmentControls';
import EditableItemAttachmentList from './AttachmentList';
import EditableItemBody from './Body';
import EditableItemFooter from './Footer';
import LocationSelectorInput from './LocationSelectorInput';

import { FormDataContext, withFormDataContext } from './context';

const EditableItem = (props) => {
  return <FormDataContext.Provider value={props.data}>
    {props.children}
  </FormDataContext.Provider>;
};

EditableItem.Modal = withFormDataContext(EditableItemModal);
EditableItem.Header = withFormDataContext(EditableItemHeader);
EditableItem.AttachmentControls = withFormDataContext(EditableItemAttachmentControls);
EditableItem.AttachmentList = withFormDataContext(EditableItemAttachmentList);
EditableItem.Body = withFormDataContext(EditableItemBody);
EditableItem.Footer = withFormDataContext(EditableItemFooter);
EditableItem.LocationSelectorInput = withFormDataContext(LocationSelectorInput);

EditableItem.ContextProvider = FormDataContext.Provider;

export default EditableItem;

EditableItem.propTypes = {
  data: PropTypes.any.isRequired,
};