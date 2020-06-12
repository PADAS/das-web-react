import React, { useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';

const ReloadOnProfileChange = (props) => {
  const { selectedUserProfile } = props;
  
  const [initialized, setInit] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInit(true);
    } else {
      window.location.reload();
    }
  }, [selectedUserProfile]); // eslint-disable-line

  return null;
};


const mapStateToProps = ({ data: { selectedUserProfile } }) => ({ selectedUserProfile });

export default connect(mapStateToProps, null)(memo(ReloadOnProfileChange));