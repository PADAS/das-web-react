import React, { useRef, memo } from 'react';
import { connect } from 'react-redux';
import { OverlayTrigger, Popover } from 'react-bootstrap';

import { ReactComponent as GearIcon } from '../common/images/icons/gear.svg';
import { trackEvent } from '../utils/analytics';
import styles from './styles.module.scss';
import { setPatrolFilterAllowsOverlap } from '../ducks/patrol-filter';

const PatrolSearchSettingsControl = (props) => {
  const { patrolsOverlapFilter, setPatrolFilterAllowsOverlap } = props;
  const formRef = useRef(null);

  const handleOptionChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPatrolFilterAllowsOverlap(e.currentTarget.value === 'overlap_dates');
  };

  const popover = (
    <Popover id="patrol-search-settings" className={styles.searchSettings} title="Patrol Search Settings">
      <Popover.Content>
        <div className={styles.filterOption}>
          <label>
            <input
              type="radio"
              value="start_dates"
              checked={!patrolsOverlapFilter}
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
              checked={patrolsOverlapFilter}
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

const mapStateToProps = ({ data: { patrolsOverlapFilter } }) => {
  return {patrolsOverlapFilter};
};

export default connect(mapStateToProps, {setPatrolFilterAllowsOverlap})(memo(PatrolSearchSettingsControl));

PatrolSearchSettingsControl.defaultProps = {
  defaultSearchSetting: 'start_dates',
};