import React, { memo, useEffect, useId, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import { EVENT_FORM_STATES, PREVIEW_FEATURES } from '../../../../../constants';
import navigateMenuWithKeyboard from '../../../../utils/navigateMenuWithKeyboard';
import { usePreviewFeature } from '../../../../../hooks';

import * as styles from './styles.module.scss';

const { ACTIVE, NEW_LEGACY, RESOLVED, REVIEW } = EVENT_FORM_STATES;

const STATES = [ACTIVE, REVIEW, RESOLVED];

const TRANSITIONS_BY_STATE = {
  [ACTIVE]: { [RESOLVED]: 'resolve', [REVIEW]: 'review' },
  [RESOLVED]: { [ACTIVE]: 'reopen', [REVIEW]: 'review' },
  [REVIEW]: { [ACTIVE]: 'activate', [RESOLVED]: 'resolve' },
};

const normalizeState = (state) => state === NEW_LEGACY ? ACTIVE : state;

const StatusSelect = ({ isDirty, onSelect, savedState, state }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.statusSelect' });

  // Remove this flag and the `.filter` below once community input is enabled
  // for all tenants.
  const isCommunityInputEnabled = usePreviewFeature(PREVIEW_FEATURES.COMMUNITY_INPUT_ADMIN);

  const optionRefs = useRef([]);

  const menuId = useId();

  const [anchorEl, setAnchorEl] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentState = normalizeState(state);
  const savedStateKey = normalizeState(savedState);

  // The saved state leads, as the one the rest are moves away from.
  const options = [savedStateKey, ...STATES.filter((option) => option !== savedStateKey)]
    .filter((option) => isCommunityInputEnabled || option !== REVIEW || savedStateKey === REVIEW);

  // Closing without restoring focus: a click outside lands focus where the user
  // clicked, and pulling it back would steal it from there.
  const hideMenu = () => setIsMenuOpen(false);

  const closeMenu = () => {
    hideMenu();

    anchorEl?.focus();
  };

  const focusSelectedOption = () => {
    optionRefs.current[Math.max(0, options.indexOf(currentState))]?.focus();
  };

  const onMenuKeyDown = (event) => navigateMenuWithKeyboard(event, optionRefs.current.filter(Boolean), closeMenu);

  const onOptionClick = (option) => {
    onSelect(option);

    closeMenu();
  };

  const onToggleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      // A menu opened with the mouse leaves focus on the toggle.
      if (isMenuOpen) {
        focusSelectedOption();
      } else {
        setIsMenuOpen(true);
      }
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      focusSelectedOption();
    }
  // Only opening the menu moves focus into it, not a re-render while it is open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen]);

  return <>
    <button
      aria-controls={isMenuOpen ? menuId : undefined}
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
      aria-label={`${t(`states.${currentState}`)}, ${t('statusSelectLabel')}`}
      className={`${styles.statusPill} ${styles[currentState]}`}
      onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      onKeyDown={onToggleKeyDown}
      ref={setAnchorEl}
      title={t('statusSelectLabel')}
      type="button"
      >
      <span className={isDirty ? styles.unsavedLabel : undefined}>{t(`states.${currentState}`)}</span>

      <span aria-hidden="true" className={`${styles.caret} ${isMenuOpen ? styles.open : ''}`} />
    </button>

    <Overlay
      onHide={hideMenu}
      placement="bottom-end"
      rootClose
      show={isMenuOpen}
      target={anchorEl}
      >
      <Popover className={styles.menuPopover} role="presentation">
        <ul
          aria-label={t('statusMenuLabel')}
          className={styles.menu}
          id={menuId}
          onKeyDown={onMenuKeyDown}
          role="menu"
        >
          {options.map((option, index) => {
            const isSelected = option === currentState;

            // Only the saved state names itself; the rest are named after the
            // move that reaches them, which makes them commands.
            const transition = TRANSITIONS_BY_STATE[savedStateKey]?.[option];

            return <li className={styles.menuItem} key={option} role="none">
              <button
                aria-current={isSelected || undefined}
                className={styles.menuItemOption}
                onClick={() => onOptionClick(option)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="menuitem"
                tabIndex={-1}
                type="button"
              >
                {isSelected && <CheckIcon aria-hidden="true" className={styles.checkIcon} />}

                {transition ? t(`stateTransitions.${transition}`) : t(`states.${option}`)}
              </button>
            </li>;
          })}
        </ul>
      </Popover>
    </Overlay>
  </>;
};

export default memo(StatusSelect);
