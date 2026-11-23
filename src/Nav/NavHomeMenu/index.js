import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';

import { calcUrlForImage } from '../../utils/img';
import { getQuickLinkTitle } from '../../utils/quick-links';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../../utils/analytics';
import useMenuToggle from '../../hooks/useMenuToggle';
import { userLocationCanBeShown } from '../../selectors';

import Menu from '../../Menu';

import * as styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const trackMenuToggle = (isShown) => mainToolbarTracker.track(`${isShown ? 'Open' : 'Close'} Home Area Menu`);

const NavHomeMenu = ({ maps, onCurrentLocationClick, onMapSelect, onSelectedMapClick, selectedMap }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav.navHomeMenu' });

  const menuToggle = useMenuToggle({ onToggle: trackMenuToggle });

  const canShowUserLocation = useSelector(userLocationCanBeShown);
  const userLocation = useSelector((state) => state.view.userLocation);

  const [splitButton, setSplitButton] = useState(null);

  // A menu holding only the link the main button already jumps to adds nothing.
  const hasMenu = canShowUserLocation || maps.some((map) => map.id !== selectedMap.id);
  // Options without an icon keep its space while others show one, so names align.
  const hasOptionIcons = canShowUserLocation || maps.some((map) => !!map.icon);

  return <div
    aria-label={t('homeMenuLabel')}
    className={`${styles.navHomeMenu} ${hasMenu ? styles.hasMenu : ''}`}
    ref={setSplitButton}
    role="group"
  >
    <button
      aria-label={t('jumpButtonLabel', { mapTitle: getQuickLinkTitle(selectedMap) })}
      className={styles.jumpButton}
      onClick={() => onSelectedMapClick(selectedMap)}
      title={t('jumpButtonLabel', { mapTitle: getQuickLinkTitle(selectedMap) })}
      type="button"
    >
      {!!selectedMap.icon && <img alt="" className={styles.icon} src={calcUrlForImage(selectedMap.icon.src)} />}

      <span className={styles.title}>{getQuickLinkTitle(selectedMap)}</span>
    </button>

    {hasMenu && <>
      <button
        aria-label={t('homeMenuToggleLabel')}
        className={styles.toggle}
        title={t('homeMenuToggleLabel')}
        type="button"
        {...menuToggle.toggleProps}
      >
        <ArrowDownSmallIcon aria-hidden="true" className={styles.arrow} />
      </button>

      <Menu
        aria-label={t('homeMenuLabel')}
        className={styles.menu}
        placement="bottom"
        {...menuToggle.menuProps}
        anchor={splitButton}
      >
        {maps.map((map) => <Menu.Option
          aria-checked={map.id === selectedMap.id}
          key={map.id}
          onClick={() => onMapSelect(map)}
          role="menuitemradio"
        >
          {hasOptionIcons && <span aria-hidden="true" className={styles.optionIcon}>
            {!!map.icon && <img alt="" src={calcUrlForImage(map.icon.src)} />}
          </span>}

          {getQuickLinkTitle(map)}
        </Menu.Option>)}

        {canShowUserLocation && <>
          <Menu.Divider />

          <Menu.Option onClick={() => onCurrentLocationClick(userLocation)}>
            <span aria-hidden="true" className={styles.optionIcon}>
              <GpsLocationIcon />
            </span>

            {t('myCurrentLocationOptionLabel')}
          </Menu.Option>
        </>}
      </Menu>
    </>}
  </div>;
};

export default NavHomeMenu;
