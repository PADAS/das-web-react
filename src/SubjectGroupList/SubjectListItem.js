import React, { memo, useMemo } from 'react';
import SubjectControls from '../SubjectControls';
import isEmpty from 'lodash/isEmpty';

import { isRadioWithImage, subjectIsStatic, getSubjectDefaultDeviceProperty } from '../utils/subjects';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => {
  const { map, ...subject } = props;

  const subjectRadioImage = useMemo(() => isRadioWithImage(props), [props]);
  const isStaticTypeObject = subjectIsStatic(subject);
  const defaultProperty = getSubjectDefaultDeviceProperty(subject);

  return <>
    <p className={listStyles.itemTitle} data-testid='subject-item-name'>
      {subjectRadioImage && <img src={subjectRadioImage} alt={subject.name} />}
      <span> {subject.name} </span>
      {!isEmpty(defaultProperty) && <span className={listStyles.defaultProperty}>{`${defaultProperty.label}: ${defaultProperty.value} ${defaultProperty.units}`}</span>}
    </p>
    <SubjectControls showLabels={false} className={listStyles.controls} map={map} showTitles={false} subject={subject} showTrackButton={!isStaticTypeObject} showHeatmapButton={!isStaticTypeObject}/>
  </>;
};

export default memo(SubjectListItem);
