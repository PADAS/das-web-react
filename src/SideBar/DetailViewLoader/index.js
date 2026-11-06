import MoonLoader from 'react-spinners/MoonLoader';

import * as styles from './styles.module.scss';

const LOADER_SIZE = 50;

const DetailViewLoader = ({ className = '', label, ...otherProps }) => <div
    className={`${styles.detailViewLoader} ${className}`}
    role="status"
    {...otherProps}
  >
  <MoonLoader color="var(--er-ui-cta-primary)" size={LOADER_SIZE} />

  <span className="sr-only">{label}</span>
</div>;

export default DetailViewLoader;
