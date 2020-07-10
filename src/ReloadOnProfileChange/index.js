import { useEffect, useState, memo } from 'react';
import { connect } from 'react-redux';

const ReloadOnProfileChange = (props) => {
  const { selectedUserProfile } = props;
  
  const [initialized, setInit] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInit(true);
    } else {
      setTimeout(() => {
        window.location.reload(true);
      }, [1000]);
    }
  }, [selectedUserProfile]); // eslint-disable-line

  return null;
};


const mapStateToProps = ({ data: { selectedUserProfile } }) => ({ selectedUserProfile });

export default connect(mapStateToProps, null)(memo(ReloadOnProfileChange));