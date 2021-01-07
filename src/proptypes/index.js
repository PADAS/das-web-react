import PropTypes from 'prop-types';

const analyticsMetadata = PropTypes.shape({
  category: PropTypes.string.isRequired,
  location: PropTypes.string,
});

export default {
  analyticsMetadata,
};