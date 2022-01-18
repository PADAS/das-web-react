import React, { memo, useMemo, Fragment } from 'react';
import SubjectControls from '../SubjectControls';

import { isRadioWithImage, isTypeStaticSensor, getSubjectDefaultDeviceProperty } from '../utils/subjects';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => {
  const { map, ...subject } = props;

  const subjectRadioImage = useMemo(() => isRadioWithImage(props), [props]);
  const isStaticTypeObject = isTypeStaticSensor(subject);
  const defaultProperty = getSubjectDefaultDeviceProperty(subject);

  return <Fragment>
    <p className={listStyles.itemTitle}>
      {subjectRadioImage && <img src={subjectRadioImage} alt={subject.name} />}
      {subject.name}
      {isStaticTypeObject && <span>{` ${defaultProperty.label}: ${defaultProperty.value} ${defaultProperty.units}`}</span>}
    </p>
    <SubjectControls showLabels={false} className={listStyles.controls} map={map} showTitles={false} subject={subject} showTrackButton={!isStaticTypeObject} showHeatmapButton={!isStaticTypeObject}/>
  </Fragment>;
};

export default memo(SubjectListItem);
