import React, { useRef, memo } from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { trackEvent } from '../utils/analytics';
import styles from './styles.module.scss';
import { setFilterIncludesStarts } from '../ducks/patrol-filter';

const PatrolSearchSettingsControl = (props) => {
  const { filterIncludesPatrolStarts, setFilterIncludesStarts } = props;
  const formRef = useRef(null);

  const handleOptionChange = (e) => {
    console.log('clicked', e.currentTarget.value);
    e.preventDefault();
    e.stopPropagation();
    setFilterIncludesStarts(e.currentTarget.value === 'start_dates');
  };

  const popover = (
    <Popover id="patrol-search-settings" className={styles.searchSettings} title="Patrol Search Settings">
      <Popover.Content>
        <div className={styles.filterOption}>
          <label>
            <input
              type="radio"
              value="start_dates"
              checked={filterIncludesPatrolStarts}
              onChange={handleOptionChange}
            />
            <span>Include patrols starting within date range</span>
          </label>
        </div>
        <div className={styles.filterOption}>
          <label>
            <input
              type="radio"
              value="overlap_dates"
              checked={!filterIncludesPatrolStarts}
              onChange={handleOptionChange}
            />
            <span>Include patrols whose start to end date range overlaps with date range </span>
          </label>
        </div>
      </Popover.Content>
    </Popover>
  );

  const onButtonClick = () => {
    trackEvent('Map Interaction', 'Clicked Patrol Search Settings button');
  };

  return <OverlayTrigger trigger="click" placement="bottom" rootClose={false} overlay={popover}>
    <button type='button' className={styles.gearButton} ref={formRef}
      onClick={onButtonClick}>
      <GearIcon />
    </button>
  </OverlayTrigger>;
};

const mapStateToProps = ({ data: { filterIncludesPatrolStarts } }) => {
  return {filterIncludesPatrolStarts};
};

export default connect(mapStateToProps, {setFilterIncludesStarts})(memo(PatrolSearchSettingsControl));

PatrolSearchSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};