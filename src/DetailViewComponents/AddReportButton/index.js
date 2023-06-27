import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddButton from '../../AddButton';

import styles from './styles.module.scss';

const AddReportButton = ({ className, ...rest }) => <AddButton
  className={`${className} ${styles.addReportButton}`}
  hideAddPatrolTab
  iconComponent={<DocumentIcon />}
  title="Report"
  {...rest}
/>;

AddReportButton.propTypes = { className: PropTypes.string };

export default memo(AddReportButton);
