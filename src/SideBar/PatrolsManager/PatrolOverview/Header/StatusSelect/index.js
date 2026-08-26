import React, { memo, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import getPatrolStatusOptions from '../../utils/getPatrolStatusOptions';
import { TrackerContext } from '../../../../../utils/analytics';

import * as styles from './styles.module.scss';

const StatusSelect = ({ isDirty, onSelect, patrol, patrolState, state }) => {
  const { t } = useTranslation('patrols', { keyPrefix: 'patrolOverview.header' });

  const tracker = useContext(TrackerContext);

  const optionRefs = useRef([]);

  const menuId = useId();

  const [anchorEl, setAnchorEl] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const label = <span className={isDirty ? styles.unsavedLabel : undefined}>{t(`uiStateTitles.${state.key}`)}</span>;

  const options = useMemo(() => getPatrolStatusOptions(patrol, patrolState), [patrol, patrolState]);

  const closeMenu = () => {
    setIsMenuOpen(false);

    anchorEl?.focus();
  };

  const onMenuKeyDown = (event) => {
    const optionNodes = optionRefs.current.filter(Boolean);
    const currentIndex = optionNodes.findIndex((option) => option === document.activeElement);

    switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();

      optionNodes[(currentIndex + 1) % optionNodes.length]?.focus();

      break;

    case 'ArrowUp':
      event.preventDefault();

      optionNodes[(currentIndex - 1 + optionNodes.length) % optionNodes.length]?.focus();

      break;

    case 'End':
      event.preventDefault();

      optionNodes[optionNodes.length - 1]?.focus();

      break;

    case 'Home':
      event.preventDefault();

      optionNodes[0]?.focus();

      break;

    case 'Escape':
      event.preventDefault();

      closeMenu();

      break;

    // The default action is left alone so focus carries on to the next element. Focus goes back to
    // the toggle first, otherwise the menu unmounting would drop it to the top of the document.
    case 'Tab':
      closeMenu();

      break;

    default:
    }
  };

  const onOptionClick = (option) => {
    onSelect(option);

    tracker.track(`Pick the "${option.key}" patrol status from patrol overview`);

    closeMenu();
  };

  const onToggleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      setIsMenuOpen(true);
    }
  };

  useEffect(() => {
    if (isMenuOpen) {
      // Open on the selected status.
      optionRefs.current[Math.max(0, options.indexOf(state))]?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen]);

  if (options.length < 2) {
    return <span className={`${styles.statusPill} ${styles[state.key]}`}>{label}</span>;
  }

  return <>
    <button
      aria-controls={menuId}
      aria-expanded={isMenuOpen}
      aria-haspopup="menu"
      aria-label={`${t(`uiStateTitles.${state.key}`)}, ${t('statusSelectLabel')}`}
      className={`${styles.statusPill} ${styles[state.key]} ${styles.statusPillButton}`}
      onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
      onKeyDown={onToggleKeyDown}
      ref={setAnchorEl}
      title={t('statusSelectLabel')}
      type="button"
      >
      {label}

      <div aria-hidden="true" className={`${styles.caret} ${isMenuOpen ? styles.open : ''}`} />
    </button>

    <Overlay
      onHide={() => setIsMenuOpen(false)}
      placement="bottom-end"
      rootClose
      show={isMenuOpen}
      target={anchorEl}
      >
      <Popover className={styles.menuPopover}>
        <ul
          aria-label={t('statusMenuLabel')}
          className={styles.menu}
          id={menuId}
          onKeyDown={onMenuKeyDown}
          role="menu"
        >
          {options.map((option, index) => {
            const isSelected = option === state;

            return <li className={styles.menuItem} key={option.key} role="none">
              <button
                aria-checked={isSelected}
                className={styles.menuItemOption}
                onClick={() => onOptionClick(option)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="menuitemradio"
                tabIndex={-1}
                type="button"
              >
                {isSelected && <CheckIcon aria-hidden="true" className={styles.checkIcon} />}

                {t(`uiStateTitles.${option.key}`)}
              </button>
            </li>;
          })}
        </ul>
      </Popover>
    </Overlay>
  </>;
};

export default memo(StatusSelect);
