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

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../../utils/analytics';
import { MapDrawingToolsContext } from '../../MapDrawingTools/ContextProvider';

import ReportListItem from '../../ReportListItem';
import PatrolListItem from '../../PatrolListItem';

import { MAP_LOCATION_SELECTION_MODES } from '../../ducks/map-ui';
import { useEventGeoMeasurementDisplayStrings } from '../../hooks/geometry';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

const TOOLTIP_SHOW_TIME = 500;
const TOOLTIP_HIDE_TIME = 150;

const ReportOverview = ({
  isDiscardButtonDisabled,
  isUndoButtonDisabled,
  onClickDiscard: onClickDiscardCallback,
  onClickUndo: onClickUndoCallback,
  onShowInformationModal,
}) => {
  const event = useSelector((state) => state.view.mapLocationSelection?.event);
  const patrol = useSelector((state) => state.view.mapLocationSelection?.patrol);

  const originalEvent = useSelector((state) =>
    event
    && state.data.eventStore[event.id]
  );

  const mapLocationSelection = useSelector(({ view: { mapLocationSelection } }) => mapLocationSelection);

  const isDrawingEventGeometry =
    !!mapLocationSelection.isPickingLocation
    && (
      mapLocationSelection.mode
      === MAP_LOCATION_SELECTION_MODES.EVENT_GEOMETRY
    );

  const { mapDrawingData } = useContext(MapDrawingToolsContext);

  const [isOpen, setIsOpen] = useState(true);

  const [perimeterDisplayString, areaDisplayString] = useEventGeoMeasurementDisplayStrings({ geometry: mapDrawingData?.fillPolygon }, originalEvent);

  const onClickInformationIcon = useCallback((event) => {
    event.stopPropagation();

    onShowInformationModal();

    eventReportTracker.track('Click info button in report area map');
  }, [onShowInformationModal]);

  const onClickHeader = useCallback(() => {
    setIsOpen(!isOpen);

    eventReportTracker.track('Clicks the collapse/ expand button');
  }, [isOpen]);

  const onClickUndo = useCallback((...args) => {
    onClickUndoCallback(...args);

    eventReportTracker.track('Clicks undo while drawing area');
  }, [onClickUndoCallback]);

  const onClickDiscard = useCallback((...args) => {
    onClickDiscardCallback(...args);

    eventReportTracker.track('Clicks discard while drawing area');
  }, [onClickDiscardCallback]);

  const title =
  isDrawingEventGeometry
    ? 'Create report area'
    : `Choose ${patrol ? 'patrol' : 'report'} location`;

  const hasData = !!event || !!patrol;
  
  if (!hasData) return null;

  return <div className={styles.reportAreaOverview} data-testid="reportAreaOverview-wrapper">
    <div className={styles.header} onClick={onClickHeader}>
      <h2>{title}</h2>

      <div className={styles.actions}>
        {onShowInformationModal && <InformationIcon onClick={onClickInformationIcon} />}

        {isOpen ? <ArrowUpSimpleIcon /> : <ArrowDownSimpleIcon />}
      </div>
    </div>

    <Collapse data-testid="reportOverview-collapse" in={isOpen}>
      <div className={styles.body}>
        {!!event && <ReportListItem className={styles.reportItem} report={event} />}
        {!!patrol && <PatrolListItem
                patrol={patrol}
                showControls={false}
                 />}

        {isDrawingEventGeometry &&
          <div className={styles.measurements}>
            <div>
              {`Area: ${areaDisplayString}`}
            </div>

            <div>
              {`Perimeter: ${perimeterDisplayString}`}
            </div>
          </div>
        }

        {isDrawingEventGeometry && <>
          <div className={styles.separator} />

          <div className={styles.buttons}>
            <OverlayTrigger
            delay={{ show: TOOLTIP_SHOW_TIME, hide: TOOLTIP_HIDE_TIME }}
            overlay={(props) => <Tooltip {...props}>Reverse your last action</Tooltip>}
            placement="bottom"
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
            delay={{ show: TOOLTIP_SHOW_TIME, hide: TOOLTIP_HIDE_TIME }}
            overlay={(props) => <Tooltip {...props}>Remove all points</Tooltip>}
            placement="bottom"
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
        </>
        }
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
