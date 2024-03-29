import React, { memo } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../../common/images/icons/arrow-down-small.svg';
import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';

import { BREAKPOINTS } from '../../constants';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { useMatchMedia } from '../../hooks';
import { userLocationCanBeShown as userLocationCanBeShownSelector } from '../../selectors';

import NavHomeItem from '../NavHomeItem';

import styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const NavHomeMenu = function NavHomeMenu({ maps, onCurrentLocationClick, onMapSelect, selectedMap }) {
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav.navHomeMenu' });

  const isMediumLayout = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const userLocation = useSelector((state) => state.view.userLocation);
  const userLocationCanBeShown = useSelector(userLocationCanBeShownSelector);

  return <Dropdown
      align="end"
      className="home-select"
      onToggle={(isOpen) => mainToolbarTracker.track(`${isOpen ? 'Open':'Close'} Home Area Menu`)}
    >
    <Dropdown.Toggle className={styles.toggle} title={t('homeMenuToggleTitle')}>
      <NavHomeItem {...selectedMap} showIcon />

      {isMediumLayout && <ArrowDownSmallIcon />}
    </Dropdown.Toggle>

    <Dropdown.Menu className={styles.menu}>
      {maps.map((map) => <Dropdown.Item
        active={selectedMap.id === map.id ? 'active' : null}
        as="button"
        className={styles.listItem}
        key={map.id}
        onClick={() => onMapSelect(map)}
      >
        <NavHomeItem {...map} />
      </Dropdown.Item>)}

      {userLocationCanBeShown && <>
        <Dropdown.Divider />

        <Dropdown.Item className={styles.currentLocationJump} onClick={() => onCurrentLocationClick(userLocation)}>
          <h6>
            <GpsLocationIcon /> {t('myCurrentLocationItem')}
          </h6>
        </Dropdown.Item>
      </>}
    </Dropdown.Menu>
  </Dropdown>;
};

NavHomeMenu.propTypes = {
  maps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
  })).isRequired,
  onCurrentLocationClick: PropTypes.func.isRequired,
  onMapSelect: PropTypes.func.isRequired,
  selectedMap: PropTypes.shape({
    id: PropTypes.string,
  }).isRequired,
};

export default memo(NavHomeMenu);
