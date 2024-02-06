import React, { memo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { PERMISSION_KEYS, PERMISSIONS } from '../constants';
import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { usePermissions } from '../hooks';

import MessageInput from '../MessageInput';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import SubjectControlButton from '../SubjectControls/button';

import styles from './styles.module.scss';

const SubjectMessagesPopover = ({ className, subject, ...restProps }) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectMessagesPopover' });

  const hasMessagingWritePermissions = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.CREATE);

  if (!subject) {
    return null;
  }

  const popover = <Popover className={styles.popover}>
    <Popover.Header>
      <h6>
        <ChatIcon /> {subject.name}
      </h6>
    </Popover.Header>

    <Popover.Body>
      <ParamFedMessageList
        isReverse
        params={{ subject_id: subject.id }}
        senderDetailStyle={SENDER_DETAIL_STYLES.SHORT}
      />

      {!!hasMessagingWritePermissions && <MessageInput subjectId={subject.id} />}
    </Popover.Body>
  </Popover>;

  return <OverlayTrigger
      flip
      overlay={popover}
      placement="auto"
      rootClose
      shouldUpdatePosition
      trigger="click"
    >
    <SubjectControlButton
      buttonClassName={`${className} ${styles.button}`}
      containerClassName={styles.container}
      labelText={t('label')}
      {...restProps}
    />
  </OverlayTrigger>;
};

SubjectMessagesPopover.defaultProps = {
  className: '',
  subject: null,
};

SubjectMessagesPopover.propTypes = {
  className: PropTypes.string,
  subject: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
  }),
};

export default memo(SubjectMessagesPopover);
