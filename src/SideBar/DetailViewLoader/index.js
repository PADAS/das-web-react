import MoonLoader from 'react-spinners/MoonLoader';

import { COLOR_TOKENS } from '../../utils/colors';
import * as styles from './styles.module.scss';

const LOADER_SIZE = 50;

const DetailViewLoader = ({ className = '', label, ...otherProps }) => <div
    className={`${styles.detailViewLoader} ${className}`}
    role="status"
    {...otherProps}
  >
  <MoonLoader color={COLOR_TOKENS['ui-cta-primary']} size={LOADER_SIZE} />

  <span className="sr-only">{label}</span>
</div>;

export default DetailViewLoader;
