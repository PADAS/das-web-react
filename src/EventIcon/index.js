import React, { memo, forwardRef, useContext, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import PropTypes from 'prop-types';

import { SvgIconContext } from '../SvgIconDataContext';
import { calcIconColorByPriority, calcTopRatedReportAndTypeForCollection } from '../utils/event-types';
import { displayEventTypes } from '../selectors/event-types';

import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const calcSvgImageIconId = ({ icon_id, priority, height, width }) => {
  let string = `${icon_id}`;

  [priority, height, width]
    .filter(item => item === 0 || !!item)
    .forEach((item) => {
      string+=`-${item}`;
    });

  return string;
};

const getImageAssemblyDataFromReport = (report) => {
  let reportTypeIconId = report?.image_url?.includes('/static/generic-') ? 'generic_rep' : report.icon_id;
  if (reportTypeIconId === 'incident_collection') {
    reportTypeIconId += '_rep';
  }
  const color = calcIconColorByPriority(report.priority || report.default_priority);

  return { color, report, reportTypeIconId };
};

const createImagePropsForReportFromSvgString = (svgString, report, colorArg) => {
  const { height, priority, width } = report;
  const color = colorArg || calcIconColorByPriority(priority);

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  svgEl.style.fill = `${color} !important`;
  svgEl.setAttribute('fill', color);

  const svgContent = svgEl.querySelectorAll('*');

  svgContent.forEach((item) => {
    const attributesToRemove = ['class', 'style', 'fill', 'stroke'];
    attributesToRemove.forEach(attr => item.removeAttribute(attr));
  });

  var xml = (new XMLSerializer()).serializeToString(svgEl);
  const withStyleElRemoved = xml.replace(/<style>.*?<\/style>/g, '');

  const SVG64 = btoa(withStyleElRemoved);
  const src = `data:image/svg+xml;base64,${SVG64}`;

  return {
    src,
    width,
    height,
  };

};

// const { is_collection } = report;
// const isPatrol = !!report?.patrol_segments?.length && isObject(report.patrol_segments[0]);

// if (!is_collection) {
//   let iconId = null;
//   const matchingEventType = eventTypes.find(({ value }) => value ===
//    ( isPatrol ? report?.patrol_segments?.[0]?.patrol_type : report.event_type));
//   if (matchingEventType) iconId = matchingEventType.icon_id;
//   return <DasIcon type='events' iconId={iconId} {...rest} />;
// }

// const topRatedReportAndType = calcTopRatedReportAndTypeForCollection(report, eventTypes);

// return <span ref={ref} className={styles.wrapper}>
//   <DasIcon type='events' iconId='incident_collection'  {...rest}  />
//   {topRatedReportAndType && topRatedReportAndType.event_type && <DasIcon type='events' {...rest}
//     style={{
//       fill: 'white',
//     }}
//     className={styles.content} iconId={topRatedReportAndType.event_type.icon_id} />}
// </span>;

const EventIcon = forwardRef(({ className = styles.icon, fromSprite = true, report, color = 'white' }, _ref) => { /* eslint-disable-line react/display-name */

  const eventTypes = useSelector(({ data: { eventTypes } }) => eventTypes);

  const {
    fetchSvgIconData,
    svgIconData,
  } = useContext(SvgIconContext);

  const imageAssemblyData = useMemo(() =>
    getImageAssemblyDataFromReport(report)
  , [report]);

  const ChildIcon = useMemo(() => {
    return ({ className }) => { /* eslint-disable-line react/display-name */

      const topRatedChild = calcTopRatedReportAndTypeForCollection(report, eventTypes);

      if (!topRatedChild) return null;

      const { related_event } = topRatedChild;

      return <EventIcon className={className} report={related_event} color={color} />;
    };

  }, [color, eventTypes, report]);

  const iconSvgString = useMemo(() =>
    svgIconData?.[imageAssemblyData?.reportTypeIconId]
  , [svgIconData, imageAssemblyData?.reportTypeIconId]);

  useEffect(() => {
    if (!iconSvgString) {
      fetchSvgIconData(imageAssemblyData.reportTypeIconId, fromSprite);
    }
  }, [fetchSvgIconData, fromSprite, iconSvgString, imageAssemblyData.reportTypeIconId]);

  const imageProps = useMemo(() =>
    createImagePropsForReportFromSvgString(iconSvgString, report, color)
  , [color, iconSvgString, report]);


  return <div className={styles.wrapper}>
    {!iconSvgString && <LoadingOverlay className={styles.spinner} />}

    {iconSvgString &&
      <>
        {report.is_collection && <ChildIcon className={styles.child} />}
        <img alt={report.title} {...imageProps} className={className} />
      </>
    }
  </div>;

});

export default memo(EventIcon);

EventIcon.propTypes = {
  report: PropTypes.object.isRequired,
};