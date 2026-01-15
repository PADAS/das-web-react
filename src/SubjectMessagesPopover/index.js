import React, { memo } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ChatIcon } from '../common/images/icons/chat-icon.svg';

import { SENDER_DETAIL_STYLES } from '../MessageList/SenderDetails';
import { useMessagesPermissions } from '../hooks/usePermissions';

import MessageInput from '../MessageInput';
import ParamFedMessageList from '../MessageList/ParamFedMessageList';
import SubjectControlButton from '../SubjectControls/button';

import * as styles from './styles.module.scss';
import { calcDisplayNameForSubject } from '../utils/subjects';

const SubjectMessagesPopover = ({ className = '', subject = null, ...restProps }) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectMessagesPopover' });

  const { hasMessagesCreatePermission } = useMessagesPermissions();

  if (!subject) {
    return null;
  }

  const popover = <Popover className={styles.popover}>
    <Popover.Header>
      <h6>
        <ChatIcon /> {calcDisplayNameForSubject(subject.name)}
      </h6>
    </Popover.Header>

    <Popover.Body>
      <ParamFedMessageList
        isReverse
        params={{ subject_id: subject.id }}
        senderDetailStyle={SENDER_DETAIL_STYLES.SHORT}
      />

      {hasMessagesCreatePermission && <MessageInput subjectId={subject.id} />}
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
      data-testid="subject-messages-popover"
      {...restProps}
    />
  </OverlayTrigger>;
};

export default memo(SubjectMessagesPopover);
