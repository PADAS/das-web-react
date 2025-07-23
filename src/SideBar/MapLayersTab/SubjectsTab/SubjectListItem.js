import React, { memo, useMemo, Fragment } from 'react';
import SubjectControls from '../../../SubjectControls';
import isEmpty from 'lodash/isEmpty';

import { isRadioWithImage, subjectIsStatic, getSubjectDefaultDeviceProperty } from '../../../utils/subjects';

import DateTime from '../../../DateTime';

import * as mapLayersStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const SubjectListItem = (props) => {
  const { map, ...subject } = props;

  const subjectRadioImage = useMemo(() => isRadioWithImage(props), [props]);
  const isStaticTypeObject = subjectIsStatic(subject);
  const defaultProperty = getSubjectDefaultDeviceProperty(subject);

  return <Fragment>
    <p className={mapLayersStyles.itemTitle} data-testid='subject-item-name'>
      {subjectRadioImage && <img src={subjectRadioImage} alt={subject.name} />}
      <span> {subject.name} </span>
      {!isEmpty(defaultProperty) && <span className={mapLayersStyles.defaultProperty}>{`${defaultProperty.label}: ${defaultProperty.value} ${defaultProperty.units}`}</span>}
    </p>

    {subject.last_position?.properties?.coordinateProperties?.time && <DateTime
      className={styles.subjectDateTime}
      date={subject.last_position.properties.coordinateProperties.time}
    />}

    <SubjectControls showLabels={false} className={mapLayersStyles.controls} map={map} showTitles={false} subject={subject} showTrackButton={!isStaticTypeObject} showHeatmapButton={!isStaticTypeObject}/>
  </Fragment>;
};

export default memo(SubjectListItem);
