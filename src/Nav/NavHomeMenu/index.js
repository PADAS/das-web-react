import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';

import { calcUrlForImage } from '../../utils/img';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../../utils/analytics';
import useMenuToggle from '../../hooks/useMenuToggle';
import { userLocationCanBeShown } from '../../selectors';

import Menu from '../../Menu';

import * as styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

// The admin may set only a map's name; its title is an optional attribute.
const getMapTitle = (map) => map.title || map.name;

const trackMenuToggle = (isShown) => mainToolbarTracker.track(`${isShown ? 'Open' : 'Close'} Home Area Menu`);

const NavHomeMenu = ({ maps, onCurrentLocationClick, onMapSelect, selectedMap }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav.navHomeMenu' });

  const menuToggle = useMenuToggle({ onToggle: trackMenuToggle });

  const canShowUserLocation = useSelector(userLocationCanBeShown);
  const userLocation = useSelector((state) => state.view.userLocation);

  return <div className={styles.navHomeMenu}>
    <button
      aria-label={t('homeMenuToggleLabel', { mapTitle: getMapTitle(selectedMap) })}
      className={`${styles.toggle} ${selectedMap.icon ? styles.hasIcon : ''}`}
      title={t('homeMenuLabel')}
      type="button"
      {...menuToggle.toggleProps}
    >
      {!!selectedMap.icon && <img alt="" className={styles.icon} src={calcUrlForImage(selectedMap.icon.src)} />}

      {!!getMapTitle(selectedMap) && <span className={styles.title}>{getMapTitle(selectedMap)}</span>}

      <ArrowDownSmallIcon aria-hidden="true" className={styles.arrow} />
    </button>

    <Menu
      aria-label={t('homeMenuLabel')}
      className={styles.menu}
      placement="bottom"
      {...menuToggle.menuProps}
    >
      {maps.map((map) => <Menu.Option
        aria-checked={map.id === selectedMap.id}
        key={map.id}
        onClick={() => onMapSelect(map)}
        role="menuitemradio"
      >
        {getMapTitle(map)}
      </Menu.Option>)}

      {canShowUserLocation && <>
        <Menu.Divider />

        <Menu.Option onClick={() => onCurrentLocationClick(userLocation)}>
          <GpsLocationIcon aria-hidden="true" />

          {t('myCurrentLocationOptionLabel')}
        </Menu.Option>
      </>}
    </Menu>
  </div>;
};

export default NavHomeMenu;
