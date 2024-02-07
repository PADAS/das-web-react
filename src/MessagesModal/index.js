import React, { memo, useEffect, useMemo, useState }  from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as EditIcon } from '../common/images/icons/edit.svg';

import { extractSubjectFromMessage } from '../utils/messaging';
import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { usePermissions } from '../hooks';

import MessageInput from '../MessageInput';
import MessageSummaryList from '../MessageList/MessageSummaryList';
import MessagingSelect from '../MessagingSelect';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';

const BODY_STYLES ={
  height: '26rem',
  maxWidth: '28rem',
  padding: 0,
  width: '100vw',
};

const MessagesModal = ({ onSelectSubject, selectedSubject }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'messagesModal' });

  const subjectStore = useSelector((state) => state.data.subjectStore);

  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  const [selectingRecipient, setSelectingRecipient] = useState(false);

  const params = useMemo(() => {
    if (selectedSubject) {
      return { subject_id: selectedSubject.id };
    }
  }, [selectedSubject]);

  const onRecipientSelect = (subject) => {
    setSelectingRecipient(false);
    onSelectSubject(subject);
  };

  useEffect(() => {
    setSelectingRecipient(false);
  }, [params]);

  return <>
    <Modal.Header style={{ alignItems: 'center', h5: { margin: 0 }, height: '4rem' }}>
      {selectedSubject
        ? <h5 style={{ alignItems: 'center', display: 'flex' }}>
          {selectedSubject.name}

          <Button
            onClick={() => onSelectSubject(null)}
            size="sm"
            style={{ fontSize: '0.85rem', marginLeft: '1em' }}
            variant="secondary"
          >
            {t('backToAllMessagesButton')}
          </Button>
        </h5>
        : <h5>{t('messagesHeader')}</h5>}
    </Modal.Header>

    <Modal.Body style={{ display: selectedSubject ? 'none' : 'block', ...BODY_STYLES }}>
      <MessageSummaryList
        onMessageClick={(message) => onSelectSubject(subjectStore?.[extractSubjectFromMessage(message)?.id])}
      />
    </Modal.Body>

    {selectedSubject && <Modal.Body style={BODY_STYLES}>
      <ParamFedMessageList isReverse params={params} senderDetailStyle={SENDER_DETAIL_STYLES.SHORT} />
    </Modal.Body>}

    {!selectingRecipient && <>
      {!selectedSubject && !!hasMessagingWritePermissions && <Modal.Footer>
        <Button onClick={() => setSelectingRecipient(true)} variant="light">
          <EditIcon /> {t('newMessageButton')}
        </Button>
      </Modal.Footer>}

      {selectedSubject && <Modal.Footer>
        {!selectedSubject.messaging && <strong>{t('noMessagingSubjectText')}</strong>}

        {!!hasMessagingWritePermissions && <MessageInput subjectId={selectedSubject.id} />}
      </Modal.Footer>}
    </>}

    {selectingRecipient && <Modal.Footer>
      <MessagingSelect onChange={onRecipientSelect} />

      <Button
        onClick={() => setSelectingRecipient(false)}
        size="sm"
        style={{ fontSize: '0.85rem', marginLeft: '1em' }}
        variant="secondary"
      >
        {t('cancelButton')}
      </Button>
    </Modal.Footer>}
  </>;
};

MessagesModal.defaultProps = {
  selectedSubject: null,
};

MessagesModal.propTypes = {
  onSelectSubject: PropTypes.func.isRequired,
  selectedSubject: PropTypes.shape({
    id: PropTypes.string,
    messaging: PropTypes.array,
    name: PropTypes.string,
  }),
};

export default memo(MessagesModal);
