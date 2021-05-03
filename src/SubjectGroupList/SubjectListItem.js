import React, { memo, useMemo, Fragment } from 'react';
import SubjectControls from '../SubjectControls';

import { isRadioWithImage } from '../utils/subjects';

import listStyles from '../SideBar/styles.module.scss';

const SubjectListItem = (props) => { // eslint-disable-line react/display-name

  const subjectRadioImage = useMemo(() => isRadioWithImage(props), [props]);

  const { map, ...rest } = props;
  return <Fragment>
    <span className={listStyles.itemTitle}>{subjectRadioImage && <img src={subjectRadioImage} alt={props.name} />} {props.name}</span>
    <SubjectControls className={listStyles.controls} map={map} showTitles={false} subject={rest} />
  </Fragment>;
};

export default memo(SubjectListItem);
