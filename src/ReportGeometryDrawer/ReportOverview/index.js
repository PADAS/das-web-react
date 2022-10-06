import React, { memo, useCallback, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSimpleIcon } from '../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../common/images/icons/arrow-up-simple.svg';
import { ReactComponent as InformationIcon } from '../../common/images/icons/information.svg';
import { ReactComponent as TrashCanIcon } from '../../common/images/icons/trash-can.svg';
import { ReactComponent as UndoArrowIcon } from '../../common/images/icons/undo-arrow.svg';

import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';

import ReportListItem from '../../ReportListItem';

import styles from './styles.module.scss';

const ReportOverview = ({
  isDiscardButtonDisabled,
  isUndoButtonDisabled,
  onClickDiscard,
  onClickUndo,
  onShowInformationModal,
}) => {
  const event = useSelector((state) => state.view.mapLocationSelection.event);

  const { mapDrawingData } = useContext(MapDrawingToolsContext);

  const [isOpen, setIsOpen] = useState(true);

  const onClickInformationIcon = useCallback((event) => {
    event.stopPropagation();

    onShowInformationModal();
  }, [onShowInformationModal]);

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

        <div className={styles.measurements}>
          <div>
            {`Area: ${mapDrawingData?.fillLabelPoint?.properties?.areaLabel || '0km²'}`}
          </div>

          <div>
            {`Perimeter: ${mapDrawingData?.drawnLineSegments?.properties?.lengthLabel || '0km'}`}
          </div>
        </div>

        <div className={styles.separator} />

        <div className={styles.buttons}>
          <OverlayTrigger
            placement="bottom"
            overlay={(props) => <Tooltip {...props}>Reverse your last action</Tooltip>}
          >
            <Button
              className={styles.undoButton}
              disabled={isUndoButtonDisabled}
              onClick={onClickUndo}
              onFocus={(event) => event.target.blur()}
              type="button"
              variant="secondary"
            >
              <UndoArrowIcon />
              Undo
            </Button>
          </OverlayTrigger>

          <OverlayTrigger
            placement="bottom"
            overlay={(props) => <Tooltip {...props}>Remove all points</Tooltip>}
          >
            <Button
              className={styles.discardButton}
              disabled={isDiscardButtonDisabled}
              onClick={onClickDiscard}
              onFocus={(event) => event.target.blur()}
              type="button"
              variant="secondary"
            >
              <TrashCanIcon />
              Discard
            </Button>
          </OverlayTrigger>
        </div>
      </div>
    </Collapse>
  </div>;
};

ReportOverview.propTypes = {
  isDiscardButtonDisabled: PropTypes.bool.isRequired,
  isUndoButtonDisabled: PropTypes.bool.isRequired,
  onClickDiscard: PropTypes.func.isRequired,
  onClickUndo: PropTypes.func.isRequired,
  onShowInformationModal: PropTypes.func.isRequired,
};

export default memo(ReportOverview);
