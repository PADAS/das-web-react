import React, { memo, useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Collapse from 'react-bootstrap/Collapse';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as InformationIcon } from '../../common/images/icons/information.svg';

import { addModal } from '../../ducks/modals';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';

import InformationModal from './../InformationModal';
import ReportListItem from '../../ReportListItem';

import styles from './styles.module.scss';

const ReportOverview = () => {
  const dispatch = useDispatch();

  const event = useSelector((state) => state.view.mapLocationSelection.event);

  const { mapDrawingData } = useContext(MapDrawingToolsContext);

  const [isOpen, setIsOpen] = useState(true);

  const onClickInformationIcon = useCallback((event) => {
    event.stopPropagation();

    dispatch(addModal({
      content: InformationModal,
      forceShowModal: true,
      modalProps: { className: styles.modal },
    }));
  }, [dispatch]);

  return <div className={styles.reportAreaOverview} data-testid="reportAreaOverview-wrapper">
    <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
      <h2>Create Report Area</h2>

      <div className={styles.actions}>
        <InformationIcon onClick={onClickInformationIcon} />

        {isOpen ? <ArrowUpSimpleIcon /> : <ArrowDownSimpleIcon />}
      </div>
    </div>

    <Collapse data-testid="reportOverview-collapse" in={isOpen}>
      <div className={styles.body}>
        <ReportListItem className={styles.reportItem} report={event} />

        <div className={styles.separator} />

        <div className={styles.measurements}>
          <div>
            {`Area: ${mapDrawingData?.fillLabelPoint?.properties?.areaLabel || '0km²'}`}
          </div>

          <div>
            {`Perimeter: ${mapDrawingData?.drawnLineSegments?.properties?.lengthLabel || '0km'}`}
          </div>
        </div>
      </div>
    </Collapse>
  </div>;
};

ReportOverview.defaultProps = {
  area: '0km²',
  perimeter: '0km',
};

ReportOverview.propTypes = {
  area: PropTypes.string,
  perimeter: PropTypes.string,
};

export default memo(ReportOverview);
