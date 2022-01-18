import React, { memo, useMemo, Fragment } from 'react';
import SubjectControls from '../SubjectControls';

import { isRadioWithImage } from '../utils/subjects';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => { // eslint-disable-line react/display-name

  const { map, ...rest } = props;
  const subjectRadioImage = useMemo(() => isRadioWithImage(props), [props]);
  const isStaticTypeObject = props.is_static;
  const defaultProperty = props?.device_status_properties?.find(deviceProperty => deviceProperty?.default ?? false) ?? '';

  return <Fragment>
    <p className={listStyles.itemTitle}>
      {subjectRadioImage && <img src={subjectRadioImage} alt={props.name} />}
      {props.name}
      {isStaticTypeObject && <span>{` ${defaultProperty.label}: ${defaultProperty.value} ${defaultProperty.units}`}</span>}
    </p>
    <SubjectControls showLabels={false} className={listStyles.controls} map={map} showTitles={false} subject={rest} showTrackButton={!isStaticTypeObject} showHeatmapButton={!isStaticTypeObject}/>
  </Fragment>;
};

export default memo(SubjectListItem);
