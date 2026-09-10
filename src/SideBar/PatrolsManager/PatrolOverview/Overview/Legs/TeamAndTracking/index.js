import React, { memo, useContext, useEffect, useId, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../../../../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as StarIcon } from '../../../../../../common/images/icons/star.svg';

import { calcUrlForImage } from '../../../../../../utils/img';
import { EMPTY_VALUE } from '../../../../../../constants';
import { TrackerContext } from '../../../../../../utils/analytics';
import useJumpToLocation from '../../../../../../hooks/useJumpToLocation';

import SvgIcon from '../../../../../../SvgIcon';

import * as styles from './styles.module.scss';

const JUMP_TO_LOCATION_ZOOM = 17;

const TeamAndTracking = ({ legNumber, trackedSubjects }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.overview.legs.teamAndTracking' });

  const tracker = useContext(TrackerContext);

  const jumpToLocation = useJumpToLocation();

  const jumpToLocationButtonRefs = useRef([]);
  const listRef = useRef(null);
  const wasListOpen = useRef(false);

  const listId = useId();

  const [isListOpen, setIsListOpen] = useState(false);
  const [toggleButtonEl, setToggleButtonEl] = useState();

  // React leaves the slots of unmounted buttons behind, so only the mounted
  // ones can take focus.
  const getJumpToLocationButtons = () => jumpToLocationButtonRefs.current.filter(Boolean);

  const focusJumpToLocationButtonAt = (index) => {
    const jumpToLocationButtons = getJumpToLocationButtons();

    jumpToLocationButtons[(index + jumpToLocationButtons.length) % jumpToLocationButtons.length]?.focus();
  };

  const onListClose = () => {
    setIsListOpen(false);

    toggleButtonEl?.focus();
  };

  const onListHide = () => {
    setIsListOpen(false);

    if (document.activeElement === document.body) {
      toggleButtonEl?.focus();
    }
  };

  const onKeyDown = (event) => {
    const jumpToLocationButtons = getJumpToLocationButtons();
    const focusedButtonIndex = jumpToLocationButtons.findIndex((button) => button === document.activeElement);

    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      focusJumpToLocationButtonAt(focusedButtonIndex + 1);

      break;

    case 'ArrowUp':
      event.preventDefault();

      focusJumpToLocationButtonAt(focusedButtonIndex - 1);

      break;

    case 'End':
      event.preventDefault();

      focusJumpToLocationButtonAt(jumpToLocationButtons.length - 1);

      break;

    case 'Home':
      event.preventDefault();

      focusJumpToLocationButtonAt(0);

      break;

    // The default action is left alone so focus moves on, but it returns to the
    // toggle first: the list unmounting would drop it to the document top.
    case 'Tab':
      onListClose();

      break;

    case 'Escape':
      event.preventDefault();

      onListClose();

      break;

    default:
    }
  };

  const onJumpToSubjectLocation = (coordinates) => (event) => {
    event.stopPropagation();

    jumpToLocation(coordinates, JUMP_TO_LOCATION_ZOOM);

    tracker.track('Click "jump to tracked subject location" from patrol overview');
  };

  // The list is rendered in a portal but its clicks still reach the leg row
  // through React, which would navigate away from under it.
  const onPopoverClick = (event) => event.stopPropagation();

  // A collapsed toggle has no list to walk, so every key but the ones that open
  // one belongs to whatever surrounds it.
  const onToggleKeyDown = (event) => {
    if (isListOpen) {
      onKeyDown(event);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      setIsListOpen(true);
    }
  };

  const onToggleList = (event) => {
    event.stopPropagation();

    setIsListOpen((isOpen) => !isOpen);
  };

  useEffect(() => {
    const isListOpening = isListOpen && !wasListOpen.current;
    wasListOpen.current = isListOpen;

    if (isListOpening) {
      // Nothing but the jump to location buttons takes focus, so the list is
      // only worth entering when a subject has somewhere to jump to.
      getJumpToLocationButtons()[0]?.focus();
    }
  }, [isListOpen]);

  useEffect(() => {
    if (!isListOpen) {
      return undefined;
    }

    // Anything else taking the focus - another menu opening, say - dismisses
    // the list, and keeps the focus it took.
    const onFocusIn = (event) => {
      if (event.target !== toggleButtonEl && !listRef.current?.contains(event.target)) {
        setIsListOpen(false);
      }
    };

    document.addEventListener('focusin', onFocusIn);

    return () => document.removeEventListener('focusin', onFocusIn);
  }, [isListOpen, toggleButtonEl]);

  if (trackedSubjects.length === 0) {
    return EMPTY_VALUE;
  }

  return <>
    <button
      aria-controls={isListOpen ? listId : undefined}
      aria-expanded={isListOpen}
      aria-haspopup="true"
      className={styles.toggleButton}
      onClick={onToggleList}
      onKeyDown={onToggleKeyDown}
      ref={setToggleButtonEl}
      title={t('toggleButtonTitle', { legNumber })}
      type="button"
      >
      {trackedSubjects.length > 1
        ? t('toggleButtonLabel', {
          extraSubjects: trackedSubjects.length - 1,
          subject: trackedSubjects[0].subject.name,
        })
        : trackedSubjects[0].subject.name}

      <ArrowDownSmallIcon aria-hidden="true" className={styles.toggleButtonIcon} />
    </button>

    <Overlay
      container={document.body}
      onHide={onListHide}
      placement="bottom-start"
      rootClose
      show={isListOpen}
      target={toggleButtonEl}
      >
      <Popover className={styles.listPopover} onClick={onPopoverClick} role="presentation">
        <ul
          aria-label={t('listLabel', { legNumber })}
          className={styles.list}
          id={listId}
          onKeyDown={onKeyDown}
          ref={listRef}
        >
          {trackedSubjects.map(({ coordinates, isTeamLead, subject }, index) => <li
            className={styles.subject}
            key={subject.id}
          >
            {!!subject.image_url && <span className={styles.subjectIcon}>
              <SvgIcon imageUrl={calcUrlForImage(subject.image_url)} type="subjects" />
            </span>}

            <span>{subject.name}</span>

            {!!isTeamLead && <>
              <StarIcon aria-hidden="true" className={styles.teamLeadIcon} />

              <span className="sr-only">{t('teamLeadIndicator')}</span>
            </>}

            {!!coordinates && <button
              aria-label={t('jumpToLocationButtonLabel', { subject: subject.name })}
              className={styles.jumpToLocationButton}
              onClick={onJumpToSubjectLocation(coordinates)}
              ref={(element) => {
                jumpToLocationButtonRefs.current[index] = element;
              }}
              title={t('jumpToLocationButtonLabel', { subject: subject.name })}
              type="button"
            >
              <MarkerFeedIcon aria-hidden="true" />
            </button>}
          </li>)}
        </ul>
      </Popover>
    </Overlay>
  </>;
};

export default memo(TeamAndTracking);
